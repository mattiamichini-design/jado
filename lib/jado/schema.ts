import { z } from 'zod';

const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,100}$/);
const text = z.string().trim().min(1).max(4000);
export const nodeKinds = ['start', 'decision', 'agent', 'skill', 'tool', 'action', 'gate', 'human', 'subflow', 'end'] as const;
export const stages = ['explore', 'refine', 'ship'] as const;
export type Stage = typeof stages[number];
const stageList = z.array(z.enum(stages)).min(1).refine((v) => new Set(v).size === v.length, 'Duplicate stage.');
export const nodeSchema = z.object({
  id, kind: z.enum(nodeKinds), label: text, detail: text.optional(), ref: id.optional(),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
}).strict();
export const workflowSchema = z.object({
  id, title: text, summary: text, notes: z.string().max(12000),
  kind: z.enum(['router', 'architecture', 'workflow', 'governance', 'subflow']),
  surface: z.enum(['code', 'paper', 'varianthub', 'any']),
  // Absent stages mean the route does not depend on design maturity (for example setup).
  stages: stageList.optional(),
  status: z.enum(['proposed', 'observed']), lastReviewed: z.iso.date(), stage: text,
  inputs: z.array(text).min(1), outputs: z.array(text).min(1),
  budget: z.object({ newDelegations: z.number().int().min(0).max(20), concurrent: z.number().int().min(0).max(4), repairBatches: z.number().int().min(0).max(3) }).strict(),
  entry: id, requiredNodes: z.array(id), nodes: z.array(nodeSchema).min(1).max(200),
  // An edge with stages is traversable only in those stages; edges without stages are always available.
  edges: z.array(z.object({ id, from: id, to: id, label: z.string().max(500), stages: stageList.optional() }).strict()).max(500),
}).strict();
export const documentSchema = z.object({ schemaVersion: z.literal(1), name: z.literal('JADO'), version: text, workflows: z.array(workflowSchema).min(1).max(100) }).strict();
export type NodeKind = typeof nodeKinds[number];
export type GraphNode = z.infer<typeof nodeSchema>;
export type GraphEdge = z.infer<typeof workflowSchema>['edges'][number];
export type Workflow = z.infer<typeof workflowSchema>;
export type GraphDocument = z.infer<typeof documentSchema>;
export type Agent = { id: string; name: string; description: string; model: string; reasoning: string; claude?: { model: string; effort: string }; sandbox: string; skills: string[]; procedure: string; roles?: string[]; uses?: { skill: string; when: string }[] };
export type Skill = { id: string; name: string; description: string; path: string; source: string; hash: string; design: boolean };
export type Catalog = { agents: Agent[]; skills: Skill[]; tools: { id: string; name: string }[] };
export type Guard = { required: { id: string; kind: NodeKind; readOnly?: boolean; before?: string[]; requiredAt?: Stage[] }[]; completionNodes: string[]; checkpointNodes?: string[]; independentNodes?: string[] };

export function assignedAgent(node: GraphNode, catalog: Catalog) {
  if (node.kind === 'agent') return catalog.agents.find(a => a.id === node.ref);
  if (node.kind === 'skill') return catalog.agents.find(a => a.roles?.includes(node.ref!)) ?? catalog.agents.find(a => a.procedure === `.agents/skills/${node.ref}/SKILL.md`);
}

export const activeIn = (edge: GraphEdge, stage?: Stage) => !stage || !edge.stages || edge.stages.includes(stage);

export function reachable(workflow: Workflow, omit?: string, stage?: Stage) {
  const seen = new Set<string>();
  const queue = [workflow.entry];
  while (queue.length) {
    const next = queue.pop()!;
    if (next === omit || seen.has(next)) continue;
    seen.add(next);
    for (const edge of workflow.edges) if (edge.from === next && activeIn(edge, stage)) queue.push(edge.to);
  }
  return seen;
}

// Stages in which a protected check must not be bypassed: its requiredAt list, else every stage the route supports.
export const guardedStages = (workflow: Workflow, required: Guard['required'][number]): Stage[] => required.requiredAt ?? workflow.stages ?? [...stages];

export function validateWorkflow(workflow: Workflow, catalog: Catalog, document: GraphDocument, guard?: Guard): string[] {
  const shape = workflowSchema.safeParse(workflow);
  if (!shape.success) return shape.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  const errors: string[] = [];
  const nodes = new Map(workflow.nodes.map((n) => [n.id, n]));
  if (nodes.size !== workflow.nodes.length) errors.push('Duplicate node ID.');
  if (new Set(workflow.edges.map((e) => e.id)).size !== workflow.edges.length) errors.push('Duplicate edge ID.');
  if (!nodes.has(workflow.entry)) errors.push('Missing entry node.');
  if (workflow.budget.concurrent > workflow.budget.newDelegations) errors.push('Concurrency exceeds the delegation budget.');
  for (const edge of workflow.edges) {
    if (edge.stages && workflow.stages && edge.stages.some((s) => !workflow.stages!.includes(s))) errors.push(`Edge ${edge.id}: stage outside the route's stages.`);
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) errors.push(`Edge ${edge.id}: missing endpoint.`);
    if (edge.from === edge.to) errors.push(`Edge ${edge.id}: self-loop.`);
    if (nodes.get(edge.from)?.kind === 'end') errors.push(`End node ${edge.from} has an outgoing edge.`);
  }
  const all = reachable(workflow);
  for (const node of workflow.nodes) {
    if (!all.has(node.id)) errors.push(`Node ${node.id} is unreachable from the entry.`);
    const entries = node.kind === 'agent' ? catalog.agents : node.kind === 'skill' ? catalog.skills : node.kind === 'tool' ? catalog.tools : node.kind === 'subflow' ? document.workflows : null;
    if (entries && !entries.some((e) => e.id === node.ref)) errors.push(`${node.id}: unknown ${node.kind} reference.`);
    if (!entries && node.ref) errors.push(`${node.id}: this type does not use references.`);
    const outgoing = workflow.edges.filter((e) => e.from === node.id);
    if (['decision', 'gate'].includes(node.kind) && (outgoing.length < 2 || outgoing.some((e) => !e.label.trim()))) errors.push(`${node.id}: at least two branches with conditions are required.`);
    if (node.kind === 'start' && workflow.edges.some((e) => e.to === node.id)) errors.push(`${node.id}: the entry cannot have incoming edges.`);
    if (node.kind !== 'end' && outgoing.length === 0) errors.push(`${node.id}: a node without outgoing edges must be an end node.`);
  }
  for (const required of workflow.requiredNodes) {
    if (!nodes.has(required)) errors.push(`Required check ${required} is missing.`);
    const bypass = reachable(workflow, required);
    if (guard?.completionNodes.some((id) => bypass.has(id))) errors.push(`Required step ${required} can be bypassed.`);
  }
  // These guards live outside the editable graph: deleting or bypassing a gate cannot weaken its own validation.
  if (guard) {
    for (const id of guard.independentNodes ?? []) if (!nodes.get(id) || !assignedAgent(nodes.get(id)!, catalog)) errors.push(`Protected independent context ${id} is missing or has the wrong type.`);
    for (const required of guard.required) {
      const node = nodes.get(required.id);
      if (!node || node.kind !== required.kind) errors.push(`Protected check ${required.id} is missing or has the wrong type.`);
      if (required.readOnly && (node && assignedAgent(node,catalog))?.sandbox !== 'read-only') errors.push(`${required.id}: review requires a read-only profile.`);
      if (required.requiredAt && workflow.stages && required.requiredAt.some((s) => !workflow.stages!.includes(s))) errors.push(`Check ${required.id}: requiredAt names a stage the route does not support.`);
      for (const end of required.before ?? []) if (nodes.get(end)?.kind !== 'end' || guard.checkpointNodes?.includes(end)) errors.push(`Invalid outcome for check ${required.id}: ${end}.`);
      const completions = workflow.nodes.filter((n) => n.kind === 'end' && !guard.checkpointNodes?.includes(n.id) && (!required.before || required.before.includes(n.id)));
      for (const stage of guardedStages(workflow, required)) {
        const bypass = reachable(workflow, required.id, stage);
        if (completions.some((n) => bypass.has(n.id))) errors.push(`Check ${required.id} can be bypassed before delivery in ${stage}.`);
      }
    }
    for (const completion of guard.completionNodes) if (!nodes.has(completion) || nodes.get(completion)?.kind !== 'end') errors.push(`Protected outcome ${completion} is missing or is not an end node.`);
  }
  return [...new Set(errors)];
}

export function validateDocument(document: GraphDocument, catalog: Catalog, guards: Record<string, Guard> = {}) {
  const shape = documentSchema.safeParse(document);
  if (!shape.success) return shape.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  if (new Set(document.workflows.map((w) => w.id.toLowerCase())).size !== document.workflows.length) return ['Workflow IDs conflict after URL normalization.'];
  const errors = document.workflows.flatMap((w) => validateWorkflow(w, catalog, document, guards[w.id]).map((e) => `${w.id}: ${e}`));
  if (new Set(document.workflows.map((w) => w.id)).size !== document.workflows.length) errors.push('Duplicate workflow ID.');
  const visit = (id: string, path: Set<string>) => {
    if (path.has(id)) { errors.push(`Recursive subflow: ${id}.`); return; }
    const next = new Set(path).add(id);
    for (const n of document.workflows.find((w) => w.id === id)?.nodes ?? []) if (n.kind === 'subflow' && n.ref) visit(n.ref, next);
  };
  for (const w of document.workflows) visit(w.id, new Set());
  return [...new Set(errors)];
}
