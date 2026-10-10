import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, realpath, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareInstall as buildInstall, applyInstall } from './install.mjs';
import { prepareGlobal as buildGlobal, prepareLink, prepareUninstall, applyUninstall } from './setup.mjs';
import { fixturePackage } from './fixtures.mjs';

const prepareGlobal = options => buildGlobal({ loadPackage: fixturePackage, ...options });
const prepareInstall = options => buildInstall({ loadPackage: fixturePackage, ...options });
const fixture = await realpath(await mkdtemp(path.join(tmpdir(), 'jado-uninstall-test-')));
const backups = [];
const apply = async (plan, run = applyInstall) => { const result = await run(plan, plan.revision); backups.push(result.backup); return result; };
const missing = async file => assert.equal(await lstat(file).catch(() => null), null, `${file} should not exist`);
try {
  const home = path.join(fixture, 'user');
  await mkdir(path.join(home, '.agents/skills/unrelated'), { recursive: true });
  await mkdir(path.join(home, '.codex'));
  await mkdir(path.join(home, '.claude'));
  const unrelated = '---\nname: unrelated\ndescription: Not managed by JADO.\n---\n';
  await writeFile(path.join(home, '.agents/skills/unrelated/SKILL.md'), unrelated);
  const config = 'model_reasoning_effort = "high"\n[mcp_servers.existing]\ncommand = "keep-me"\n';
  const claude = '# Personal rules\n\nKeep product contracts.\n';
  await writeFile(path.join(home, '.codex/config.toml'), config, { mode: 0o600 });
  await writeFile(path.join(home, '.claude/CLAUDE.md'), claude);

  await apply(await prepareGlobal({ tools: ['claude-code', 'codex', 'opencode'], userRoot: home }));
  assert((await readFile(path.join(home, '.claude/CLAUDE.md'), 'utf8')).includes('BEGIN JADO'));

  // A linked project records only its managed block and .jado entry files.
  const product = path.join(fixture, 'product'); await mkdir(product);
  await writeFile(path.join(product, 'AGENTS.md'), '# Product\n');
  await apply(await prepareLink({ target: product, userRoot: home }));
  await assert.rejects(() => prepareUninstall({ global: true, userRoot: product }), /project installation/);
  const unlink = await prepareUninstall({ target: product });
  assert.deepEqual(unlink.summary.editBlocks, ['AGENTS.md']);
  assert.deepEqual(unlink.summary.remove, ['CLAUDE.md'], 'An entry that held only the JADO block is removed');
  await apply(unlink, applyUninstall);
  assert.deepEqual(await readdir(product), ['AGENTS.md'], 'The link leaves only the original entry');
  assert.equal(await readFile(path.join(product, 'AGENTS.md'), 'utf8'), '# Product\n');

  // A scheduled refresh must be disabled before its installation goes away.
  await writeFile(path.join(home, '.jado/refresh.json'), JSON.stringify({ enabled: true, everyDays: 7 }));
  const scheduled = await prepareUninstall({ global: true, userRoot: home });
  assert.equal(scheduled.summary.scheduledRefresh, true);
  await assert.rejects(() => applyUninstall(scheduled, scheduled.revision), /refresh --disable/);
  await writeFile(path.join(home, '.jado/refresh.json'), JSON.stringify({ enabled: false, everyDays: 7 }));

  const plan = await prepareUninstall({ global: true, userRoot: home });
  assert.deepEqual(plan.kept, []);
  assert(plan.summary.remove.includes('.claude/agents/jado-agent-ux.md'));
  assert(plan.summary.remove.includes('.agents/skills/jado-flow'));
  await apply(plan, applyUninstall);
  await missing(path.join(home, '.jado'));
  await missing(path.join(home, '.codex/agents'));
  await missing(path.join(home, '.claude/agents'));
  await missing(path.join(home, '.config'));
  await missing(path.join(home, '.codex/AGENTS.md'));
  assert.equal(await readFile(path.join(home, '.codex/config.toml'), 'utf8'), config, 'The managed block leaves config.toml as it was');
  assert.equal((await lstat(path.join(home, '.codex/config.toml'))).mode & 0o777, 0o600);
  assert.equal(await readFile(path.join(home, '.claude/CLAUDE.md'), 'utf8'), claude, 'The managed block leaves CLAUDE.md as it was');
  assert.deepEqual(await readdir(path.join(home, '.agents/skills')), ['unrelated'], 'Only JADO skill links are removed');
  assert.equal(await readFile(path.join(home, '.agents/skills/unrelated/SKILL.md'), 'utf8'), unrelated);
  await assert.rejects(() => prepareUninstall({ global: true, userRoot: home }), /No JADO installation/);

  // A local copy keeps files changed after installation and reports them.
  const local = path.join(fixture, 'local'); await mkdir(local);
  await apply(await prepareInstall({ target: local, tools: ['claude-code'] }));
  await writeFile(path.join(local, 'AGENTS.md'), '# Product rules added after installation\n');
  const localPlan = await prepareUninstall({ target: local });
  assert.deepEqual(localPlan.kept, ['AGENTS.md']);
  await apply(localPlan, applyUninstall);
  assert.deepEqual(await readdir(local), ['AGENTS.md']);
} finally {
  for (const backup of backups) await rm(backup, { recursive: true, force: true });
  await rm(fixture, { recursive: true, force: true });
}
console.log('JADO uninstall: global, linked and local removal, restored entries, kept edits and scheduled refresh verified.');
