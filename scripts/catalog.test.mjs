import { resolveAgents } from '../lib/jado/render.ts';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { collectSkills, catalogGuide } from './sync-catalog.mjs';
import { documents } from './validate-content.mjs';

const fixture = await mkdtemp(path.join(tmpdir(), 'playbook-catalog-'));
try {
  const skillsRoot = path.join(fixture, 'skills');
  const put = async (file, name) => {
    const target = path.join(skillsRoot, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `---\nname: ${name}\ndescription: Use this skill for the task.\n---\n# Instructions\n`);
  };
  await put('avoid-ai-writing/SKILL.md','avoid-ai-writing');
  await put('avoid-ai-writing/plugins/avoid-ai-writing/SKILL.md','avoid-ai-writing');
  await put('alias/SKILL.md','avoid-ai-writing');
  await put('unlisted/SKILL.md','unlisted');
  await put('ignored/SKILL.md','ignored');
  await put('.system/imagegen/SKILL.md','imagegen');
  await put('codex-router/SKILL.md','codex-router');
  await writeFile(path.join(fixture,'.gitignore'), 'skills/.system/\nskills/codex*/\nskills/ignored/\n');
  execFileSync('git',['init','-q',fixture]);
  execFileSync('git',['-C',fixture,'add','.']);
  const record = {sourceType:'github', source:'original/skills', skillPath:'skills/avoid-ai-writing/SKILL.md'};
  const lock = {'avoid-ai-writing':record, alias:record, ignored:record, 'codex-router':record};
  const selectedIds = ['avoid-ai-writing', 'alias', 'ignored', 'codex-router', 'system-imagegen'];
  const result = await collectSkills(skillsRoot, lock, selectedIds);
  assert.deepEqual(result.map(({id})=>id),['avoid-ai-writing']);
  assert.equal(result[0].source.url,'https://github.com/original/skills/blob/HEAD/skills/avoid-ai-writing/SKILL.md');
  const scoped = await collectSkills(skillsRoot, lock, ['unlisted']);
  assert.deepEqual(scoped, [], 'Installed lock skills outside the design selection must stay excluded');
  await assert.rejects(() => collectSkills(skillsRoot, {'../bad':record}, ['../bad']), /Invalid skill ID/);
  const ownRoot = path.join(fixture, '.agents/skills');
  await mkdir(path.join(ownRoot, 'ask-jado'), { recursive: true });
  await writeFile(path.join(ownRoot, 'ask-jado/SKILL.md'), '---\nname: ask-jado\ndescription: Clarify the missing decision.\n---\n# Ask JADO\n');
  const local = await collectSkills(skillsRoot, lock, ['avoid-ai-writing', 'ask-jado'], { ownRoot });
  assert.deepEqual(local.map(({id}) => id), ['ask-jado', 'avoid-ai-writing']);
  assert.equal(local[0].source.kind, 'local');
  assert.equal(local[0].source.localPath, '.agents/skills/ask-jado/SKILL.md');
  assert.equal(local[0].source.url, 'https://github.com/mattiamichini-design/jado/blob/HEAD/.agents/skills/ask-jado/SKILL.md');
  assert.equal(local[1].source.localUrl, 'https://github.com/mattiamichini-design/jado/blob/HEAD/skills/avoid-ai-writing/SKILL.md');
  assert.equal(local[1].source.url, result[0].source.url, 'The executable snapshot link must not replace upstream attribution');
  await writeFile(path.join(ownRoot, 'ask-jado/SKILL.md'), '---\nname: different-id\ndescription: Wrong identity.\n---\n');
  await assert.rejects(() => collectSkills(skillsRoot, {}, ['ask-jado'], { ownRoot }), /Invalid local skill metadata/);
  const guide = { description: 'Summary', does: 'Procedure', when: 'Trigger', usage: 'Inputs', example: 'Request', outputs: ['Artifact'] };
  assert.equal(catalogGuide('skills', {id: 'ask-jado'}, guide).does, 'Procedure');
  assert.equal(catalogGuide('agents', {id: 'role', name: 'Original role'}, {...guide, name: 'Wrong role'}).name, 'Original role', 'Editorial prose must preserve source identity');
  assert.throws(() => catalogGuide('skills', {id: 'ask-jado'}, {...guide, does: ''}), /Missing catalog guide/);
  assert.throws(() => catalogGuide('skills', {id: 'ask-jado'}, {...guide, outputs: []}), /Invalid catalog guide/);
  assert.throws(() => catalogGuide('skills', {id: 'ask-jado'}, {...guide, prerequisites: 'Missing tool'}), /Invalid catalog guide/);
} finally {
  await rm(fixture,{recursive:true,force:true});
}

const selection = JSON.parse(await readFile('registry/catalog-selection.json', 'utf8'));
const copy = JSON.parse(await readFile('registry/catalog-copy.json', 'utf8'));
for (const kind of ['skills','agents']) {
  assert.deepEqual(Object.keys(copy[kind]).sort(), [...selection[kind]].sort(), 'Every selected capability needs design context');
  const {entries} = JSON.parse(await readFile(`registry/${kind}.json`, 'utf8'));
  assert.deepEqual(entries.map(({id})=>id).sort(), [...selection[kind]].sort(), `Catalog must match the curated ${kind} selection`);
  const pages = await documents(`content/docs/automation/${kind}`);
  assert.equal(pages.length, entries.length + 1, 'Excluded catalog pages must be removed');
  assert.equal(new Set(entries.map(({name})=>name.toLowerCase())).size,entries.length,'Duplicate capability names');
  for (const entry of entries) {
    assert.equal(entry.description, copy[kind][entry.id].description);
    assert.equal(entry.usage, copy[kind][entry.id].usage);
    for (const field of ['does', 'when', 'example', 'outputs', 'prerequisites']) assert.deepEqual(entry[field], copy[kind][entry.id][field]);
    const page = await readFile(`content/docs/automation/${kind}/${entry.id}.md`, 'utf8');
    assert(page.includes(entry.usage), 'Generated usage must retain the design handoff');
    for (const heading of ['What it does', 'When to use it', 'How to use it', 'What it delivers', 'Example', 'Executable instructions']) assert(page.includes(`## ${heading}`), `Missing human-readable section: ${entry.id}/${heading}`);
    assert(page.includes(entry.source.localUrl), 'Readers need the executable JADO copy');
    assert(entry.outputs.length > 0);
    assert(!/SHA-256|Local changes|Revision:|Configured model:/.test(page));
    if (kind === 'skills') {
      assert(!/^(system-|codex)/.test(entry.id));
      assert(page.includes(entry.source.url));
      assert.equal(new URL(entry.source.url).pathname.split('/').slice(1,3).join('/'),entry.source.repository);
      if (entry.source.localPath) await readFile(entry.source.localPath, 'utf8');
      else assert.equal(entry.source.localUrl,entry.source.url,'External instructions resolve upstream without a vendored copy');
    } else {
      const role = resolveAgents(JSON.parse(await readFile('jado/agents.json', 'utf8'))).find(({id}) => id === entry.id);
      assert(role, 'The current catalog includes only JADO agents');
      assert.equal(entry.name, role.name);
      assert.notEqual(entry.name, entry.id);
      assert(!/new session|discovery|Trusted|configured profile/i.test([entry.does, entry.when, entry.usage].join(' ')), 'Configuration belongs in the index, not every agent guide');
    }
  }
}
assert(!selection.skills.some((id) => ['ask-design', 'ui-flow'].includes(id)));
assert(selection.agents.every((id) => id.startsWith('jado-agent-')), 'The catalog lists only JADO profiles');
const agentsIndex = await readFile('content/docs/automation/agents/index.md', 'utf8');
assert(agentsIndex.includes('/docs/jado/configuration'));
for (const {file,body} of await documents()) assert(!/SHA-256|Local changes since revision/i.test(body), `Non-operational content in ${file}`);
console.log('Catalog selection, deduplication, attribution and editorial regression checks passed.');
