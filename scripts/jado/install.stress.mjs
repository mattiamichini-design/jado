import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, readlink, realpath, lstat, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { prepareInstall as buildInstall, applyInstall } from './install.mjs';

import { fixturePackage } from './fixtures.mjs';
const prepareInstall = options => buildInstall({loadPackage:fixturePackage,...options});
const run = promisify(execFile);
const hash = data => createHash('sha256').update(data).digest('hex');
const fixture = await realpath(await mkdtemp(path.join(tmpdir(),'jado-stress-')));
const nativeDirs = {codex:'.codex/agents', 'claude-code':'.claude/agents', opencode:'.opencode/agents'};
const tools = Object.keys(nativeDirs), timings = [], backups = [];
let checkedFiles = 0, checkedLinks = 0, winningWriters = 0;
async function apply(plan) { const start=performance.now(); const result=await applyInstall(plan,plan.revision); backups.push(result.backup); timings.push(performance.now()-start); }
async function verify(target, selected) {
  const manifest = JSON.parse(await readFile(path.join(target,'.jado/install.json'),'utf8'));
  assert.deepEqual(manifest.tools,[...selected].sort());
  for (const [relative, expected] of Object.entries(manifest.files)) {
    const file=path.join(target,relative), info=await lstat(file);
    if (expected.link) {
      assert(info.isSymbolicLink()); assert.equal(await readlink(file),expected.link);
      assert(!path.isAbsolute(expected.link));
      assert((await realpath(file)).startsWith(path.join(target,'.jado')+path.sep)); checkedLinks++;
    } else {
      assert.equal(hash(await readFile(file)),expected.hash);
      assert.equal(info.mode & 0o777,expected.mode,relative); checkedFiles++;
    }
  }
  for (const tool of tools) {
    const names=await readdir(path.join(target,nativeDirs[tool])).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
    assert.equal(names.length,selected.includes(tool)?5:0,`Only selected ${tool} profiles`);
  }
  assert.equal(await lstat(path.join(target,'.jado-install.lock')).catch(e=>{if(e.code==='ENOENT')return null;throw e;}),null);
}
try {
  let all;
  for (let mask=1;mask<8;mask++) {
    const selected=tools.filter((_,i)=>mask & (1<<i));
    const target=path.join(fixture,`project café ${mask}`); await mkdir(target);
    await writeFile(path.join(target,'app.mjs'),'export const tasks = [{title:"Test JADO",done:false}];\n');
    const start=performance.now(), plan=await prepareInstall({target,tools:selected});
    assert.deepEqual(await readdir(target),['app.mjs'],'Preparation never writes into the project');
    await apply(plan); await verify(target,selected);
    const repeat=await prepareInstall({target,tools:selected});
    assert.equal(repeat.changes.length,0,`Idempotence: ${selected}`);
    console.log(JSON.stringify({case:'selection',tools:selected,changes:plan.changes.length,ms:Math.round(performance.now()-start)}));
    if(mask===7) all=target;
  }
  // Local Git clone exercises both relative symlinks and executable bits on another path.
  await run('git',['init','-q'],{cwd:all});
  await run('git',['add','.'],{cwd:all});
  await run('git',['-c','core.hooksPath=/dev/null','-c','user.name=JADO test','-c','user.email=test@example.invalid','commit','-qm','Installation fixture'],{cwd:all});
  const clone=path.join(fixture,'moved clone');
  await run('git',['clone','--quiet','--no-hardlinks',all,clone]);
  await verify(clone,tools);
  assert.equal((await prepareInstall({target:clone,tools})).changes.length,0,'Moving the project requires no repair');

  // Existing product instructions and unrelated skills survive real installation and removal.
  const existing=path.join(fixture,'existing project');await mkdir(existing);
  const original='# Product\n\nPreserve the design system. Use the legacy router.\n';
  await writeFile(path.join(existing,'AGENTS.md'),original);
  await writeFile(path.join(existing,'AGENTS.override.md'),'Product override\n');
  await writeFile(path.join(existing,'CLAUDE.md'),'Existing Claude instructions\n');
  await mkdir(path.join(existing,'.codex'));
  const settings='model_reasoning_effort = \"high\"\n';
  await writeFile(path.join(existing,'.codex/config.toml'),settings);
  await mkdir(path.join(existing,'.agents/skills/custom'),{recursive:true});
  await writeFile(path.join(existing,'.agents/skills/custom/SKILL.md'),'Skill unrelated to JADO\n');
  await apply(await prepareInstall({target:existing,tools}));
  assert.equal(JSON.parse(await readFile(path.join(existing,'.jado/install.json'),'utf8')).instructionsReview,'required');
  assert.equal(await readFile(path.join(existing,'AGENTS.md'),'utf8'),original);
  await apply(await prepareInstall({target:existing,tools:['codex']}));
  assert.equal(await readFile(path.join(existing,'AGENTS.override.md'),'utf8'),'Product override\n');
  assert.equal(await readFile(path.join(existing,'CLAUDE.md'),'utf8'),'Existing Claude instructions\n');
  assert.equal(await readFile(path.join(existing,'.agents/skills/custom/SKILL.md'),'utf8'),'Skill unrelated to JADO\n');
  await verify(existing,['codex']);
  assert.equal(await readFile(path.join(existing,'.codex/config.toml'),'utf8'),settings);
  assert.equal((await prepareInstall({target:existing,tools:['codex']})).changes.length,0);
  const stale=await prepareInstall({target:existing,tools});
  const executable=path.join(existing,'.jado/skills/avoid-ai-writing/scripts/check-pattern-count.sh');
  await chmod(executable,0o644);
  await assert.rejects(()=>applyInstall(stale,stale.revision),/Destination changed/);
  await chmod(executable,0o755);

  // Race four writers against exactly the same target and revision, then retry cleanly.
  for(let round=0;round<4;round++) {
    const target=path.join(fixture,`race-${round}`);await mkdir(target);
    const plan=await prepareInstall({target,tools:['codex']});
    const results=await Promise.allSettled(Array.from({length:4},()=>applyInstall(plan,plan.revision)));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    for(const r of results) if(r.status==='fulfilled') {backups.push(r.value.backup);winningWriters++;}
    else assert.match(r.reason.message,/EEXIST|Destination changed/);
    await verify(target,['codex']);
    assert.equal((await prepareInstall({target,tools:['codex']})).changes.length,0);
  }
  const invalid=path.join(fixture,'invalid');await mkdir(invalid);
  await assert.rejects(()=>prepareInstall({target:invalid,tools:['not-a-real-tool']}));
  assert.deepEqual(await readdir(invalid),[]);
  console.log(JSON.stringify({result:'passed',selections:7,concurrentAttempts:16,winningWriters,checkedFiles,checkedLinks,localClone:true,existingInstructions:true,modeRaceRejected:true,invalidSelectionRejected:true,applyMs:timings.map(Math.round)}));
} finally {
  await rm(fixture,{recursive:true,force:true});
  for(const backup of backups) await rm(backup,{recursive:true,force:true});
}
