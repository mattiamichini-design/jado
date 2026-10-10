/**
 * Landing Routes model: derives what each route does at a given stage, involvement and
 * budget from the runtime packets (jado/runtime/index.json and the route packets), and
 * writes the readout sentence and the chain markers from those values.
 *
 * Pure TypeScript with no imports, so Next and `node --test` (type stripping) share it.
 * Nothing here is typed by hand: stage variants, review rules, budget dials, route stages
 * and route caps all come from the method files.
 */

export type Stage = 'explore' | 'refine' | 'ship';
export type Involvement = 'autopilot' | 'checkpoints' | 'pair';
export type Budget = 'lean' | 'normal' | 'deep';

export const STAGES: Stage[] = ['explore', 'refine', 'ship'];
export const INVOLVEMENTS: Involvement[] = ['autopilot', 'checkpoints', 'pair'];
export const BUDGETS: Budget[] = ['lean', 'normal', 'deep'];

export const STAGE_LABELS: Record<Stage, string> = { explore: 'Explore', refine: 'Refine', ship: 'Ship' };
export const STAGE_LETTERS: Record<Stage, string> = { explore: 'E', refine: 'R', ship: 'S' };
export const INVOLVEMENT_LABELS: Record<Involvement, string> = {
  autopilot: 'Autopilot',
  checkpoints: 'Checkpoints',
  pair: 'Pair',
};
export const BUDGET_LABELS: Record<Budget, string> = { lean: 'Lean', normal: 'Normal', deep: 'Deep' };

export const NBSP = ' ';

/* ---------- Types ---------- */

/** none: never; budget: on a normal or deep budget; required: always. */
export type ReviewRule = 'none' | 'budget' | 'required';
export type StageRule = { variants: number; review: ReviewRule };
export type BudgetRule = { helpers: number; concurrent: number; repairs: number };
export type Method = { stages: Record<Stage, StageRule>; budgets: Record<Budget, BudgetRule> };
export type Caps = { helpers: number; concurrent: number; repairs: number };

export type ChainStep = {
  label: string;
  kind?: 'review' | 'end';
  /** The step where the independent review sits, when one runs. */
  independent?: boolean;
};

/** Hand-written route copy. Everything else on a route comes from the packets. */
export type RouteCopy = {
  id: string;
  code?: string;
  name: string;
  /** Surface label shown in the matrix and the readout. */
  surface: string;
  use: string;
  chain: ChainStep[];
  text: string;
  mustPass: string[];
  /** The route can hand off to code, so Checkpoints asks before code. */
  beforeCode?: boolean;
  /**
   * Opening of the readout for routes that do not follow the stage's variant count.
   * Routes that do (the packet says so) open with "JADO builds N options" instead.
   */
  lead?: string;
};

/** Facts read from the runtime packets. */
export type RouteFacts = {
  id: string;
  stages: Stage[];
  caps: Caps;
  /** The packet has a repair step, so the repair count is the cap, not zero. */
  hasRepair: boolean;
  /** The packet has an independent reviewer step. */
  hasReview: boolean;
  /** The packet's surface (any, paper, code, varianthub). The copy's `surface` is its label. */
  packetSurface: string;
  /** The packet follows the stage's variant count (or the requested count), so the stage option count applies. */
  followsVariants: boolean;
};

export type RouteModel = RouteCopy & RouteFacts & { userChoice: boolean };
export type RoutesModel = { method: Method; routes: RouteModel[] };

/* ---------- Derivation from the runtime files ---------- */

type RuntimeIndex = {
  policy: { dials: { stage: { values: Record<string, any> }; budget: { values: Record<string, any> } } };
  routes: Array<{ id: string; stages?: string[] }>;
};
type RuntimePacket = {
  workflow: {
    surface?: string;
    stages?: string[];
    budget: { newDelegations: number; concurrent: number; repairBatches: number };
    nodes: Array<{ id: string; kind: string; label: string; ref?: string }>;
    edges?: Array<{ label?: string }>;
  };
};

const REVIEW_RULES: Record<string, ReviewRule> = {
  none: 'none',
  'when budget is normal or deep': 'budget',
  required: 'required',
};

export function deriveMethod(index: RuntimeIndex): Method {
  const dials = index.policy.dials;
  const stages = {} as Record<Stage, StageRule>;
  for (const stage of STAGES) {
    const value = dials.stage.values[stage];
    const review = REVIEW_RULES[value?.independentReview];
    if (!review || !Number.isInteger(value?.variants)) throw new Error(`Unreadable stage dial: ${stage}`);
    stages[stage] = { variants: value.variants, review };
  }
  const budgets = {} as Record<Budget, BudgetRule>;
  for (const budget of BUDGETS) {
    const value = dials.budget.values[budget];
    if (![value?.newDelegations, value?.concurrent, value?.repairBatches].every(Number.isInteger)) {
      throw new Error(`Unreadable budget dial: ${budget}`);
    }
    budgets[budget] = { helpers: value.newDelegations, concurrent: value.concurrent, repairs: value.repairBatches };
  }
  return { stages, budgets };
}

export function deriveRouteFacts(id: string, indexStages: string[], packet: RuntimePacket): RouteFacts {
  const w = packet.workflow;
  const stages = STAGES.filter((stage) => indexStages.includes(stage));
  const hasRepair =
    (w.edges ?? []).some((edge) => /(repair|fix)[^,]*\bleft\b/i.test(edge.label ?? '')) ||
    w.nodes.some((node) => node.kind === 'action' && /\b(repair|fix)\b/i.test(node.label));
  const hasReview = w.nodes.some((node) => node.kind === 'skill' && /reviewer/i.test(node.ref ?? ''));
  return {
    id,
    stages,
    caps: { helpers: w.budget.newDelegations, concurrent: w.budget.concurrent, repairs: w.budget.repairBatches },
    hasRepair,
    hasReview,
    packetSurface: w.surface ?? 'any',
    followsVariants: /variant count|requested count/i.test(JSON.stringify(packet.workflow)),
  };
}

/** The eight routes the router can pick: index entries with stages. */
export function buildRoutesModel(index: RuntimeIndex, packets: Record<string, RuntimePacket>, copy: RouteCopy[]): RoutesModel {
  const method = deriveMethod(index);
  const entries = index.routes.filter((route) => Array.isArray(route.stages));
  const routes: RouteModel[] = copy.map((c) => {
    const entry = entries.find((route) => route.id === c.id);
    const packet = packets[c.id];
    if (!entry || !packet) throw new Error(`Route copy has no packet: ${c.id}`);
    const facts = deriveRouteFacts(c.id, entry.stages ?? [], packet);
    return { ...c, ...facts, userChoice: /^You\b/.test(c.chain[c.chain.length - 1]?.label ?? '') };
  });
  const missing = entries.filter((entry) => !copy.some((c) => c.id === entry.id)).map((entry) => entry.id);
  if (missing.length) throw new Error(`Routes without copy: ${missing.join(', ')}`);
  return { method, routes };
}

/* ---------- Dials applied to a route ---------- */

export type Dials = { stage: Stage; involvement: Involvement; budget: Budget };

export function runsAt(route: Pick<RouteFacts, 'stages'>, stage: Stage): boolean {
  return route.stages.includes(stage);
}

/** The lower of the route cap and the dial. No repair step means no repair rounds. */
export function effectiveBudget(route: RouteFacts, budget: Budget, method: Method): Caps {
  const dial = method.budgets[budget];
  const helpers = Math.min(route.caps.helpers, dial.helpers);
  return {
    helpers,
    concurrent: helpers === 0 ? 0 : Math.min(route.caps.concurrent, dial.concurrent),
    repairs: route.hasRepair ? Math.min(route.caps.repairs, dial.repairs) : 0,
  };
}

/** True when the stage rule asks for an independent review and the route has a reviewer. */
export function reviewRuns(route: RouteFacts, dials: Dials, method: Method): boolean {
  const rule = method.stages[dials.stage].review;
  const asked = rule === 'required' || (rule === 'budget' && dials.budget !== 'lean');
  return asked && route.hasReview;
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function stageNames(stages: Stage[]): string[] {
  return STAGES.filter((stage) => stages.includes(stage)).map((stage) => STAGE_LABELS[stage]);
}

/** "Refine and Ship only", or null when the route runs at every stage. */
export function availabilityNote(route: Pick<RouteFacts, 'stages'>): string | null {
  return route.stages.length >= STAGES.length ? null : `${joinNames(stageNames(route.stages))} only`;
}

export function availabilitySentence(route: Pick<RouteModel, 'name' | 'stages'>): string {
  const names = stageNames(route.stages);
  return `${route.name} runs at ${joinNames(names)}. Switch the stage to ${names.join(' or ')} to see how it runs with your settings.`;
}

/* ---------- Matrix headers ---------- */

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export type ColumnSummary = { stage: Stage; label: string; routes: string; options: string; review: string };

export function columnSummary(stage: Stage, budget: Budget, model: RoutesModel): ColumnSummary {
  const rule = model.method.stages[stage];
  const count = model.routes.filter((route) => runsAt(route, stage)).length;
  const review =
    rule.review === 'none'
      ? 'No independent review'
      : rule.review === 'budget' && budget === 'lean'
        ? 'No independent review on a lean budget'
        : 'Independent review';
  return {
    stage,
    label: STAGE_LABELS[stage],
    routes: plural(count, 'route'),
    options: plural(rule.variants, 'option'),
    review,
  };
}

/** "7 of 8 routes run at Explore" */
export function stageSummary(stage: Stage, model: RoutesModel): string {
  const count = model.routes.filter((route) => runsAt(route, stage)).length;
  return `${count} of ${model.routes.length} routes ${count === 1 ? 'runs' : 'run'} at ${STAGE_LABELS[stage]}`;
}

/* ---------- Readout sentence ---------- */

export type Segment = string | { id: string; text: string };

const frag = (id: string, text: string): Segment => ({ id, text });

/** Surface wording as segments: only the surface name is highlighted. */
function surfaceSegments(surface: string): Segment[] {
  switch (surface) {
    case 'Paper':
      return ['on ', frag('surface', 'Paper')];
    case 'Code':
      return ['in ', frag('surface', 'code')];
    case 'VariantHub':
      return ['in ', frag('surface', 'VariantHub')];
    case 'Code or Paper':
      return ['in ', frag('surface', 'code'), ' or on ', frag('surface2', 'Paper')];
    default:
      return [];
  }
}

function counted(count: number, one: string, many: string, none: string): string {
  if (count === 0) return none;
  return count === 1 ? `1${NBSP}${one}` : `${count}${NBSP}${many}`;
}

function listOf(items: Segment[]): Segment[] {
  const out: Segment[] = [];
  items.forEach((item, i) => {
    if (i > 0) out.push(i === items.length - 1 ? ' and ' : ', ');
    out.push(item);
  });
  return out;
}

/**
 * The review clause. The highlight sits on the word that decides it: the stage, the budget or the
 * route. The plain words around it say whether the independent review runs.
 */
function reviewSegments(route: RouteFacts, dials: Dials, method: Method): Segment[] {
  const rule = method.stages[dials.stage].review;
  if (reviewRuns(route, dials, method)) {
    return rule === 'required'
      ? ['an independent review because ', frag('review', STAGE_LABELS[dials.stage]), ' requires one']
      : ['an independent review because the budget is ', frag('review', dials.budget)];
  }
  if (rule === 'none') return ['no independent review at ', frag('review', STAGE_LABELS[dials.stage])];
  if (rule === 'budget' && dials.budget === 'lean') return ['no independent review on a ', frag('review', 'lean'), ' budget'];
  return ['no independent review on ', frag('review', `this${NBSP}route`)];
}

/** Checkpoints: the highlight sits on each distinctive checkpoint, the connecting words stay plain. */
function askSegments(route: RouteModel): Segment[] {
  const points: Segment[][] = [['at an open ', frag('involve', `direction${NBSP}decision`)]];
  if (route.userChoice) points.push(['at ', frag('involve2', `option${NBSP}selection`)]);
  if (route.beforeCode) points.push([frag('involve3', `before${NBSP}code`)]);
  return points.flatMap((point, i) => [...(i === 0 ? [] : [i === points.length - 1 ? ' and ' : ', ']), ...point]);
}

/**
 * The readout as segments: plain strings and dial-dependent fragments ({ id, text }).
 * Punctuation follows its fragment with no space, so it never breaks away from it.
 */
export function readoutSegments(route: RouteModel, dials: Dials, model: RoutesModel): Segment[] {
  const method = model.method;
  const options = method.stages[dials.stage].variants;
  const budget = effectiveBudget(route, dials.budget, method);
  const runs = reviewRuns(route, dials, method);
  const surface = surfaceSegments(route.surface);

  const repairs = counted(budget.repairs, 'repair round', 'repair rounds', `no${NBSP}repairs`);
  const solo = runs && dials.budget === 'lean' && budget.helpers === 1;
  const out: Segment[] = [];
  if (route.lead) {
    out.push(route.lead);
    if (surface.length) out.push(' ', ...surface);
  } else {
    out.push('JADO builds ', frag('options', counted(options, 'option', 'options', `no${NBSP}options`)));
    if (surface.length) out.push(' ', ...surface);
  }
  if (solo) {
    out.push(', working ', frag('solo', 'solo'), ' with ', frag('repairs', repairs), ' and keeping its ');
    out.push(frag('helpers', `1${NBSP}helper`), ' for the independent review.');
  } else {
    const items: Segment[] = [frag('helpers', counted(budget.helpers, 'helper', 'helpers', `no${NBSP}helpers`))];
    if (budget.helpers > 0) items.push(frag('atOnce', `${budget.concurrent}${NBSP}at${NBSP}once`));
    items.push(frag('repairs', repairs));
    out.push(' with ', ...listOf(items));
    out.push(runs ? ', plus ' : ', and ', ...reviewSegments(route, dials, method), '.');
  }

  if (dials.involvement === 'autopilot') {
    out.push(' ', frag('involve', `No${NBSP}questions`), ': JADO decides, logs why and you review at delivery.');
  } else if (dials.involvement === 'checkpoints') {
    out.push(' It asks you ', ...askSegments(route), '.');
  } else {
    out.push(' It asks you before ', frag('involve', `every${NBSP}decision`), ' on taste or direction and shows ', frag('involve2', `intermediate${NBSP}results`), '.');
  }
  return out;
}

/** Plain text of a readout, with non-breaking spaces turned into spaces. */
export function segmentsText(segments: Segment[]): string {
  return segments
    .map((segment) => (typeof segment === 'string' ? segment : segment.text))
    .join('')
    .replaceAll(NBSP, ' ');
}

/* ---------- Chain markers ---------- */

export type Marker = { text: string; dot: boolean; ask: boolean; /** Shows you gets a hollow dot. */ hollow?: boolean };

/**
 * One marker slot per chain step.
 * - Checkpoints: "Asks you, if open" on the first step, "Asks you" on a user decision at the end.
 * - Pair: "Asks you" first, then "Shows you" and "Asks you" alternate on the working steps.
 *   The step before a user decision stays quiet because the decision comes next.
 * - Autopilot: "You review" on delivery.
 * - "Independent" marks the review step whenever an independent review runs.
 */
export function chainMarkers(route: RouteModel, dials: Dials, model: RoutesModel): Array<Marker | null> {
  const steps = route.chain;
  const last = steps.length - 1;
  const independent = reviewRuns(route, dials, model.method);
  const markers: Array<Marker | null> = steps.map(() => null);

  if (dials.involvement === 'autopilot') {
    markers[last] = { text: 'You review', dot: true, ask: false };
  } else if (dials.involvement === 'checkpoints') {
    markers[0] = { text: 'Asks you, if open', dot: true, ask: true };
    if (route.userChoice) markers[last] = { text: 'Asks you', dot: true, ask: true };
  } else {
    markers[0] = { text: 'Asks you', dot: true, ask: true };
    let asks = false;
    for (let i = 1; i < last; i += 1) {
      if (steps[i].independent) continue;
      if (route.userChoice && i === last - 1) continue;
      markers[i] = asks ? { text: 'Asks you', dot: true, ask: true } : { text: 'Shows you', dot: true, ask: false, hollow: true };
      asks = !asks;
    }
    if (route.userChoice) markers[last] = { text: 'Asks you', dot: true, ask: true };
  }

  steps.forEach((step, i) => {
    if (step.independent && independent) markers[i] = { text: 'Independent', dot: false, ask: false };
  });
  return markers;
}
