import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { executionPlan } from '../../lib/jado/execution.ts';
import { readJado } from '../../lib/jado/store.ts';

const [command, ...args] = process.argv.slice(2);

async function plan() {
  const { values } = parseArgs({ args, options: { workflow: { type: 'string' }, mode: { type: 'string' }, stage: { type: 'string' }, budget: { type: 'string' }, selection: { type: 'string' }, author: { type: 'string' } } });
  const current = await readJado();
  const workflow = current.document.workflows.find((w) => w.id === values.workflow);
  if (!workflow) throw new Error('Unknown workflow. Use --workflow R04.');
  const method = JSON.parse(await readFile('jado/policies/method.json', 'utf8'));
  const options = values.selection ? JSON.parse(await readFile(values.selection, 'utf8')) : {};
  if (values.author) options.author = values.author;
  if (values.stage) options.stage = values.stage;
  // The budget dial picks the default mode and caps delegations below the route limit.
  const budget = method.dials.budget.values[values.budget ?? method.dials.budget.default];
  if (!budget) throw new Error('Unknown budget. Use lean, normal or deep.');
  if (options.delegationBudget === undefined) options.delegationBudget = Math.min(budget.newDelegations, workflow.budget.newDelegations);
  const execution = executionPlan(current.document, current.catalog, current.guards, workflow.id, values.mode ?? budget.mode, options);
  console.log(JSON.stringify({ execution, jadoRoot: process.cwd(), revision: current.revision, packet: `jado/runtime/${workflow.id}.json`, skillPaths: execution.procedures, note: 'Candidate or resolved plan based on declared selections. It neither starts agents nor certifies execution.' }, null, 2));
}

try {
  if (command === 'refresh') await (await import('./refresh.mjs')).runRefresh(args);
  else if (['install', 'update', 'link', 'uninstall'].includes(command)) await (await import('./setup.mjs')).runSetup([command, ...args]);
  else if (command === 'plan') await plan();
  else if (!command || ['help', '--help', '-h'].includes(command)) await (await import('./setup.mjs')).runSetup(['install', '--help']);
  else throw new Error(`Unknown command: ${command}. Run npm run jado -- --help.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
