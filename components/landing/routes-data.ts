/**
 * Landing Routes copy: the words only. Stages, review rules, budget caps and the repair
 * count come from jado/runtime (see routes-model.ts and routes-source.ts), never from here.
 *
 * The eight routes are the ones 00-router can select. The router itself and the
 * setup-project governance flow are not routes and stay out of the matrix. The order is
 * fixed: the matrix never reorders when a dial changes.
 *
 * Chain convention: kind 'review' marks the route's required check; kind 'end' marks the
 * last step; `independent` marks the step where an independent review sits when one runs.
 * Labels must be unique within a route (React keys).
 */

import type { RouteCopy } from './routes-model.ts';

export const ROUTE_COPY: RouteCopy[] = [
  {
    id: 'R01',
    lead: 'JADO makes one fix',
    code: 'R01',
    name: 'Patch',
    surface: 'Code or Paper',
    use: 'Make one precise, reversible fix',
    chain: [{ label: 'Read' }, { label: 'Edit' }, { label: 'Check', kind: 'review' }, { label: 'Deliver', kind: 'end' }],
    text: 'The change is already defined, so JADO edits only what is in scope. It captures the result and checks it against what you expected. After one repair round, anything still wrong is reported.',
    mustPass: ['Capture check'],
  },
  {
    id: 'R07',
    code: 'R07',
    name: 'Staged delivery',
    surface: 'Any',
    use: 'Carry one mandate from UX to canvas to code',
    chain: [
      { label: 'Mandate' },
      { label: 'Brief' },
      { label: 'Design' },
      { label: 'Build' },
      { label: 'Review', kind: 'review', independent: true },
      { label: 'Deliver', kind: 'end' },
    ],
    text: 'You set where it stops: UX, canvas or code. JADO works through each in order and checks it before moving on.',
    mustPass: ['A gate for each output', 'Independent reviews at Ship'],
    beforeCode: true,
  },
  {
    id: 'visual-research',
    lead: 'JADO collects references',
    name: 'Visual research',
    surface: 'Any',
    use: 'Find UI patterns or style references',
    chain: [{ label: 'Question' }, { label: 'Search' }, { label: 'Curate', kind: 'review' }, { label: 'Hand off', kind: 'end' }],
    text: 'Pattern questions use real products. Style questions can use Pinterest, images and websites. JADO records why each reference was kept or rejected. A moodboard is built only when you ask for one.',
    mustPass: ['Reference selection', 'Sources and coverage'],
  },
  {
    id: 'R05',
    code: 'R05',
    name: 'Explore alternatives',
    surface: 'Paper',
    use: 'Compare options on the canvas, then choose',
    chain: [
      { label: 'Question' },
      { label: 'Design' },
      { label: 'Inspect', independent: true },
      { label: 'You choose', kind: 'end' },
    ],
    text: 'Every option tests a different idea on the same content. Pick one, combine them or ask for another round before anything moves to code.',
    mustPass: ['Self-check', 'Your selection'],
    beforeCode: true,
  },
  {
    id: 'R09',
    code: 'R09',
    name: 'VariantHub',
    surface: 'VariantHub',
    use: 'Compare code alternatives when you name VariantHub',
    chain: [
      { label: 'Request' },
      { label: 'Build' },
      { label: 'Isolate' },
      { label: 'Check', kind: 'review' },
      { label: 'You choose', kind: 'end' },
    ],
    text: 'Each alternative tests its own structural idea in isolation. JADO checks that every option opens and compares before you pick. Moving your pick into shared code needs its own approval.',
    mustPass: ['Comparison check', 'Your selection'],
  },
  {
    id: 'R03',
    lead: 'JADO prepares 2–4 options for your decision',
    code: 'R03',
    name: 'Decide with the user',
    surface: 'Any',
    use: 'Make one open decision yourself',
    chain: [{ label: 'Clarify' }, { label: 'Fill gaps' }, { label: 'Options' }, { label: 'You decide', kind: 'end' }],
    text: "You make the call, one open decision at a time. Gaps in evidence, flow or direction are filled first. Then you get two to four distinct options, with JADO's recommendation first.",
    mustPass: ['Your decision'],
  },
  {
    id: 'R08',
    lead: 'JADO gathers three independent proposals',
    code: 'R08',
    name: 'Council',
    surface: 'Any',
    use: 'Weigh three independent views on a consequential choice',
    chain: [{ label: 'Question' }, { label: 'Propose' }, { label: 'Compare', kind: 'review' }, { label: 'Decide', kind: 'end' }],
    text: "Research, UX and visual specialists answer the same question before seeing each other's work. A substantive conflict gets one targeted reply. The decision is recorded with its reasons and any dissent.",
    mustPass: ['Independent proposals', 'Recorded decision'],
  },
  {
    id: 'R04',
    lead: 'JADO builds the approved direction',
    code: 'R04',
    name: 'Build',
    surface: 'Code',
    use: 'Turn an approved direction or canvas into code',
    chain: [
      { label: 'Read source' },
      { label: 'Build' },
      { label: 'Capture' },
      { label: 'Review', kind: 'review', independent: true },
      { label: 'Deliver', kind: 'end' },
    ],
    text: 'JADO turns the approved direction or canvas into code and captures it in the browser.',
    mustPass: ['Final checks', 'Visual review at Ship'],
  },
];
