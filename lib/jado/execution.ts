import { z } from 'zod';
import { activeIn, assignedAgent, guardedStages, reachable, stages, type Catalog, type GraphDocument, type Guard, type Stage } from './schema.ts';

export const executionModes = ['solo', 'macro', 'specialists'] as const;
export type ExecutionMode = typeof executionModes[number];
const optionsSchema = z.object({
  branches:z.record(z.string(),z.array(z.string()).min(1)).optional(),
  author:z.enum(['primary','profiles']).optional(),
  availableProfiles:z.array(z.string()).optional(),
  availableTools:z.array(z.string()).optional(),
  delegationBudget:z.number().int().min(0).optional(),
  stage:z.enum(stages).optional(),
}).strict();
export type PlanOptions = z.infer<typeof optionsSchema>;

export function executionPlan(document: GraphDocument, catalog: Catalog, guards: Record<string, Guard>, workflowId: string, mode: string, options: PlanOptions = {}) {
  options = optionsSchema.parse(options);
  if (!executionModes.includes(mode as ExecutionMode)) throw new Error(`Unknown mode: ${mode}. Use solo, macro or specialists.`);
  const workflow = document.workflows.find(w => w.id === workflowId);
  if (!workflow) throw new Error(`Unknown workflow: ${workflowId}`);
  if (options.stage && workflow.stages && !workflow.stages.includes(options.stage)) throw new Error(`Route ${workflowId} does not support the ${options.stage} stage.`);
  // Without an explicit stage, plan for the strictest stage the route supports so no required check is hidden.
  const stage: Stage = options.stage ?? (workflow.stages ? workflow.stages[workflow.stages.length - 1] : 'ship');
  if (options.author && !['primary','profiles'].includes(options.author)) throw new Error('Invalid author.');
  if (options.delegationBudget !== undefined && (!Number.isInteger(options.delegationBudget) || options.delegationBudget < 0 || options.delegationBudget > workflow.budget.newDelegations)) throw new Error('Invalid budget or budget exceeds the route limit.');
  const requirements = new Set<string>(), usedBranches = new Set<string>(), unresolved = new Set<string>(), tools = new Set<string>();
  const selection: {invocation:string; selected:string[]; excluded:string[]}[] = [];
  const procedures = new Map<string,string>();
  const assignments: { workflow:string; invocation:string; node:string; activity:string; profile:string; executor:string; procedure:string; independent:boolean; independentFrom:string; context:string }[] = [];
  const visit = (id: string, invocation: string, parents: string[]) => {
    if (parents.includes(id)) throw new Error(`Recursive subflow: ${id}`);
    const flow = document.workflows.find(w => w.id === id);
    if (!flow) throw new Error(`Unknown subflow: ${id}`);
    const seen = new Set<string>(), queue = [flow.entry];
    const edges: typeof flow.edges = [];
    while (queue.length) {
      const nodeId = queue.shift()!;
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      const outgoing = flow.edges.filter(e => e.from === nodeId && activeIn(e, stage));
      const key = `${invocation}/${nodeId}`, choice = options.branches?.[key];
      let selected = outgoing;
      if (choice !== undefined) {
        usedBranches.add(key);
        if (!Array.isArray(choice) || !choice.length || new Set(choice).size !== choice.length || choice.some(e => !outgoing.some(x => x.id === e)) || !outgoing.some(e => e.label)) throw new Error(`Invalid branch selection: ${key}`);
        // Unlabelled fan-out is mandatory parallel work, not a selectable alternative.
        if (outgoing.some(e => !e.label && !choice.includes(e.id))) throw new Error(`Required branch excluded: ${key}`);
        selected = outgoing.filter(e => choice.includes(e.id));
      } else if (outgoing.length > 1 && outgoing.some(e => e.label)) unresolved.add(key);
      edges.push(...selected); queue.push(...selected.map(e => e.to));
    }
    const selectedFlow = {...flow,edges};
    for (const required of (guards[id]?.required ?? []).filter(r => guardedStages(flow,r).includes(stage))) {
      const ends = flow.nodes.filter(n => seen.has(n.id) && n.kind === 'end' && !guards[id]?.checkpointNodes?.includes(n.id) && (!required.before || required.before.includes(n.id)));
      if (ends.some(n => reachable(selectedFlow,required.id).has(n.id))) requirements.add(`${invocation}: required check ${required.id} bypassed.`);
    }
    selection.push({invocation,selected:[...seen],excluded:flow.nodes.filter(n => !seen.has(n.id)).map(n => n.id)});
    for (const node of flow.nodes.filter(n => seen.has(n.id))) {
      if (node.kind === 'subflow' && node.ref) visit(node.ref,`${invocation}/${node.id}:${node.ref}`,[...parents,id]);
      if (node.kind === 'tool') tools.add(node.ref!);
      const skill = node.kind === 'skill' ? catalog.skills.find(s => s.id === node.ref) : undefined;
      if (skill) procedures.set(skill.id,skill.path);
      if (!['agent','skill'].includes(node.kind)) continue;
      const role = assignedAgent(node,catalog);
      if (!role) { if (node.kind === 'agent') throw new Error(`Unknown agent: ${node.ref}`); continue; }
      const independent = !!guards[id]?.independentNodes?.includes(node.id);
      // Solo keeps authoring in the primary context; independent reviews still need their own read-only context.
      const executor = !independent && (mode === 'solo' || options.author === 'primary') ? 'primary' : role.id;
      const procedure = skill?.path ?? role.procedure;
      const context = executor === 'primary' ? 'primary' : mode === 'specialists' || independent && role.sandbox !== 'read-only' ? `${invocation}/${node.id}/separate` : independent ? `${executor}/review` : executor;
      assignments.push({workflow:id,invocation,node:node.id,activity:node.ref!,profile:role.id,executor,procedure,independent,independentFrom:independent?'artifact-author':'',context});
    }
  };
  visit(workflowId,workflowId,[]);
  for (const key of Object.keys(options.branches ?? {})) if (!usedBranches.has(key)) throw new Error(`Unknown or unreachable selection: ${key}`);
  const delegations = new Set(assignments.filter(a => a.executor !== 'primary').map(a => a.context)).size;
  if (delegations > (options.delegationBudget ?? workflow.budget.newDelegations)) requirements.add('The instance count exceeds the delegation budget; narrow the scope or assign compatible activities to the primary agent.');
  for (const profile of new Set(assignments.filter(a => a.executor !== 'primary').map(a => a.executor))) if (options.availableProfiles && !options.availableProfiles.includes(profile)) requirements.add(`Profile unavailable: ${profile}`);
  for (const tool of tools) if (options.availableTools && !options.availableTools.includes(tool)) requirements.add(`Tool unavailable: ${tool}`);
  const candidate = unresolved.size > 0 || !options.availableProfiles || !options.availableTools;
  return {mode:mode as ExecutionMode,stage,status:candidate?'candidate':requirements.size?'blocked':'resolved',assignments,procedures:[...procedures].map(([id,path])=>({id,path})),selection,unresolved:[...unresolved],requirements:[...requirements],delegations,capabilitiesChecked:!!options.availableProfiles && !!options.availableTools,note:'This plan records coordinator-declared branches, not execution or passed gates. Verify their conditions on the product. Read conditional dependencies in each selected procedure packet and check tools and additional delegation requirements before using them.'};
}
