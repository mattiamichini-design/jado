import { readFile, writeFile, readdir, lstat, readlink, realpath, mkdir, mkdtemp, cp, rm, symlink, rename, rmdir, chmod } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { agentPrompt, profile } from '../../lib/jado/render.ts';
import { compile } from './compile.mjs';
import { mayCopy } from './import-local.mjs';

const run = promisify(execFile);
const sourceRoot = fileURLToPath(new URL('../../', import.meta.url));
const skillsCLI = fileURLToPath(new URL('../../node_modules/skills/bin/cli.mjs', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const inside = (root, file) => file === root || file.startsWith(root + path.sep);
const entry = '# Design with JADO\n\nFor design research, UX, UI, references and moodboards, interface content, design systems, implementation or design review, read `.jado/instructions.md` before planning or editing and follow the current route. The primary agent coordinates delegations to the route’s `jado-agent-*` profiles. Preserve product, design system, verification, Git and release rules.\n';
const nativeDirs = { codex: '.codex/agents', 'claude-code': '.claude/agents', opencode: '.opencode/agents' };

async function exists(file) { try { return await lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
async function files(root) {
  const result = [];
  async function walk(dir) {
    for (const e of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir,e.name);
      if (!mayCopy(file)) continue;
      if (e.isSymbolicLink()) throw new Error(`Source contains a symlink: ${file}`);
      if (e.isDirectory()) await walk(file); else if (e.isFile()) result.push(file);
    }
  }
  await walk(root); return result;
}
async function state(target, relative) {
  const file = path.resolve(target,relative);
  if (!inside(target,file) || file === target) throw new Error(`Invalid path: ${relative}`);
  for (let dir = path.dirname(file); dir !== target; dir = path.dirname(dir)) {
    const parent = await exists(dir);
    if (parent && (!parent.isDirectory() || parent.isSymbolicLink())) throw new Error(`The directory must be real, not a symlink: ${path.relative(target,dir)}`);
  }
  const found = await exists(file);
  if (!found) return null;
  if (found.isSymbolicLink()) return { link: await readlink(file) };
  if (found.isDirectory()) {
    const entries = [];
    const visit = async dir => {
      for (const child of (await readdir(dir)).sort()) {
        const full = path.join(dir,child), info = await lstat(full);
        if (!info.isFile() && !info.isDirectory() && !info.isSymbolicLink()) throw new Error(`Unsupported file type: ${full}`);
        entries.push([path.relative(file,full),info.mode & 0o777,info.isSymbolicLink() ? ['link',await readlink(full)] : info.isDirectory() ? ['directory'] : ['file',hash(await readFile(full))]]);
        if (info.isDirectory()) await visit(full);
      }
    };
    await visit(file); return {directory:true,hash:hash(json(entries)),mode:found.mode & 0o777};
  }
  if (!found.isFile()) throw new Error(`Unsupported file type: ${relative}`);
  return { hash: hash(await readFile(file)), mode: found.mode & 0o777 };
}
const same = (a,b) => a?.hash && b?.hash ? a.hash === b.hash && (b.mode === undefined || a.mode === b.mode) : JSON.stringify(a) === JSON.stringify(b);
const signature = item => item.link ? { link:item.link } : { hash:hash(item.content), mode:item.mode ?? 0o644 };

// Read-only reviewers keep capture and inspection tools but lose known canvas mutations.
// Claude Code matches MCP tools by full name; unknown servers stay protected only by the prompt.
const paperWrites = ['create_artboard','create_file','create_page','create_tokens','delete_nodes','duplicate_nodes','move_nodes','rename_nodes','rename_pages','rename_resource','set_comment_thread_status','set_text_content','set_tokens','update_styles','write_html'];
const figmaConsoleWrites = ['figma_execute','figma_execute_across_files','figma_delete_node','figma_create_child','figma_clone_node','figma_move_node','figma_resize_node','figma_rename_node','figma_set_fills','figma_set_strokes','figma_set_text','figma_set_image_fill','figma_set_instance_properties','figma_set_description','figma_instantiate_component','figma_create_variable','figma_update_variable','figma_delete_variable','figma_batch_create_variables','figma_batch_update_variables','figma_post_comment','figma_delete_comment','figma_create_component_set','figma_arrange_component_set'];
const figmaWrites = ['use_figma','generate_figma_design','create_new_file','upload_assets'];
export const readOnlyDenied = ['Write','Edit','NotebookEdit','Bash',
  ...['paper','Paper','paper-direct'].flatMap(server => paperWrites.map(tool => `mcp__${server}__${tool}`)),
  ...figmaConsoleWrites.map(tool => `mcp__figma-console__${tool}`),
  ...figmaWrites.map(tool => `mcp__figma__${tool}`)];

export function adapter(agent, tool, root = 'the JADO root received in jadoRoot') {
  // Native discovery gets a real small profile; skills use individual relative links.
  if (tool === 'codex') return profile(agent,root);
  const header = tool === 'claude-code'
    ? { name:agent.id, description:agent.description, model:agent.claude.model, effort:agent.claude.effort, ...(agent.sandbox === 'read-only' ? { permissionMode:'plan', disallowedTools:readOnlyDenied } : {}) }
    : { description:agent.description, mode:'subagent', ...(agent.sandbox === 'read-only' ? { permission:{ '*':'deny', read:'allow', glob:'allow', grep:'allow', list:'allow', webfetch:'allow' } } : {}) };
  return `---\n${stringify(header)}---\n\n${agentPrompt(agent,root)}`;
}

export async function prepareInstall({ target, tools, source = sourceRoot, loadPackage, component = 'all', installedRoot }) {
  target = await realpath(path.resolve(target)); source = await realpath(source);
  if (inside(source,target) || inside(target,source)) throw new Error('Source and destination must be separate repositories.');
  if (!installedRoot && await exists(path.join(target, '.jado/install.json'))) {
    const { prepareLocalUpdate } = await import('./setup.mjs');
    return prepareLocalUpdate({ target, tools, source, component, loadPackage });
  }
  if (!(await lstat(target)).isDirectory()) throw new Error('The destination must be an existing directory.');
  tools = [...new Set(tools)].sort();
  if (!tools.length || tools.some(t => !/^[a-z][a-z0-9-]*$/.test(t))) throw new Error('Select at least one tool with --agents; there is no implicit selection.');
  await compile(source,true);
  const metadataRoot = component === 'skills' && installedRoot ? installedRoot : source;
  const catalog = JSON.parse(await readFile(path.join(metadataRoot,'registry/jado-catalog.json'),'utf8'));
  const sourceLock = JSON.parse(await readFile(path.join(metadataRoot,'jado/skill-lock.json'),'utf8'));
  const runtimeLock = { version:3, skills:{} };
  loadPackage ??= (await import('./setup.mjs')).fetchPackage;
  const skills = catalog.skills.filter(s => s.design);
  if (new Set(skills.map(s => s.name)).size !== skills.length) throw new Error('Duplicate names in the installation catalog.');
  const workspace = await mkdtemp(path.join(tmpdir(),'jado-install-'));
  try {
    const bundle = path.join(workspace,'bundle'), stage = path.join(workspace,'project');
    await mkdir(bundle); await mkdir(stage);
    for (const s of skills) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.name)) throw new Error(`Non-portable skill name: ${s.name}`);
      let folder;
      if (s.path.startsWith('skills/')) {
        const record = sourceLock.skills[s.id];
        if (!record) throw new Error(`Missing upstream source: ${s.id}`);
        if (component === 'method' && installedRoot && await exists(path.join(installedRoot,s.path))) {
          folder = path.join(installedRoot,path.dirname(s.path));
          runtimeLock.skills[s.id] = JSON.parse(await readFile(path.join(installedRoot,'jado/skill-lock.json'))).skills[s.id] ?? record;
        } else {
          const fresh = await loadPackage(s.id,record,s.name,workspace); folder = fresh.folder; runtimeLock.skills[s.id] = fresh.record;
        }
      } else folder = path.resolve(metadataRoot,path.dirname(s.path));
      if (!await exists(path.join(folder,'SKILL.md'))) throw new Error(`Missing upstream procedure: ${s.id}`);
      await cp(folder,path.join(bundle,s.name),{recursive:true,filter:mayCopy});
      s.hash = hash(await readFile(path.join(bundle,s.name,'SKILL.md')));
    }
    const {stdout} = await run(process.execPath,[skillsCLI,'add',bundle,'--skill',...skills.map(s=>s.name),'--agent',...tools,'--yes','--json','--copy'],{
      cwd:stage, maxBuffer:8*1024*1024,
      env:{...process.env,DISABLE_TELEMETRY:'1',DO_NOT_TRACK:'1',XDG_STATE_HOME:path.join(workspace,'state'),NODE_DISABLE_COMPILE_CACHE:'1'}
    });
    // Use public CLI output on disk; no imports of skills CLI internals or duplicated tool path table.
    const staged = (await files(stage)).filter(f => path.basename(f)==='SKILL.md');
    const byName = new Map(skills.map(s=>[s.name,s]));
    const links = [];
    for (const f of staged) {
      const parts = path.relative(stage,f).split(path.sep);
      const skillIndex = parts.indexOf('skills');
      if (skillIndex < 0 || parts.length !== skillIndex + 3) continue; // Bundled subskills remain resources of their selected package.
      const name = path.basename(path.dirname(f)), s = byName.get(name);
      if (!s || !(await readFile(f)).equals(await readFile(path.join(bundle,s.name,'SKILL.md')))) throw new Error(`Unexpected installer output: ${f}`);
      const relative = path.relative(stage,path.dirname(f));
      if (path.isAbsolute(relative) || relative.split(path.sep).some(p=>p==='..' || p==='.')) throw new Error(`Unsupported discovery path: ${relative}`);
      links.push({relative, source:path.join('.jado',path.dirname(s.path))});
    }
    if (!links.length || skills.some(s => !links.some(l=>path.basename(l.relative)===s.name))) throw new Error(`Incomplete skill installation: ${stdout.slice(-1000)}`);
    const outputs = new Map();
    for (const directory of ['.agents/skills','jado/policies','jado/runtime']) {
      for (const f of directory === 'jado/runtime' && !await exists(path.join(metadataRoot,directory)) ? [] : await files(path.join(metadataRoot,directory))) outputs.set(path.join('.jado',path.relative(metadataRoot,f)),{content:await readFile(f),mode:((await lstat(f)).mode & 0o111) ? 0o755 : 0o644});
    }
    for (const s of skills.filter(s => s.path.startsWith('skills/'))) {
      const folder = path.join(bundle,s.name);
      for (const f of await files(folder)) outputs.set(path.join('.jado','skills',s.id,path.relative(folder,f)),{content:await readFile(f),mode:(await lstat(f)).mode & 0o111 ? 0o755 : 0o644});
    }
    for (const relative of ['jado/workflows.json','jado/agents.json','jado/tools.json','jado/skill-lock.json','jado/skill-inventory.json','registry/jado-catalog.json']) outputs.set(path.join('.jado',relative),{content:await readFile(path.join(metadataRoot,relative))});
    outputs.set('.jado/jado/skill-lock.json',{content:Buffer.from(json(runtimeLock))});
    outputs.set('.jado/registry/jado-catalog.json',{content:Buffer.from(json(catalog))});
    outputs.set('.jado/instructions.md',{content:await readFile(path.join(metadataRoot,'.agents/skills/jado-install/assets/project-entry.md'))});
    for (const l of links) outputs.set(l.relative,{link:path.relative(path.dirname(l.relative),l.source)});
    for (const tool of tools.filter(t=>nativeDirs[t])) for (const agent of catalog.agents) {
      const ext = tool === 'codex' ? 'toml' : 'md';
      const relative = `.jado/agents/${tool}/${agent.id}.${ext}`, content = component === 'skills' && installedRoot ? await readFile(path.join(installedRoot,'agents',tool,`${agent.id}.${ext}`),'utf8') : adapter(agent,tool);
      outputs.set(relative,{content:Buffer.from(content)});
      // Do not rely on undocumented symlink loading of native agent definitions.
      outputs.set(`${nativeDirs[tool]}/${agent.id}.${ext}`,{content:Buffer.from(content)});
    }
    const previous = await state(target,'.jado/install.json');
    const manifest = previous ? JSON.parse(await readFile(path.join(target,'.jado/install.json'),'utf8')) : null;
    if (manifest && (manifest.schemaVersion !== 1 || !manifest.files || typeof manifest.files !== 'object')) throw new Error('Invalid JADO manifest.');
    const owned = manifest?.files ?? {};
    for (const relative of Object.keys(owned)) {
      const normalized = path.normalize(relative);
      if (normalized !== relative || path.isAbsolute(relative) || relative.split(path.sep).includes('..') || !(relative.startsWith('.jado/') || ['AGENTS.md','CLAUDE.md','.codex/config.toml'].includes(relative) || /^\.(codex|claude|opencode)\/agents\/jado-[a-z-]+\.(toml|md)$/.test(relative) || /^(?:\.?[a-z0-9-]+\/)*skills\/[a-z0-9-]+$/.test(relative))) throw new Error(`Manifest contains an unrelated path: ${relative}`);
    }
    const codexConfig = '.codex/config.toml';
    const configBefore = tools.includes('codex') ? await state(target,codexConfig) : null;
    let configReview = false;
    if (tools.includes('codex')) {
      const bindings = catalog.agents.map(a=>`[agents.${JSON.stringify(a.id)}]\ndescription = ${JSON.stringify(a.description)}\nconfig_file = ${JSON.stringify(`agents/${a.id}.toml`)}\n`).join('\n');
      const content = Buffer.from('# Generated by JADO; relative project role declarations.\n' + bindings);
      outputs.set('.jado/agents/codex-registration.toml',{content});
      if (!configBefore || same(configBefore,owned[codexConfig])) outputs.set(codexConfig,{content});
      else configReview = true; // ponytail: foreign TOML is merged through the reviewed migration.
    }
    const instructions = [];
    for (const name of ['AGENTS.md','AGENTS.override.md','CLAUDE.md','CLAUDE.local.md']) if (await exists(path.join(target,name))) instructions.push(name);
    if (!instructions.includes('AGENTS.md') && (!instructions.includes('AGENTS.override.md') || tools.includes('claude-code'))) outputs.set('AGENTS.md',{content:Buffer.from(entry)});
    if (tools.includes('claude-code') && !instructions.includes('CLAUDE.md') && !instructions.includes('CLAUDE.local.md')) outputs.set('CLAUDE.md',{content:Buffer.from('@AGENTS.md\n')});
    const generatedEntries = {'AGENTS.md':entry,'CLAUDE.md':'@AGENTS.md\n'};
    const pendingInstructions = [];
    for (const name of instructions) {
      const text = await readFile(path.join(target,name),'utf8');
      if (generatedEntries[name] === text && owned[name] && same(await state(target,name),owned[name])) outputs.set(name,{content:Buffer.from(text)});
      else pendingInstructions.push(name);
    }
    const effectiveInstructions = [...new Set([...instructions,...Object.keys(generatedEntries).filter(name=>outputs.has(name))])].sort();
    const requiresReview = pendingInstructions.length > 0 || configReview || tools.some(t=>!nativeDirs[t]);
    const migration = `# Complete the JADO entry\n\nInitial entries: ${effectiveInstructions.join(', ') || 'no local entry'}. Tools: ${tools.join(', ')}.\n\nRead the effective project instruction chain, including ancestors, subdirectories, linked Markdown and selected tool configuration. Keep global instructions unchanged. Follow .jado/.agents/skills/jado-install/SKILL.md for semantic migration.\n\nReplace previous design routers with this entry while preserving domain, design system, verification, Git and release rules:\n\n${entry}\n${tools.includes('codex') ? 'For Codex, merge .jado/agents/codex-registration.toml declarations into .codex/config.toml when project configuration already exists. Resolve duplicate jado-* roles and preserve other settings. Fragment config_file paths are relative to .codex. Present the diff before editing existing configuration.\n\n' : ''}For Claude, if CLAUDE.md exists, include .jado/instructions.md or @AGENTS.md while preserving other rules. AGENTS.override.md can take precedence in Codex: update the effective entry. For tools without a native JADO adapter, verify their entry too: only skills, not subagents, were prepared.\n\nPresent the diff before replacing existing Markdown. Keep verified local backups and review the diff again if the project changes. Detect UX Planner and use its actual artifact locations and formats in product documents. Keep user flows and journeys outside .jado.\n\nVerify a normal design request with a plan identifying the .jado root, installed revision, route and expected roles. File presence is not evidence that profiles loaded. If Codex excludes local configuration because the project is untrusted, report its message to the user and let them authorize the project in the tool; preserve their personal preferences.\n`;
    outputs.set('.jado/migration.md',{content:Buffer.from(migration)});
    const changes = [], observed = new Map();
    const paths = [...new Set([...outputs.keys(),...Object.keys(owned),'.jado/install.json',...instructions,...(configBefore?[codexConfig]:[])])].sort();
    for (const relative of paths) {
      const before = await state(target,relative); observed.set(relative,before);
      const item = outputs.get(relative);
      if (relative === '.jado/install.json' || (instructions.includes(relative) && !item) || (relative === codexConfig && configReview)) continue;
      if (before && !relative.startsWith('.jado/skills/') && !links.some(l => l.relative === relative) && !same(before,owned[relative]) && (!item || !same(before,signature(item)))) throw new Error(`Collision or local modification: ${relative}. Compare the file before installing.`);
      if (item) { if (!same(before,signature(item))) changes.push({relative,before,after:item}); }
      else if (before) changes.push({relative,before,after:null});
    }
    const payload = {schemaVersion:1,scope:'local',installer:'skills@1.7.0',tools,workflowRevision:hash(await readFile(path.join(metadataRoot,'jado/workflows.json'))),instructionsReview:requiresReview?'required':'verify-in-session',files:Object.fromEntries([...outputs].sort(([a],[b])=>a.localeCompare(b)).map(([name,item])=>[name,signature(item)]))};
    const manifestItem = {content:Buffer.from(json(payload))};
    if (!same(previous,signature(manifestItem))) changes.push({relative:'.jado/install.json',before:previous,after:manifestItem});
    const revision = hash(json({target,tools,observed:[...observed],changes:changes.map(c=>({path:c.relative,after:c.after?signature(c.after):null}))}));
    return {target,tools,revision,changes,observed,requiresReview,summary:{target,tools,revision,packageFiles:outputs.size,discoveryDirectories:[...new Set(links.map(l=>path.dirname(l.relative)))],nativeProfiles:tools.filter(t=>nativeDirs[t]).map(t=>({tool:t,count:catalog.agents.length,directory:nativeDirs[t]})),skillsOnly:tools.filter(t=>!nativeDirs[t]),instructionsReview:requiresReview?'required':'verify-in-session',changes:changes.filter(c=>!c.relative.startsWith('.jado/skills/')&&!c.relative.startsWith('.jado/.agents/')&&!c.relative.startsWith('.jado/jado/')).map(c=>({file:c.relative,action:c.after?(c.before?'update':'create'):'remove'}))}};
  } finally { await rm(workspace,{recursive:true,force:true}); }
}

export async function applyInstall(plan, expectedRevision) {
  if (expectedRevision && expectedRevision !== plan.revision) throw new Error('The plan changed: review the new diff.');
  for (const [file,before] of plan.externalObserved ?? []) if (!same(await state(path.dirname(file), path.basename(file)), before)) throw new Error('The global method changed: prepare the link again.');
  for (const [file,before] of plan.observed) if (!same(await state(plan.target,file),before)) throw new Error(`Destination changed: ${file}. Prepare the plan again.`);
  // ponytail: one project writer; use an exclusive lock, not a job scheduler.
  const lock = path.join(plan.target,'.jado-install.lock');
  await writeFile(lock,'JADO installation in progress\n',{flag:'wx'});
  let backup;
  const applied = [], createdDirs = [];
  try {
    backup = await mkdtemp(path.join(tmpdir(),'jado-backup-'));
    for (const c of plan.changes) if (c.before) {
      const to = path.join(backup,c.relative); await mkdir(path.dirname(to),{recursive:true});
      if (c.before.directory) await cp(path.join(plan.target,c.relative),to,{recursive:true,dereference:false});
      else if (c.before.link) await symlink(c.before.link,to); else { const body = await readFile(path.join(plan.target,c.relative)); if (hash(body) !== c.before.hash) throw new Error(`File changed: ${c.relative}`); await writeFile(to,body,{mode:c.before.mode ?? 0o644}); await chmod(to,c.before.mode ?? 0o644); }
    }
    await writeFile(path.join(backup,'recovery.json'),json(plan.changes.map(c=>({file:c.relative,previous:c.before}))));
    for (const [file,before] of plan.observed) if (!same(await state(plan.target,file),before)) throw new Error(`Destination changed: ${file}. Prepare the plan again.`);
    for (const c of plan.changes) {
      if (!same(await state(plan.target,c.relative),c.before)) throw new Error(`Destination changed: ${c.relative}. Prepare the plan again.`);
      const to = path.join(plan.target,c.relative), dir = path.dirname(to);
      let missing = dir; const dirs = [];
      while (missing !== plan.target && !await exists(missing)) { dirs.push(missing); missing = path.dirname(missing); }
      for (const d of dirs.reverse()) { await mkdir(d); createdDirs.push(d); }
      applied.push(c);
      if (c.after) {
        const temp = `${to}.jado-tmp`; if (await exists(temp)) throw new Error(`Temporary file already exists: ${temp}`);
        try { if (c.after.link) await symlink(c.after.link,temp); else { await writeFile(temp,c.after.content,{flag:'wx',mode:c.after.mode ?? 0o644}); await chmod(temp,c.after.mode ?? 0o644); } if (c.before?.directory) await rm(to,{recursive:true}); await rename(temp,to); } finally { await rm(temp,{force:true}); }
      } else await rm(to,{recursive:!!c.before?.directory});
    }
    for (const c of plan.changes) {
      if (!same(await state(plan.target,c.relative),c.after?signature(c.after):null)) throw new Error(`Verification failed: ${c.relative}`);
      if (c.after?.link) await realpath(path.join(plan.target,c.relative));
    }
  } catch (e) {
    for (const c of applied.reverse()) { const to = path.join(plan.target,c.relative); await rm(to,{force:true,recursive:!!c.before?.directory}); if(c.before) { if(c.before.link) await symlink(c.before.link,to); else await cp(path.join(backup,c.relative),to,{recursive:!!c.before.directory,dereference:false}); } }
    for (const d of createdDirs.reverse()) await rmdir(d).catch(()=>{});
    throw new Error(`${e.message} Backup: ${backup ?? "not created"}`,{cause:e});
  } finally { await rm(lock,{force:true}); }
  return {backup,instructionsReview:plan.requiresReview?'required':'verify-in-session',next:'Read .jado/migration.md and verify the effective entry in a new session of the selected tool.'};
}

export { exists, files, state, same, signature, hash, json, inside, sourceRoot, skillsCLI };

export async function main(args = process.argv.slice(2)) {
  const { runSetup } = await import('./setup.mjs');
  return runSetup(args);
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
