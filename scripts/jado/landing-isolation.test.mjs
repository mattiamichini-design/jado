import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareInstall as buildInstall } from './install.mjs';
import { fixturePackage } from './fixtures.mjs';

// The landing page (app/(site)/(landing), components/landing, public/landing) must never ship
// with the installable framework. The installer plan lists every file it would write.
const fixture = await mkdtemp(path.join(tmpdir(), 'jado-landing-isolation-'));
try {
  const target = await realpath(await mkdir(path.join(fixture, 'product')).then(() => path.join(fixture, 'product')));
  const plan = await buildInstall({ target, tools: ['codex'], loadPackage: fixturePackage });
  assert(plan.changes.length > 0, 'The plan must list the files it would write');
  const leaked = plan.changes.map(c => c.relative).filter(r => /^(app|components|public|\.jado\/(app|components|public))\//.test(r) || /landing/i.test(r));
  assert.deepEqual(leaked, [], `Installer plan must not include the landing page: ${leaked.join(', ')}`);
} finally {
  await rm(fixture, { recursive: true, force: true });
}
