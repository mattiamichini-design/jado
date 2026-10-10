import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, readlink, realpath, rm, symlink, stat, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parse } from 'yaml';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
import { prepareInstall as buildInstall, applyInstall, adapter } from './install.mjs';
import { fixturePackage, fixtureLegacyNames } from './fixtures.mjs';
const prepareInstall = options => buildInstall({...options,loadPackage:fixturePackage});

const fixture = await mkdtemp(path.join(tmpdir(),'jado-setup-test-'));
let target = path.join(fixture,'product');
await mkdir(target);
target = await realpath(target);
try {
  const plan = await prepareInstall({target,tools:['codex']});
  assert.deepEqual(await readdir(target),[],'A plan must leave the target untouched');
  assert.deepEqual(plan.summary.discoveryDirectories,['.agents/skills']);
  assert.equal(plan.summary.nativeProfiles.length,1);
  assert(plan.changes.find(c=>c.relative==='.codex/config.toml')?.after.content.toString().includes('config_file = \"agents/jado-agent-ux-reviewer.toml\"'),'Codex roles must be registered, not merely copied');
  assert(!plan.changes.some(c=>c.relative.startsWith('.claude/') || c.relative.startsWith('.opencode/')));
  await assert.rejects(()=>applyInstall(plan,'outdated'),/changed/);
  const installed = await applyInstall(plan,plan.revision);
  assert.equal((await readdir(path.join(target,'.codex/agents'))).length,5);
  const executable = 'skills/avoid-ai-writing/scripts/check-pattern-count.sh';
  assert.equal((await stat(path.join(target,'.jado',executable))).mode & 0o777,0o755,'Skill script permissions survive installation');
  const unchanged = await prepareInstall({target,tools:['codex']});
  assert.equal(unchanged.changes.length,0,'An identical reinstall must not rewrite state or forget ownership');
  const retired = await fixtureLegacyNames(target);
  const migration = await prepareInstall({target,tools:['codex']});
  for(const file of retired) assert(migration.changes.some(c => c.relative === file && c.after === null),'Upgrade retires the old owned names');
  const migrated = await applyInstall(migration,migration.revision);
  await rm(migrated.backup,{recursive:true,force:true});
  for(const file of retired) await assert.rejects(()=>readFile(path.join(target,file)),/ENOENT/);
  assert((await readFile(path.join(target,'.agents/skills/jado-design-systems/SKILL.md'),'utf8')).includes('name: jado-design-systems'));
  const legacy = JSON.parse(await readFile(path.join(target,'.jado/install.json'),'utf8'));
  for (const file of Object.values(legacy.files)) delete file.mode;
  await writeFile(path.join(target,'.jado/install.json'),JSON.stringify(legacy));
  await chmod(path.join(target,'.jado',executable),0o644);
  const repair = await prepareInstall({target,tools:['codex']});
  const failedWrite = path.join(target,'.jado/install.json.jado-tmp');
  await writeFile(failedWrite,'foreign marker');
  await assert.rejects(()=>applyInstall(repair,repair.revision),/Temporary file/);
  assert.equal((await stat(path.join(target,'.jado',executable))).mode & 0o777,0o644,'Rollback restores the previous mode');
  await rm(failedWrite);
  const repaired = await applyInstall(repair,repair.revision);
  assert.equal((await stat(path.join(target,'.jado',executable))).mode & 0o777,0o755,'Legacy manifests can repair executable bits');
  await rm(repaired.backup,{recursive:true,force:true});

  assert.equal(await realpath(path.join(target,'.agents/skills/jado-flow')),path.join(target,'.jado/.agents/skills/jado-flow'));
  assert((await readlink(path.join(target,'.agents/skills/research'))).startsWith('../../.jado/skills/'));
  assert((await readFile(path.join(target,'AGENTS.md'),'utf8')).includes('.jado/instructions.md'));
  assert(!(await readFile(path.join(target,'.jado/instructions.md'),'utf8')).includes('config.local.json'));
  assert((await readFile(path.join(target,'.codex/agents/jado-agent-frontend.toml'),'utf8')).includes('gpt-6.1-sol'));
  const catalog = JSON.parse(await readFile(path.join(target,'.jado/registry/jado-catalog.json'),'utf8'));
  for (const s of catalog.skills) await readFile(path.join(target,'.jado',s.path));
  await mkdir(path.join(target,'.agents/skills/custom'));
  await writeFile(path.join(target,'.agents/skills/custom/SKILL.md'),'local extra');
  await writeFile(path.join(target,'CLAUDE.md'),'Preserve Claude project instructions\n');
  const {stdout:preview} = await run(process.execPath,['scripts/jado/install.mjs','update','--component','method','--target',target,'--agents','codex','--dry-run','--json'],{maxBuffer:2*1024*1024});
  assert.deepEqual(JSON.parse(preview).tools,['codex']);
  const both = await prepareInstall({target,tools:['claude-code','opencode']});
  assert.equal(both.requiresReview,true);
  assert(both.changes.some(c=>c.relative==='.codex/agents/jado-agent-frontend.toml' && c.after===null));
  assert(!both.changes.some(c=>c.relative==='AGENTS.md' || c.relative==='CLAUDE.md'));
  const expectedBindings = {
    'jado-agent-ux':['high','claude-opus-5-5','high'],
    'jado-agent-visual':['high','claude-opus-5-5','high'],
    'jado-agent-frontend':['medium','claude-sonnet-5-5','medium'],
    'jado-agent-ux-reviewer':['high','claude-opus-5-5','high'],
    'jado-agent-visual-reviewer':['high','claude-opus-5-5','high'],
  };
  for (const agent of catalog.agents) {
    const [reasoning,model,effort] = expectedBindings[agent.id];
    const claude = parse(adapter(agent,'claude-code').split('---\n')[1]);
    assert.deepEqual([claude.model,claude.effort],[model,effort],'Claude settings are independent of Codex reasoning');
    const codex = await readFile(path.join(target,'.codex/agents',`${agent.id}.toml`),'utf8');
    assert(codex.includes('model = "gpt-6.1-sol"') && codex.includes(`model_reasoning_effort = "${reasoning}"`));
    const pending = both.changes.find(c=>c.relative===`.claude/agents/${agent.id}.md`);
    assert(pending?.after.content.toString().includes(`model: ${model}`),'Installed Claude profiles use the selected binding');
    if (agent.sandbox==='read-only') {
      assert.equal(claude.permissionMode,'plan');
      assert(claude.disallowedTools.includes('Write') && claude.disallowedTools.includes('Bash'));
      assert(claude.disallowedTools.includes('mcp__paper__write_html') && claude.disallowedTools.includes('mcp__figma-console__figma_execute'),'Reviewers cannot mutate the canvas');
      assert(!claude.disallowedTools.some(t => /get_screenshot|get_tree_summary/.test(t)),'Reviewers keep inspection tools');
    }
  }
  assert((await readFile(path.join(target,'.jado/jado/runtime/R01.json'),'utf8')).includes('methodRevision'),'Installed copy includes standalone route packets');
  const reviewer = catalog.agents.find(a=>a.sandbox==='read-only');
  const restricted = parse(adapter(reviewer,'opencode').split('---\n')[1]);
  assert.equal(restricted.mode,'subagent');
  assert.equal(restricted.permission['*'],'deny');
  assert(!('model' in restricted));
  const marker = path.join(target,'.jado/install.json.jado-tmp');
  await writeFile(marker,'foreign temporary file');
  await assert.rejects(()=>applyInstall(both,both.revision),/Temporary file/);
  assert.equal(await readFile(marker,'utf8'),'foreign temporary file');
  assert.equal((await readdir(path.join(target,'.codex/agents'))).length,5,'Failed writes restore the previous profiles');
  assert.equal(await readFile(path.join(target,'CLAUDE.md'),'utf8'),'Preserve Claude project instructions\n');
  await rm(marker);
  const newer = await applyInstall(both,both.revision);
  await assert.rejects(()=>readFile(path.join(target,'.codex/agents/jado-agent-frontend.toml')),/ENOENT/);
  assert.equal(await readFile(path.join(target,'CLAUDE.md'),'utf8'),'Preserve Claude project instructions\n');
  assert.equal(await readFile(path.join(target,'.agents/skills/custom/SKILL.md'),'utf8'),'local extra');
  assert((await readlink(path.join(target,'.claude/skills/jado-run'))).includes('.jado/'));
  await writeFile(path.join(target,'.jado/.agents/skills/jado-flow/SKILL.md'),'personalized');
  await assert.rejects(()=>prepareInstall({target,tools:['codex']}),/local modification/);
  await writeFile(path.join(target,'.jado/.agents/skills/jado-flow/SKILL.md'),await readFile('.agents/skills/jado-flow/SKILL.md'));
  const fresh = await prepareInstall({target,tools:['codex']});
  await writeFile(path.join(target,'AGENTS.md'),'Concurrent edit\n');
  await assert.rejects(()=>applyInstall(fresh,fresh.revision),/Destination changed/);
  const blocked = path.join(fixture,'blocked'); await mkdir(blocked);
  const foreign = path.join(fixture,'foreign'); await mkdir(foreign);
  await symlink(foreign,path.join(blocked,'.agents'));
  await assert.rejects(()=>prepareInstall({target:blocked,tools:['codex']}),/directory must be real/);
  assert.deepEqual(await readdir(foreign),[]);
  const configured = path.join(fixture,'configured'); await mkdir(path.join(configured,'.codex'),{recursive:true});
  const settings = 'model_reasoning_effort = "high"\n[mcp_servers.custom]\ncommand = "existing-server"\n';
  await writeFile(path.join(configured,'.codex/config.toml'),settings);
  const configuredPlan = await prepareInstall({target:configured,tools:['codex']});
  assert.equal(configuredPlan.requiresReview,true);
  assert(!configuredPlan.changes.some(c=>c.relative==='.codex/config.toml'));
  assert(configuredPlan.changes.some(c=>c.relative==='.jado/agents/codex-registration.toml'));
  await writeFile(path.join(configured,'.codex/config.toml'),settings+'# Concurrent configuration change\n');
  await assert.rejects(()=>applyInstall(configuredPlan,configuredPlan.revision),/Destination changed/);
  const override = path.join(fixture,'override'); await mkdir(override);
  await writeFile(path.join(override,'AGENTS.override.md'),'Keep effective rules');
  const overridePlan = await prepareInstall({target:override,tools:['claude-code']});
  assert(overridePlan.changes.some(c=>c.relative==='AGENTS.md'));
  assert.equal(overridePlan.changes.find(c=>c.relative==='CLAUDE.md').after.content.toString(),'@AGENTS.md\n');
  assert(!overridePlan.changes.some(c=>c.relative==='AGENTS.override.md'));
  const other = path.join(fixture,'windsurf'); await mkdir(other);
  const skillOnly = await prepareInstall({target:other,tools:['windsurf']});
  assert.deepEqual(skillOnly.summary.nativeProfiles,[]);
  assert.deepEqual(skillOnly.summary.skillsOnly,['windsurf']);
  assert.deepEqual(skillOnly.summary.discoveryDirectories,['.windsurf/skills']);
  assert(!skillOnly.changes.find(c=>c.relative==='.jado/migration.md').after.content.toString().includes('codex-registration.toml'),'Migration refers only to selected adapters');
  const openclaw = path.join(fixture,'openclaw'); await mkdir(openclaw);
  const openclawPlan = await prepareInstall({target:openclaw,tools:['openclaw']});
  assert.deepEqual(openclawPlan.summary.discoveryDirectories,['skills']);
  const openclawResult = await applyInstall(openclawPlan,openclawPlan.revision);
  await prepareInstall({target:openclaw,tools:['openclaw']});
  await rm(openclawResult.backup,{recursive:true,force:true});
  // Invalid ownership in a manifest must never remove files outside the integration.
  const corrupt = JSON.parse(await readFile(path.join(target,'.jado/install.json'),'utf8'));
  corrupt.files['PRODUCT.md']={hash:'anything'};
  await writeFile(path.join(target,'.jado/install.json'),JSON.stringify(corrupt));
  await assert.rejects(()=>prepareInstall({target,tools:['codex']}),/Manifest contains an unrelated path/);
  await rm(installed.backup,{recursive:true,force:true}); await rm(newer.backup,{recursive:true,force:true});
} finally { await rm(fixture,{recursive:true,force:true}); }
console.log('JADO install: public skills CLI, selected native adapters, local ownership, dry-run, stale plan and collisions verified.');
