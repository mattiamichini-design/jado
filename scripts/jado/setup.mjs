import { readFile, writeFile, mkdir, mkdtemp, rm, realpath, lstat, readdir, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { parse as yaml } from 'yaml';
import { prepareInstall, applyInstall, exists, state, same, signature, hash, json, inside, sourceRoot, skillsCLI } from './install.mjs';

const run = promisify(execFile);
const begin = '# BEGIN JADO — managed design entry';
const end = '# END JADO — managed design entry';
const safeName = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));

export function locations(userRoot = homedir()) {
  const native = userRoot === homedir();
  return {
    userRoot: path.resolve(userRoot),
    jadoRoot: path.resolve(userRoot, '.jado'),
    codex: path.resolve(native && process.env.CODEX_HOME?.trim() || path.join(userRoot, '.codex')),
    'claude-code': path.resolve(native && process.env.CLAUDE_CONFIG_DIR?.trim() || path.join(userRoot, '.claude')),
    opencode: path.resolve(native && process.env.XDG_CONFIG_HOME?.trim() || path.join(userRoot, '.config'), 'opencode'),
    lock: path.resolve(native && process.env.XDG_STATE_HOME?.trim() ? path.join(process.env.XDG_STATE_HOME, 'skills/.skill-lock.json') : path.join(userRoot, '.agents/.skill-lock.json')),
  };
}

// Resolve existing aliases once; the transaction writes only real, bounded parents.
async function physical(file, root) {
  let parent = file;
  const tail = [];
  while (!await exists(parent)) { tail.unshift(path.basename(parent)); parent = path.dirname(parent); }
  const result = path.join(await realpath(parent), ...tail);
  if (!inside(root, result)) throw new Error(`Global path outside the user directory: ${file}. Use a local installation.`);
  return result;
}

export function managedBlock(text, body, prior) {
  const start = text.indexOf(begin), stop = text.indexOf(end);
  if ((start < 0) !== (stop < 0) || start >= 0 && (stop < start || text.indexOf(begin, start + begin.length) >= 0 || text.indexOf(end, stop + end.length) >= 0)) throw new Error('Ambiguous JADO block: compare the instructions.');
  const previous = start < 0 ? null : text.slice(start, stop + end.length);
  if (previous && (!prior || hash(previous) !== prior)) throw new Error('JADO block modified: compare the instructions before updating.');
  const block = `${begin}\n${body.trim()}\n${end}`;
  return { text: previous ? text.slice(0, start) + block + text.slice(stop + end.length) : text + (text && !text.endsWith('\n') ? '\n' : '') + (text ? '\n' : '') + block + '\n', hash: hash(block), review: !previous && !!text.trim() };
}

function designEntry(reference) {
  return `For design research, UX, UI, references and moodboards, interface content, design systems, implementation or review, read ${reference} before planning and follow JADO. The primary agent coordinates the route's jado-agent-* profiles. Preserve the project's domain, components, tokens, accessibility, verification, Git and release rules. Resolve conflicts with previous design routers through assisted migration before starting work.`;
}

export function instructions(root, scope) {
  const location = scope === 'local' ? 'the \`.jado\` directory at the repository root' : `the \`${root}\` directory`;
  return `# Use JADO

## Resolve the method

The method root is ${location}. Read \`jado/runtime/index.json\` and \`.agents/skills/jado-run/SKILL.md\` from that root. Verify the revision, selected tools and readability of required files before declaring the method available.

When a project has a complete local JADO copy, use it for the entire assignment. A manifest with linked scope points to the global installation. Keep the assignment on one method copy.

## Run the assignment

Follow \`.agents/skills/jado-run/SKILL.md\` from that root: it sends questions to ask-jado and work to jado-flow, which owns the dials, routes, delegation and user questions. A \`JADO defaults: …\` line in project instructions sets the project's dial defaults. Pass delegates an absolute jadoRoot and the product root, and read procedures at the exact paths in the selected packet. Consult dependencies.json when present and jado/skill-lock.json in the installed copy.

File presence does not prove native profile loading: report missing profiles or tools.

## Keep product artifacts in the project

Keep product components, tokens and documents in the product repository. New projects use docs/ux/ with personas, user-stories, user-journeys and user-flows. For existing projects, inventory references and agree on migration during setup; verify that the UX Planner version supports the target root before moving documents. Keep flows and journeys outside the method directory.

Report conflicts with previous instructions and use migration.md for assisted migration. Adopt updates through an explicit command, record the starting revision and start a new session after changing the method.
`;
}

async function packageOutputs(source, tools, options = {}) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'jado-package-'));
  try {
    const plan = await prepareInstall({ target: temporary, tools, source, ...options });
    return new Map(plan.changes.filter(c => c.after && c.relative.startsWith('.jado/') && c.relative !== '.jado/install.json').map(c => [c.relative, c.after]));
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

export async function fetchPackage(name, record, sourceSkill, workspace) {
  if (record.sourceType !== 'github' || !/^[\w.-]+\/[\w.-]+$/.test(record.source)) throw new Error(`Unsupported upstream source for ${name}. Preserve the skill and verify its provenance.`);
  const stage = path.join(workspace, name);
  await mkdir(stage, { recursive: true });
  await run(process.execPath, [skillsCLI, 'add', record.source, '--skill', sourceSkill, '--agent', 'codex', '--yes', '--copy', '--json'], {
    cwd: stage, timeout:120000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', XDG_STATE_HOME: path.join(workspace, 'state'), NODE_DISABLE_COMPILE_CACHE: '1' },
  });
  const lock = await readJSON(path.join(stage, 'skills-lock.json'));
  const entry = lock.skills[sourceSkill];
  const folder = path.join(stage, '.agents/skills', sourceSkill);
  if (typeof entry?.computedHash !== 'string' || !entry.skillPath || path.isAbsolute(entry.skillPath) || entry.skillPath.split('/').includes('..') || !await exists(path.join(folder, 'SKILL.md'))) throw new Error(`Incomplete upstream installation: ${name}`);
  const meta = yaml((await readFile(path.join(folder, 'SKILL.md'), 'utf8')).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '');
  if (meta?.name !== sourceSkill) throw new Error(`Upstream identity changed: ${name}`);
  return { folder, record: { ...record, skillPath: entry.skillPath, skillFolderHash: entry.computedHash, ...(entry.ref ? { ref: entry.ref } : {}) } };
}


async function planFiles({ target, outputs, previous, manifestFile, allowed, shared = new Set(), replaceable = new Set(), blocks = {}, watch = [], metadata, summary }) {
  const observed = new Map(), changes = [];
  const owned = previous?.files ?? {};
  if (previous && (previous.schemaVersion !== 1 || !owned || typeof owned !== 'object' || Array.isArray(owned))) throw new Error('Invalid JADO manifest.');
  for (const name of [...outputs.keys(), ...Object.keys(owned), manifestFile]) {
    if (path.isAbsolute(name) || path.normalize(name) !== name || name.split(path.sep).includes('..') || !allowed(name)) throw new Error(`Manifest contains an unrelated path: ${name}`);
  }
  for (const name of new Set([...outputs.keys(), ...Object.keys(owned), ...watch])) {
    const before = await state(target, name); observed.set(name, before);
    const item = outputs.get(name);
    if (!outputs.has(name) && !owned[name]) continue;
    if (!shared.has(name) && !replaceable.has(name) && before && !same(before, owned[name]) && (!item || !same(before, signature(item)))) throw new Error(`Collision or local modification: ${name}. Compare the file before installing.`);
    if (item) { if (!same(before, signature(item))) changes.push({ relative: name, before, after: item }); }
    else if (before && (outputs.has(name) || owned[name] && !shared.has(name))) changes.push({ relative: name, before, after: null });
  }
  const manifest = { schemaVersion: 1, installer: 'skills@1.7.0', ...metadata, blocks, files: Object.fromEntries([...outputs].filter(([name, item]) => item && !shared.has(name)).sort(([a],[b])=>a.localeCompare(b)).map(([name, item]) => [name, signature(item)])) };
  const before = await state(target, manifestFile); observed.set(manifestFile, before);
  const after = { content: Buffer.from(json(manifest)) };
  if (!same(before, signature(after))) changes.push({ relative: manifestFile, before, after });
  const revision = hash(json({ target, observed: [...observed], changes: changes.map(c => ({ path: c.relative, after: c.after ? signature(c.after) : null })) }));
  return { target, tools: metadata.tools, changes, observed, revision, requiresReview: !!summary.instructionsReview, summary: { ...summary, scope: metadata.scope, target, tools: metadata.tools, revision, changes: changes.filter(c => !c.relative.includes('/skills/')).map(c => ({ file: c.relative, action: c.after ? c.before ? 'update' : 'create' : 'remove' })), operations: changes.length } };
}

async function removeUnusedBlocks({ target, outputs, blocks, previous, shared, approved, allowed }) {
  for (const [name, recorded] of Object.entries(previous?.blocks ?? {})) {
    if (blocks[name]) continue;
    if (!allowed.has(name) || path.isAbsolute(name) || path.normalize(name) !== name || name.split(path.sep).includes('..')) throw new Error(`Invalid block path: ${name}`);
    const text = await readFile(path.join(target, name), 'utf8');
    managedBlock(text, '', recorded); // Validates marker uniqueness and preserves manual edits.
    const start = text.indexOf(begin), stop = text.indexOf(end) + end.length;
    const mode = (await lstat(path.join(target, name))).mode & 0o777;
    outputs.set(name, { content: Buffer.from(text.slice(0, start) + text.slice(stop)), mode });
    shared.add(name); approved?.add(name);
  }
}

async function entryOutput({ target, file, body, outputs, blocks, previous, shared }) {
  const before = await exists(path.join(target, file));
  const text = before ? await readFile(path.join(target, file), 'utf8') : '';
  const result = managedBlock(text, body, previous?.blocks?.[file]);
  outputs.set(file, { content: Buffer.from(result.text), mode: before?.mode & 0o777 || 0o644 });
  blocks[file] = result.hash; shared.add(file);
  return result.review;
}

export async function prepareGlobal({ tools, source = sourceRoot, userRoot = homedir(), component = 'all', loadPackage = fetchPackage }) {
  userRoot = await realpath(userRoot);
  const loc = locations(userRoot);
  tools = [...new Set(tools)].sort();
  if (!tools.length || tools.some(t => !['codex','claude-code','opencode'].includes(t))) throw new Error('Global setup supports Codex, Claude Code and OpenCode. For other tools, use local skills-only setup.');
  const rel = async file => path.relative(userRoot,await physical(file,userRoot));
  const manifestFile = '.jado/install.json';
  const previous = await exists(path.join(userRoot,manifestFile)) ? await readJSON(path.join(userRoot,manifestFile)) : null;
  if (previous && previous.scope !== 'global') throw new Error('The global directory contains a different installation type.');
  if (component === 'skills' && previous && tools.join(',') !== [...previous.tools].sort().join(',')) throw new Error('To change tools, update the method, not just the skills.');
  const outputs = await packageOutputs(source,tools,{loadPackage,component,installedRoot:previous ? loc.jadoRoot : undefined});
  const catalog = JSON.parse(outputs.get('.jado/registry/jado-catalog.json').content);
  const shared = new Set(), replaceable = new Set(), blocks = {}, approved = new Set([manifestFile]);
  const publication = {codex:path.join(userRoot,'.agents/skills'),'claude-code':path.join(loc['claude-code'],'skills'),opencode:path.join(userRoot,'.agents/skills')};
  const discoveryDirectories = [...new Set(await Promise.all(tools.map(t => rel(publication[t]))))];
  for (const skill of catalog.skills.filter(s => s.design)) {
    if (!safeName(skill.name) || path.isAbsolute(skill.path) || skill.path.split('/').includes('..')) throw new Error(`Non-portable skill: ${skill.id}`);
    for (const directory of discoveryDirectories) {
      const name = path.join(directory,skill.name);
      approved.add(name); replaceable.add(name);
      outputs.set(name,{link:path.relative(path.join(userRoot,directory),path.join(loc.jadoRoot,path.dirname(skill.path)))});
    }
  }
  for (const name of new Set([...outputs.keys(),...Object.keys(previous?.files ?? {})])) if (name.startsWith('.jado/skills/')) replaceable.add(name);
  const dependencies = catalog.skills.filter(s => s.path.startsWith('skills/')).map(s => ({name:s.id,kind:'upstream',managedBy:'JADO',path:path.join(loc.jadoRoot,path.dirname(s.path))}));
  outputs.set('.jado/dependencies.json',{content:Buffer.from(json({lockFile:path.join(loc.jadoRoot,'jado/skill-lock.json'),dependencies}))});
  // The generic skills updater must not compete with JADO for the same packages.
  const lockFile = await rel(loc.lock);
  if (await exists(path.join(userRoot,lockFile))) {
    const generic = await readJSON(path.join(userRoot,lockFile));
    if (generic.version !== 3 || !generic.skills || typeof generic.skills !== 'object') throw new Error('Unsupported global skills lock.');
    for (const skill of catalog.skills.filter(s => s.design)) delete generic.skills[skill.name];
    outputs.set(lockFile,{content:Buffer.from(json(generic)),mode:(await lstat(path.join(userRoot,lockFile))).mode & 0o777});
    shared.add(lockFile); approved.add(lockFile);
  }
  outputs.set('.jado/instructions.md',{content:Buffer.from(instructions(loc.jadoRoot,'global'))});
  let review = false;
  for (const tool of tools) {
    for (const agent of catalog.agents) {
      const name = await rel(path.join(loc[tool],'agents',`${agent.id}.${tool === 'codex' ? 'toml' : 'md'}`));
      approved.add(name); outputs.set(name,outputs.get(`.jado/agents/${tool}/${agent.id}.${tool === 'codex' ? 'toml' : 'md'}`));
    }
    const effective = tool === 'codex' ? await exists(path.join(loc.codex,'AGENTS.override.md')) ? 'AGENTS.override.md' : 'AGENTS.md' : tool === 'claude-code' ? 'CLAUDE.md' : 'AGENTS.md';
    const name = await rel(path.join(loc[tool],effective)); approved.add(name);
    review = await entryOutput({target:userRoot,file:name,body:designEntry('`~/.jado/instructions.md` (or the complete local project copy)'),outputs,blocks,previous,shared}) || review;
  }
  if (tools.includes('codex')) {
    const name = await rel(path.join(loc.codex,'config.toml')); approved.add(name);
    const text = await exists(path.join(userRoot,name)) ? await readFile(path.join(userRoot,name),'utf8') : '';
    const foreign = text.includes(begin) ? text.slice(0,text.indexOf(begin)) + text.slice(text.indexOf(end) + end.length) : text;
    if (/\[agents\.(?:"|')?jado-/.test(foreign)) throw new Error('jado-* roles already declared outside the managed block: compare config.toml.');
    const body = catalog.agents.map(a => `[agents.${JSON.stringify(a.id)}]\ndescription = ${JSON.stringify(a.description)}\nconfig_file = ${JSON.stringify(`agents/${a.id}.toml`)}\n`).join('\n');
    await entryOutput({target:userRoot,file:name,body,outputs,blocks,previous,shared});
  }
  const activeTools = [...new Set([...tools,...previous?.tools ?? []])];
  const allDiscovery = [...new Set(await Promise.all(activeTools.map(t => rel(publication[t]))))];
  const previousCatalog = previous ? await readJSON(path.join(loc.jadoRoot,'registry/jado-catalog.json')) : {skills:[]};
  const selectedNames = new Set([...catalog.skills,...previousCatalog.skills].filter(s => s.design).map(s => s.name));
  const nativeRoots = await Promise.all(activeTools.map(t => rel(path.join(loc[t],'agents'))));
  const allowedBlocks = new Set(await Promise.all(activeTools.flatMap(t => t === 'codex' ? ['AGENTS.md','AGENTS.override.md','config.toml'].map(n => path.join(loc[t],n)) : [path.join(loc[t],t === 'claude-code' ? 'CLAUDE.md' : 'AGENTS.md')]).map(file => rel(file))));
  await removeUnusedBlocks({target:userRoot,outputs,blocks,previous,shared,approved,allowed:allowedBlocks});
  const allowed = name => name.startsWith('.jado/') || approved.has(name) || nativeRoots.some(root => path.dirname(name) === root && /^jado-[a-z-]+\.(toml|md)$/.test(path.basename(name))) || allDiscovery.some(root => path.dirname(name) === root && selectedNames.has(path.basename(name)));
  outputs.set('.jado/migration.md',{content:Buffer.from(`# Verify the global JADO entry\n\nFollow jado-install. Check entries, overrides, linked documents and nested rules. The block preserves earlier instructions: migrate conflicting routers while retaining product contracts. In a new session, verify access to ${loc.jadoRoot}, the catalog, execution mode and profiles. File presence is not proof of execution. JADO manages selected skills and replaces same-named copies with backups. Use a complete local installation when the session cannot read the global copy.\n`)});
  if (component === 'skills' && previous) {
    // Refresh upstream packages without adopting new framework instructions or adapters.
    for (const [name,item] of outputs) {
      if (!item?.content || name.startsWith('.jado/skills/') || ['.jado/registry/jado-catalog.json','.jado/jado/skill-lock.json',lockFile].includes(name)) continue;
      const file = path.join(userRoot,name), info = await lstat(file);
      outputs.set(name,{content:await readFile(file),mode:info.mode & 0o777});
    }
    Object.assign(blocks,previous.blocks);
  }
  return planFiles({target:userRoot,outputs,previous,manifestFile,allowed,shared,replaceable,blocks,metadata:{scope:'global',tools,instructionsReview:review || previous?.instructionsReview === 'required' ? 'required' : 'verify-in-session',workflowRevision:hash(outputs.get('.jado/jado/workflows.json').content)},summary:{instructionsReview:review || previous?.instructionsReview === 'required',dependencies,discoveryDirectories,nativeProfiles:tools.map(tool => ({tool,count:catalog.agents.length})),skillsOnly:[],accessCheck:'Verify method access and profile availability in the AI session.'}});
}

export async function prepareLink({ target, userRoot = homedir(), tools }) {
  target = await realpath(path.resolve(target)); userRoot = await realpath(userRoot);
  if (inside(userRoot, target) && target === userRoot || inside(target, userRoot)) throw new Error('Linking requires a repository separate from the user directory.');
  const root = path.join(userRoot, '.jado');
  const global = await readJSON(path.join(root, 'install.json'));
  if (global.scope !== 'global') throw new Error('Install JADO globally first.');
  tools ??= global.tools;
  if (!tools.length || tools.some(t => !global.tools.includes(t))) throw new Error('The requested tools are not installed globally.');
  for (const file of ['instructions.md', 'registry/jado-catalog.json', 'jado/workflows.json', 'jado/policies/method.json', '.agents/skills/jado-run/SKILL.md']) await readFile(path.join(root, file));
  const catalog = await readJSON(path.join(root, 'registry/jado-catalog.json'));
  for (const skill of catalog.skills.filter(s => s.design)) await readFile(path.resolve(root, skill.path));
  const loc = locations(userRoot);
  for (const tool of tools) for (const agent of catalog.agents) await readFile(path.join(loc[tool], 'agents', `${agent.id}.${tool === 'codex' ? 'toml' : 'md'}`));
  const manifestFile = '.jado/install.json';
  const previous = await exists(path.join(target, manifestFile)) ? await readJSON(path.join(target, manifestFile)) : null;
  if (previous && previous.scope !== 'linked') throw new Error('The project already has a complete local copy: update it with jado:update --local.');
  const outputs = new Map(), blocks = {}, shared = new Set();
  let review = false;
  const effective = await exists(path.join(target, 'AGENTS.override.md')) ? 'AGENTS.override.md' : 'AGENTS.md';
  const names = new Set([effective]);
  if (tools.includes('claude-code')) names.add('CLAUDE.md');
  if (tools.includes('opencode')) names.add('AGENTS.md');
  for (const name of names) review = await entryOutput({ target, file: name, body: designEntry('`~/.jado/instructions.md` in the current user’s global installation'), outputs, blocks, previous, shared }) || review;
  await removeUnusedBlocks({ target, outputs, blocks, previous, shared, allowed: new Set(['AGENTS.md','AGENTS.override.md','CLAUDE.md']) });
  outputs.set('.jado/instructions.md', { content: Buffer.from('# Global method link\n\nRead `~/.jado/instructions.md`, then the index and selected packet from that same root. This directory contains a link, not a local method copy. When external access is blocked, use a complete local installation; a symlink does not remove the access boundary.\n') });
  outputs.set('.jado/migration.md', { content: Buffer.from('# Complete the link\n\nFollow jado-install from the global copy. Read the entry, overrides, linked Markdown and nested rules. Prepare the diff to replace previous design routers while preserving product contracts. In a new session, verify access to the method, catalog, skills and global profiles. CLI file checks do not establish the AI session’s permissions.\n') });
  const allowed = name => ['AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md', '.jado/install.json', '.jado/instructions.md', '.jado/migration.md'].includes(name);
  const plan = await planFiles({ target, outputs, previous, manifestFile, allowed, shared, blocks, metadata: { scope: 'linked', tools, instructionsReview: review || previous?.instructionsReview === 'required' ? 'required' : 'verify-in-session', globalRoot: '~/.jado' }, summary: { instructionsReview: review || previous?.instructionsReview === 'required', discoveryDirectories: [], nativeProfiles: [], skillsOnly: [], accessCheck: 'CLI file access verified; also verify the AI session and global profiles.' } });
  // No username is persisted in the project's portable manifest or instructions.
  plan.globalRoot = root;
  plan.externalObserved = new Map([[path.join(root, 'install.json'), await state(userRoot, '.jado/install.json')]]);
  return plan;
}

export async function prepareLocalUpdate({ target, source = sourceRoot, tools, component = 'all', loadPackage = fetchPackage }) {
  const previous = await readJSON(path.join(target, '.jado/install.json'));
  if (previous.scope === 'linked') throw new Error('This project uses the global installation: update JADO with --global.');
  if (previous.scope && previous.scope !== 'local') throw new Error('Invalid local manifest.');
  tools = [...new Set(tools ?? previous.tools)].sort();
  if (component === 'skills' && tools.join(',') !== [...previous.tools].sort().join(',')) throw new Error('To change tools, update the method, not just the skills.');
  return prepareInstall({target,tools,source,component,loadPackage,installedRoot:path.join(target,'.jado')});
}

// Paths an installation may own, relative to its root: the method copy, native profiles, skill links and entry files.
const ownedPath = name => typeof name === 'string' && !path.isAbsolute(name) && path.normalize(name) === name && !name.split(path.sep).includes('..')
  && (name.startsWith('.jado/') || /(?:^|\/)agents\/jado-[a-z0-9-]+\.(?:toml|md)$/.test(name) || /(?:^|\/)skills\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
    || /(?:^|\/)(?:AGENTS|AGENTS\.override|CLAUDE)\.md$/.test(name) || /(?:^|\/)config\.toml$/.test(name));
// Files JADO writes into .jado outside the manifest: refresh settings and logs.
const unmanaged = ['.jado/refresh.json', '.jado/refresh.log'];

/** Removes a managed block and the blank line installation added before it. Returns null when the file would be empty. */
function withoutBlock(text) {
  const start = text.indexOf(begin), stop = text.indexOf(end) + end.length;
  const restored = text.slice(0, start).replace(/\n\n$/, '\n') + text.slice(stop).replace(/^\n/, '');
  return restored.trim() ? restored : null;
}

/**
 * Plans the removal of one installation from its manifest: files JADO wrote and still match the recorded state are
 * removed, managed blocks are cut out of shared instructions, and anything changed since installation is kept and reported.
 */
export async function prepareUninstall({ global = false, target, userRoot = homedir() }) {
  const root = await realpath(global ? userRoot : path.resolve(target ?? ''));
  const manifestFile = '.jado/install.json';
  if (!await exists(path.join(root, manifestFile))) throw new Error(`No JADO installation in ${path.join(root, '.jado')}.`);
  const manifest = await readJSON(path.join(root, manifestFile));
  if (manifest.schemaVersion !== 1 || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) throw new Error('Invalid JADO manifest.');
  if (global !== (manifest.scope === 'global')) throw new Error(manifest.scope === 'global' ? 'This is the global installation: use --global.' : 'This is a project installation: use --local --target /repo.');
  const observed = new Map(), changes = [], kept = [];
  for (const [name, recorded] of Object.entries(manifest.files)) {
    if (!ownedPath(name)) throw new Error(`Manifest contains an unrelated path: ${name}`);
    if (name === manifestFile) continue;
    const before = await state(root, name); observed.set(name, before);
    if (!before) continue;
    if (same(before, recorded)) changes.push({ relative: name, before, after: null });
    else kept.push(name);
  }
  for (const [name, recorded] of Object.entries(manifest.blocks ?? {})) {
    if (!ownedPath(name) || name.startsWith('.jado/')) throw new Error(`Invalid block path: ${name}`);
    const before = await state(root, name); observed.set(name, before);
    if (!before?.hash) continue;
    const text = await readFile(path.join(root, name), 'utf8');
    if (!text.includes(begin)) continue;
    try { managedBlock(text, '', recorded); } catch { kept.push(name); continue; }
    const restored = withoutBlock(text);
    changes.push({ relative: name, before, after: restored === null ? null : { content: Buffer.from(restored), mode: before.mode } });
  }
  for (const name of [...unmanaged, manifestFile]) {
    const before = await state(root, name); observed.set(name, before);
    if (before) changes.push({ relative: name, before, after: null });
  }
  const revision = hash(json({ root, observed: [...observed], changes: changes.map(c => ({ path: c.relative, after: c.after ? signature(c.after) : null })) }));
  const refresh = await exists(path.join(root, '.jado/refresh.json')) ? await readJSON(path.join(root, '.jado/refresh.json')) : null;
  return {
    target: root, tools: manifest.tools ?? [], changes, observed, revision, requiresReview: false, kept,
    summary: { operation: 'uninstall', scope: manifest.scope ?? 'local', target: root, tools: manifest.tools ?? [], revision,
      remove: changes.filter(c => !c.after && !c.relative.startsWith('.jado/')).map(c => c.relative),
      editBlocks: changes.filter(c => c.after).map(c => c.relative),
      methodFiles: changes.filter(c => c.relative.startsWith('.jado/')).length,
      kept, scheduledRefresh: refresh?.enabled === true },
  };
}

/** Removes directories left empty by an uninstall, from the deepest up, without leaving the installation root. */
async function pruneEmpty(root, removed) {
  const dirs = new Set();
  for (const name of removed) for (let dir = path.dirname(path.join(root, name)); dir !== root && inside(root, dir); dir = path.dirname(dir)) dirs.add(dir);
  for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
    const info = await exists(dir);
    if (info?.isDirectory() && !info.isSymbolicLink() && !(await readdir(dir)).length) await rmdir(dir);
  }
}

export async function applyUninstall(plan, expectedRevision) {
  if (plan.summary.scheduledRefresh) throw new Error('Scheduled refresh is enabled: disable it first with refresh --disable.');
  const result = await applyInstall(plan, expectedRevision);
  await pruneEmpty(plan.target, plan.changes.filter(c => !c.after).map(c => c.relative));
  return result;
}

const usage = `Usage: npm run jado -- <command> [options]

Commands
  install    Install JADO for your user (--global) or into a project (--local --target /repo)
  link       Point a project at the global installation (--target /repo)
  update     Update an installation from this checkout (--global | --local --target /repo)
  uninstall  Remove an installation using its manifest (--global | --local --target /repo)
  refresh    Refresh upstream skills or schedule it (see: npm run jado -- refresh --help)
  plan       Print the execution plan of a route (--workflow R05 [--stage explore] [--budget lean])

Options
  --agents claude-code,codex,opencode   Tools to install for (install; local installs also accept other skills CLI IDs)
  --component all|method|skills         What update replaces (default: all)
  --dry-run [--json]                    Print the plan without changing files
  --yes [--revision HASH]               Apply without prompting; --revision must match the reviewed plan
  --user-root DIR                       Use DIR instead of your home directory (isolated tests)

Every command prints its plan first. Existing Markdown keeps its content: global installs and links add a managed
JADO block. uninstall removes only files JADO wrote that are unchanged since installation, cuts the managed blocks
and disables a scheduled refresh; changed files are kept and listed.`;

export async function runSetup(args) {
  const operation = ['install', 'update', 'link', 'uninstall'].includes(args[0]) ? args.shift() : 'install';
  const { values } = parseArgs({ args, options: { target: { type: 'string' }, agents: { type: 'string' }, global: { type: 'boolean' }, local: { type: 'boolean' }, 'user-root': { type: 'string' }, component: { type: 'string', default: 'all' }, 'dry-run': { type: 'boolean' }, yes: { type: 'boolean' }, json: { type: 'boolean' }, revision: { type: 'string' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) { console.log(usage); return; }
  if (values.global && values.local || operation === 'link' && (values.global || values.local)) throw new Error('Choose one mode: global, local or link.');
  if (!['all', 'method', 'skills'].includes(values.component)) throw new Error('Allowed component: all, method or skills.');
  if (values.json && !values['dry-run'] && !values.yes) throw new Error('Use --json with --dry-run or --yes.');
  if (operation === 'uninstall') return runUninstall(values);
  const prompt = process.stdin.isTTY && process.stdout.isTTY ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    let global = values.global;
    if (operation !== 'link' && !values.global && !values.local && !values.target) {
      if (!prompt) throw new Error('Specify --global or --local --target /repo.');
      global = /^(?:g|global)$/i.test(await prompt.question('Local installation in the repository or global for your user? [local/global]: '));
    }
    const target = values.target ?? (!global && prompt ? await prompt.question('Target repository (path): ') : null);
    const userRoot = values['user-root'] ?? homedir();
    let selected = values.agents;
    if (!selected && operation === 'install' && prompt) selected = await prompt.question('Tools: 1 Claude Code, 2 Codex, 3 OpenCode. Separate numbers or IDs with commas: ');
    let tools = selected?.split(/[\s,]+/).filter(Boolean).map(t => ({ '1': 'claude-code', '2': 'codex', '3': 'opencode' }[t] ?? t));
    let plan;
    if (operation === 'link') { if (!target) throw new Error('Specify --target /repo.'); plan = await prepareLink({ target, userRoot, tools }); }
    else if (global) {
      if (!tools && operation === 'update') tools = (await readJSON(path.join(userRoot, '.jado/install.json'))).tools;
      if (!tools) throw new Error('Specify --agents with your selected tools.');
      plan = await prepareGlobal({ tools, userRoot, component: operation === 'update' ? values.component : 'all' });

    } else {
      if (!target) throw new Error('Specify --target /repo.');
      if (operation === 'update') plan = await prepareLocalUpdate({ target, tools, component: values.component });
      else { if (!tools) throw new Error('Specify --agents with your selected tools.'); plan = await prepareInstall({ target, tools }); }
    }
    if (!values.json || values['dry-run']) console.log(values.json ? json(plan.summary) : `Mode: ${plan.summary.scope ?? 'local'}\nDestination: ${plan.target}\nTools: ${plan.tools.join(', ')}\nOperations: ${plan.changes.length}\nPlan revision: ${plan.revision}\n${plan.requiresReview ? 'Review and migrate legacy design instructions with jado-install.\n' : ''}${plan.summary.accessCheck ?? ''}`);
    if (values['dry-run']) return;
    if (!values.yes && (!prompt || !/^y(?:es)?$/i.test(await prompt.question('Apply this plan? [y/N] ')))) { console.log('No files changed.'); return; }
    const result = await applyInstall(plan, values.revision);
    console.log(values.json ? json({ plan: plan.summary, result }) : `Setup complete. Backup: ${result.backup}\nVerify the entry and delegations in a new session. ${plan.requiresReview ? 'Legacy instruction migration remains incomplete.' : ''}`);
  } finally { prompt?.close(); }
}

async function runUninstall(values) {
  if (!values.global && !values.target) throw new Error('Specify --global or --local --target /repo.');
  const userRoot = values['user-root'] ?? homedir();
  const options = { global: !!values.global, target: values.target, userRoot };
  let plan = await prepareUninstall(options);
  const print = current => {
    if (values.json) { console.log(json(current.summary)); return; }
    const { summary } = current;
    console.log([`Uninstall: ${summary.scope}`, `Root: ${summary.target}`, `Method files in .jado: ${summary.methodFiles}`,
      ...summary.remove.map(name => `Remove: ${name}`), ...summary.editBlocks.map(name => `Remove the JADO block from: ${name}`),
      ...summary.kept.map(name => `Keep (changed since installation): ${name}`),
      ...(summary.scheduledRefresh ? ['Disable the scheduled refresh and remove its LaunchAgent.'] : []),
      `Plan revision: ${summary.revision}`].join('\n'));
  };
  if (!values.json || values['dry-run']) print(plan);
  if (values['dry-run']) return;
  const prompt = process.stdin.isTTY && process.stdout.isTTY && !values.yes ? createInterface({ input: process.stdin, output: process.stdout }) : null;
  try {
    if (!values.yes && (!prompt || !/^y(?:es)?$/i.test(await prompt.question('Remove this installation? [y/N] ')))) { console.log('No files changed.'); return; }
  } finally { prompt?.close(); }
  if (values.revision && values.revision !== plan.revision) throw new Error('The plan changed: review the new diff.');
  if (plan.summary.scheduledRefresh) {
    const { refreshLocation, configureRefresh } = await import('./refresh.mjs');
    await configureRefresh(await refreshLocation({ global: options.global, target: options.target, userRoot }), { enable: false });
    plan = await prepareUninstall(options);
  }
  const result = await applyUninstall(plan, plan.revision);
  console.log(values.json ? json({ plan: plan.summary, result }) : `JADO removed. Backup of the removed files: ${result.backup}${plan.kept.length ? `\nKept because they changed after installation: ${plan.kept.join(', ')}` : ''}`);
}
