#!/usr/bin/env node
// Resolve the three dials for one JADO run and print the run's limits as JSON.
// Self-contained: it runs from any installed copy, with the JADO root four levels up.
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: resolve.mjs --route <id> [--stage explore|refine|ship] [--involvement autopilot|checkpoints|pair] [--budget lean|normal|deep] [--mode solo|macro|specialists] [--project <product root>] [--root <JADO root>]';

export async function resolve(options) {
  const root = path.resolve(options.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../..'));
  const index = JSON.parse(await readFile(path.join(root, 'jado/runtime/index.json'), 'utf8'));
  const { dials, rules } = index.policy;
  const route = index.routes.find(r => r.id === options.route);
  if (!route) throw new Error(`Unknown route: ${options.route}. Routes: ${index.routes.map(r => r.id).join(', ')}`);
  const packet = JSON.parse(await readFile(path.join(root, route.packet), 'utf8'));

  // Request or checkpoint > project "JADO defaults:" line > policy default.
  const projectDefaults = {};
  if (options.project) {
    for (const name of ['AGENTS.md', 'CLAUDE.md']) {
      const text = await readFile(path.join(options.project, name), 'utf8').catch(() => '');
      const line = text.match(/^JADO defaults:(.*)$/m)?.[1] ?? '';
      for (const [, key, value] of line.matchAll(/(\w+)=(\w+)/g)) projectDefaults[key] ??= { value, source: name };
    }
  }
  const resolved = {};
  for (const key of ['stage', 'involvement', 'budget']) {
    const pick = options[key] ? { value: options[key], source: 'request' } : projectDefaults[key] ?? { value: dials[key].default, source: 'policy default' };
    if (!dials[key].values[pick.value]) throw new Error(`Invalid ${key} "${pick.value}" from ${pick.source}. Values: ${Object.keys(dials[key].values).join(', ')}`);
    resolved[key] = pick;
  }
  const stageId = resolved.stage.value;
  if (route.stages && !route.stages.includes(stageId)) throw new Error(`${route.id} does not support ${stageId}. Supported: ${route.stages.join(', ')}. Choose a route for this stage.`);

  const stage = dials.stage.values[stageId];
  const budget = dials.budget.values[resolved.budget.value];
  const cap = packet.workflow.budget ?? {};
  const limit = key => Math.min(budget[key], cap[key] ?? budget[key]);
  const mode = options.mode ?? budget.mode;
  const reviewRequired = stage.independentReview === 'required' || (stage.independentReview !== 'none' && resolved.budget.value !== 'lean');
  const tier = budget.modelTier;
  return {
    announce: `JADO · ${route.id} ${stageId} · ${resolved.involvement.value} · ${resolved.budget.value}`,
    jadoRoot: root,
    methodRevision: index.methodRevision,
    route: { id: route.id, summary: route.summary, packet: route.packet },
    dials: resolved,
    limits: {
      variants: stage.variants,
      fidelity: stage.fidelity,
      selfCheck: stage.selfCheck,
      maxFixPasses: stage.maxFixPasses,
      independentReview: reviewRequired ? 'required' : 'skipped at this stage and budget',
      independentNodes: packet.guards?.independentNodes ?? [],
      evidence: stage.evidence,
      newDelegations: limit('newDelegations'),
      concurrent: limit('concurrent'),
      repairBatches: limit('repairBatches'),
      mode,
      modelTier: { tier, ...dials.budget.modelTiers[tier] },
      ...(budget.note ? { note: budget.note } : {}),
    },
    involvement: dials.involvement.values[resolved.involvement.value],
    rules,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: Object.fromEntries(['route', 'stage', 'involvement', 'budget', 'mode', 'project', 'root'].map(k => [k, { type: 'string' }])) });
  if (!values.route) { console.error(usage); process.exit(2); }
  try { console.log(JSON.stringify(await resolve(values), null, 2)); }
  catch (error) { console.error(error.message); process.exit(1); }
}
