import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { ROUTE_COPY } from '../../components/landing/routes-data.ts';
import {
  BUDGETS,
  INVOLVEMENTS,
  STAGES,
  availabilityNote,
  availabilitySentence,
  buildRoutesModel,
  chainMarkers,
  columnSummary,
  effectiveBudget,
  readoutSegments,
  reviewRuns,
  segmentsText,
  stageSummary,
} from '../../components/landing/routes-model.ts';

// The landing reads the same runtime files the installable method ships. Every number in the
// landing routes section must trace back to them.
const read = async (file) => JSON.parse(await readFile(new URL(`../../jado/runtime/${file}`, import.meta.url), 'utf8'));
const index = await read('index.json');
const packets = {};
for (const route of index.routes.filter((entry) => Array.isArray(entry.stages))) {
  packets[route.id] = await read(route.packet.split('/').pop());
}
const model = buildRoutesModel(index, packets, ROUTE_COPY);
const byId = Object.fromEntries(model.routes.map((route) => [route.id, route]));
const plain = (route, dials) => segmentsText(readoutSegments(route, dials, model));
// Words in a chip, with a numeral counted together with the word after it ("4 options", "2 at once").
const chipUnits = (text) => text.split(/\s+/).filter(Boolean).reduce((n, word, i, words) => n + (i > 0 && /^\d+$/.test(words[i - 1]) ? 0 : 1), 0);
const dialSets = STAGES.flatMap((stage) => INVOLVEMENTS.flatMap((involvement) => BUDGETS.map((budget) => ({ stage, involvement, budget }))));

test('method values come from the runtime files', () => {
  assert.deepEqual(Object.fromEntries(STAGES.map((stage) => [stage, model.method.stages[stage]])), {
    explore: { variants: 4, review: 'none' },
    refine: { variants: 2, review: 'budget' },
    ship: { variants: 1, review: 'required' },
  });
  assert.deepEqual(model.method.budgets, {
    lean: { helpers: 1, concurrent: 1, repairs: 1 },
    normal: { helpers: 4, concurrent: 2, repairs: 1 },
    deep: { helpers: 8, concurrent: 3, repairs: 2 },
  });
  assert.equal(model.routes.length, 8);
  assert.deepEqual(
    STAGES.map((stage) => model.routes.filter((route) => route.stages.includes(stage)).length),
    [7, 8, 3],
  );
});

test('effective budget is the lower of the route cap and the dial', () => {
  const ea = byId.R05;
  assert.deepEqual(effectiveBudget(ea, 'lean', model.method), { helpers: 1, concurrent: 1, repairs: 1 });
  assert.deepEqual(effectiveBudget(ea, 'normal', model.method), { helpers: 4, concurrent: 2, repairs: 1 });
  assert.deepEqual(effectiveBudget(ea, 'deep', model.method), { helpers: 4, concurrent: 3, repairs: 2 });
  // Patch has no helpers; Decide, Council and Visual research have no repair step.
  assert.equal(effectiveBudget(byId.R01, 'deep', model.method).helpers, 0);
  assert.equal(effectiveBudget(byId.R01, 'deep', model.method).repairs, 1);
  for (const id of ['R03', 'R08', 'visual-research']) assert.equal(effectiveBudget(byId[id], 'deep', model.method).repairs, 0, id);
});

test('route caps match the budget lines the landing carried before the derivation', () => {
  const before = {
    R01: [0, 0, 1],
    R03: [2, 2, 0],
    R04: [4, 2, 2],
    R05: [4, 3, 2],
    R07: [8, 3, 2],
    R08: [6, 3, 0],
    R09: [4, 2, 1],
    'visual-research': [2, 1, 0],
  };
  for (const [id, expected] of Object.entries(before)) {
    const route = byId[id];
    assert.deepEqual([route.caps.helpers, route.caps.concurrent, route.hasRepair ? route.caps.repairs : 0], expected, id);
  }
});

test('only routes that follow the stage variant count show it', () => {
  assert.deepEqual(model.routes.filter((route) => route.followsVariants).map((route) => route.id).sort(), ['R05', 'R07', 'R09']);
  for (const route of model.routes) assert.equal(Boolean(route.lead), !route.followsVariants, route.id);
});

test('the approved readout sentences are reproduced exactly', () => {
  assert.equal(
    plain(byId.R05, { stage: 'explore', involvement: 'checkpoints', budget: 'normal' }),
    'JADO builds 4 options on Paper with 4 helpers, 2 at once and 1 repair round, and no independent review at Explore. It asks you at an open direction decision, at option selection and before code.',
  );
  assert.equal(
    plain(byId.R04, { stage: 'ship', involvement: 'autopilot', budget: 'lean' }),
    'JADO builds the approved direction in code, working solo with 1 repair round and keeping its 1 helper for the independent review. No questions: JADO decides, logs why and you review at delivery.',
  );
  assert.equal(
    plain(byId.R07, { stage: 'refine', involvement: 'pair', budget: 'deep' }),
    'JADO builds 2 options with 8 helpers, 3 at once and 2 repair rounds, plus an independent review because the budget is deep. It asks you before every decision on taste or direction and shows intermediate results.',
  );
  assert.equal(
    plain(byId.R05, { stage: 'refine', involvement: 'pair', budget: 'lean' }),
    'JADO builds 2 options on Paper with 1 helper, 1 at once and 1 repair round, and no independent review on a lean budget. It asks you before every decision on taste or direction and shows intermediate results.',
  );
});

test('every dial combination of every route reads as correct English', () => {
  let checked = 0;
  const chips = new Set();
  for (const route of model.routes) {
    for (const dials of dialSets) {
      const segments = readoutSegments(route, dials, model);
      const text = segmentsText(segments);
      const where = `${route.id} ${dials.stage}/${dials.involvement}/${dials.budget}: ${text}`;
      checked += 1;

      assert.doesNotMatch(text, /undefined|NaN|null|\[object/, where);
      assert.doesNotMatch(text, /\s{2,}|\s[,.:]|,\s*,|\.\./, where);
      assert.match(text, /[.]$/, where);
      // Punctuation hugs the word before it; no stray space, and nothing starts with punctuation.
      assert.doesNotMatch(text, / [,.:]/, where);
      for (const segment of segments) {
        if (typeof segment === 'string') assert.doesNotMatch(segment, /^\s+[,.:]/, where);
      }

      // Numbers and units agree with the derived values.
      // The stage option count appears only for routes that follow it: R05, R07 and R09.
      const variants = model.method.stages[dials.stage].variants;
      if (route.followsVariants) {
        assert.ok(text.startsWith(variants === 1 ? 'JADO builds 1 option' : `JADO builds ${variants} options`), where);
      } else {
        assert.ok(text.startsWith(route.lead), where);
        assert.doesNotMatch(text.replace('2–4 options', ''), /\b\d+ options?\b/, where);
      }
      assert.doesNotMatch(text, /\b1 (options|helpers|repair rounds)\b/, where);
      assert.doesNotMatch(text, /\b([02-9]|\d{2,}) (option|helper|repair round)\b/, where);

      const budget = effectiveBudget(route, dials.budget, model.method);
      const solo = reviewRuns(route, dials, model.method) && dials.budget === 'lean';
      if (budget.helpers === 0) assert.match(text, /with no helpers and /, where);
      else if (solo) assert.match(text, /working solo with .*(, | and )keeping its 1 helper for the independent review\./, where);
      else {
        assert.ok(text.includes(budget.helpers === 1 ? '1 helper,' : `${budget.helpers} helpers,`), where);
        assert.ok(text.includes(`${budget.concurrent} at once`), where);
      }
      if (!solo) {
        if (budget.repairs === 0) assert.match(text, /no repairs/, where);
        else assert.ok(text.includes(budget.repairs === 1 ? '1 repair round' : `${budget.repairs} repair rounds`), where);
      }

      // Solo wording keeps one punctuation pattern for every lead.
      if (solo) assert.match(text, /^[^,]+, working solo with /, where);
      assert.doesNotMatch(text, /[a-z] working solo/, where);

      // Surface wording.
      if (route.surface === 'Any') assert.doesNotMatch(text, /\b(on Paper|in code|in VariantHub)\b/, where);
      if (route.surface === 'Code or Paper') assert.match(text, /in code or on Paper/, where);

      // Review wording follows the stage rule, the budget and the route.
      if (reviewRuns(route, dials, model.method)) assert.match(text, /independent review/, where);
      else assert.match(text, /no independent review (at Explore|on a lean budget|on this route)/, where);
      if (dials.stage === 'explore') assert.match(text, /no independent review at Explore/, where);

      // Involvement wording.
      if (dials.involvement === 'autopilot') assert.match(text, /No questions: JADO decides, logs why and you review at delivery\.$/, where);
      if (dials.involvement === 'checkpoints') assert.match(text, /It asks you at an open direction decision.*\.$/, where);
      if (dials.involvement === 'pair') assert.match(text, /It asks you before every decision on taste or direction and shows intermediate results\.$/, where);

      // One fragment per id, and numbers never split from their units.
      for (const seg of segments) if (typeof seg !== 'string') chips.add(seg.text);
      const ids = segments.filter((segment) => typeof segment !== 'string').map((segment) => segment.id);
      assert.equal(new Set(ids).size, ids.length, where);
      for (const segment of segments) {
        if (typeof segment === 'string') continue;
        assert.doesNotMatch(segment.text, /\d [a-z]/, `${where} splits a number from its unit in "${segment.text}"`);
        // A chip covers at most two units; a numeral and its unit count as one.
        assert.ok(chipUnits(segment.text) <= 2, `${where} chip "${segment.text}" is longer than two words`);
        assert.equal(segment.text, segment.text.trim(), `${where} chip "${segment.text}" has edge spaces`);
        assert.doesNotMatch(segment.text, /^[,.:;]|[,.:;]$/, `${where} chip "${segment.text}" holds punctuation`);
      }
    }
  }
  assert.equal(checked, 3 * 3 * 3 * 8);
  // Every chip distinct text, for the reviewer's table.
  assert.ok(chips.size > 0);
});

test('the matrix summary follows the stage and budget dials', () => {
  assert.deepEqual(columnSummary('explore', 'normal', model), {
    stage: 'explore',
    label: 'Explore',
    routes: '7 routes',
    options: '4 options',
    review: 'No independent review',
  });
  assert.equal(columnSummary('refine', 'lean', model).review, 'No independent review on a lean budget');
  assert.equal(columnSummary('refine', 'normal', model).review, 'Independent review');
  assert.equal(columnSummary('refine', 'deep', model).review, 'Independent review');
  assert.deepEqual(columnSummary('ship', 'lean', model), {
    stage: 'ship',
    label: 'Ship',
    routes: '3 routes',
    options: '1 option',
    review: 'Independent review',
  });
  assert.equal(stageSummary('explore', model), '7 of 8 routes run at Explore');
  assert.equal(stageSummary('ship', model), '3 of 8 routes run at Ship');
});

test('unavailable routes say where they run', () => {
  assert.equal(availabilityNote(byId.R04), 'Refine and Ship only');
  assert.equal(availabilityNote(byId.R05), 'Explore and Refine only');
  assert.equal(availabilityNote(byId.R01), null);
  assert.equal(
    availabilitySentence(byId.R04),
    'Build runs at Refine and Ship. Switch the stage to Refine or Ship to see how it runs with your settings.',
  );
});

test('chain markers follow the involvement dial', () => {
  const texts = (id, dials) => chainMarkers(byId[id], dials, model).map((marker) => marker?.text ?? null);
  assert.deepEqual(texts('R05', { stage: 'explore', involvement: 'checkpoints', budget: 'normal' }), ['Asks you, if open', null, null, 'Asks you']);
  assert.deepEqual(texts('R05', { stage: 'refine', involvement: 'pair', budget: 'lean' }), ['Asks you', 'Shows you', null, 'Asks you']);
  assert.deepEqual(texts('R07', { stage: 'refine', involvement: 'pair', budget: 'deep' }), ['Asks you', 'Shows you', 'Asks you', 'Shows you', 'Independent', null]);
  assert.deepEqual(texts('R04', { stage: 'ship', involvement: 'autopilot', budget: 'lean' }), [null, null, null, 'Independent', 'You review']);
  assert.deepEqual(texts('R04', { stage: 'refine', involvement: 'autopilot', budget: 'lean' }), [null, null, null, null, 'You review']);
  for (const route of model.routes) {
    for (const dials of dialSets) {
      const markers = chainMarkers(route, dials, model);
      assert.equal(markers.length, route.chain.length);
      const independent = markers.filter((marker) => marker?.text === 'Independent').length;
      assert.equal(independent, reviewRuns(route, dials, model.method) ? 1 : 0, `${route.id} ${JSON.stringify(dials)}`);
    }
  }
});

test('route copy is complete and free of retired wording', () => {
  for (const route of model.routes) {
    const everything = [route.name, route.use, route.text, ...route.mustPass, ...route.chain.map((step) => step.label)].join(' ');
    assert.doesNotMatch(everything, /fix pass/i, route.id);
    assert.equal(new Set(route.chain.map((step) => step.label)).size, route.chain.length, `${route.id} chain labels are unique`);
    assert.equal(
      route.chain.filter((step) => step.independent).length,
      route.hasReview ? 1 : 0,
      `${route.id} marks the independent review step exactly when the packet has a reviewer`,
    );
  }
  const labels = { any: ['Any', 'Code or Paper'], paper: ['Paper'], code: ['Code'], varianthub: ['VariantHub'] };
  for (const route of model.routes) assert.ok(labels[route.packetSurface]?.includes(route.surface), `${route.id} surface label matches the packet`);
  assert.doesNotMatch(byId.R05.text, /By default Explore builds four/);
  assert.doesNotMatch(byId.R07.text, /Ship adds independent reviews/);
  assert.equal(byId.R04.text, 'JADO turns the approved direction or canvas into code and captures it in the browser.');
  assert.match(byId.R01.text, /After one repair round/);
});
