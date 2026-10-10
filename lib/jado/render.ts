import { assignedAgent, type Catalog, type Agent, type GraphDocument, type Workflow } from './schema.ts';

// Template wording of the generated playbook pages.
const t = {
    sections: { router: 'Routing', workflow: 'Operational workflows', governance: 'Setup and governance' },
    only: (stages: string[]) => `${stages.join('/')} only`,
    onlyIn: (stages: string[]) => ` (${stages.join(', ')} only)`,
    route: (id: string) => `Route ${id}`,
    roleAssignment: 'Role assignment and usage',
    skillInstructions: 'Skill instructions',
    reference: 'Reference',
    nextStep: 'Next step',
    continueWith: (label?: string) => `Continue with «${label}».`,
    goTo: (label?: string) => `«${label}».`,
    ends: 'The route ends here.',
    surfaces: { code: 'code', paper: 'Paper', varianthub: 'VariantHub', any: 'as specified in the assignment' },
    anyStage: 'any (the route does not depend on design maturity)',
    generated: '<!-- Generated from jado/workflows.json. Do not edit. -->',
    howTo: 'How to use this route',
    stagesLine: (stages: string, surface: string, rules: string) => `Stages: ${stages}. Work surface: ${surface}. Involvement and budget come from the run's dials ([shared rules](${rules})).`,
    map: 'Map',
    mapIntro: 'Read from top to bottom. Labeled arrows show conditions; dashed arrows exist only in the stages they name; loops represent repairs within the budget. Instructions for each node appear below.',
    inputOutcome: 'Input and outcome',
    input: 'Input',
    outcome: 'Outcome',
    limits: 'Work limits',
    cap: (b: Workflow['budget'], rules: string) => `Route cap: ${b.newDelegations ? `at most ${b.newDelegations} new delegations, with ${b.concurrent} ${b.concurrent === 1 ? 'agent' : 'agents'} in parallel` : 'no new delegations'}; ${b.repairBatches ? `at most ${b.repairBatches} repair ${b.repairBatches === 1 ? 'batch' : 'batches'}` : 'no additional repair batch'}. The effective budget is the lower of this cap and the budget dial; the stage sets the fix passes per artifact. [Shared rules](${rules}).`,
    steps: 'Step instructions',
    method: 'Method and sources',
    id: 'ID',
} as const;

export const workflowSections = [
  { kind: 'router', title: t.sections.router },
  { kind: 'workflow', title: t.sections.workflow },
  { kind: 'governance', title: t.sections.governance },
] as const;

const esc = (value: string) => value.replace(/[&<>"|{}]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '|': '&#124;', '{': '&#123;', '}': '&#125;' })[c]!).replaceAll('\n', '<br/>');
export function mermaid(workflow: Workflow) {
  const lines = ['flowchart TD'];
  for (const n of workflow.nodes) {
    // Prefix IDs to avoid reserved Mermaid words; human labels stay independent of references.
    const label = JSON.stringify(esc(n.label));
    const shape = ['decision', 'gate'].includes(n.kind) ? `{${label}}` : ['start', 'end'].includes(n.kind) ? `([${label}])` : `[${label}]`;
    lines.push(`  n_${n.id}${shape}`);
  }
  for (const e of workflow.edges) {
    const label = [e.label, e.stages ? t.only(e.stages) : ''].filter(Boolean).join(' · ');
    lines.push(`  n_${e.from} ${e.stages ? '-.->' : '-->'}${label ? `|"${esc(label)}"|` : ''} n_${e.to}`);
  }
  return lines.join('\n');
}
/** Renders one generated playbook page. */
export function workflowPage(workflow: Workflow, catalog: Catalog) {
  const docs = '/docs';
  const fields = { title: workflow.title, description: workflow.summary, status: workflow.status, lastReviewed: workflow.lastReviewed, workflow: workflow.kind === 'workflow', stage: workflow.stage, inputs: workflow.inputs, outputs: workflow.outputs, agents: [...new Set(workflow.nodes.map(n => assignedAgent(n,catalog)?.id).filter(Boolean))], skills: [...new Set(workflow.nodes.filter(n => n.kind === 'skill').map(n => n.ref))] };
  const names = new Map(workflow.nodes.map(n => [n.id, n.label]));
  // Saved vertical order defines prose presentation; IDs remain stable across wording changes.
  const steps = [...workflow.nodes].sort((a,b) => a.position.y - b.position.y || a.position.x - b.position.x).map(n => {
    const ref = n.kind === 'subflow' ? `[${t.route(n.ref!)}](${docs}/jado/${n.ref!.toLowerCase()})` : n.ref ? ['agent','skill'].includes(n.kind) ? `[${n.kind === 'agent' ? t.roleAssignment : t.skillInstructions} \`${n.ref}\`](${docs}/automation/${n.kind === 'agent' ? 'agents' : 'skills'}/${n.ref})` : `${t.reference}: \`${n.ref}\`.` : '';
    const outgoing = workflow.edges.filter(e => e.from === n.id);
    const next = outgoing.length === 1 && !outgoing[0].label && !outgoing[0].stages ? t.continueWith(names.get(outgoing[0].to)) : outgoing.map(e => `- ${e.label || t.nextStep}${e.stages ? t.onlyIn(e.stages) : ''} → ${t.goTo(names.get(e.to))}`).join('\n');
    return `### ${n.label}\n\n${n.detail || n.label}\n\n${ref ? ref+` ${t.id}: ` : `${t.id}: `}\`${n.id}\`.\n\n${next || t.ends}`;
  }).join('\n\n');
  const surface = t.surfaces[workflow.surface];
  const stageText = workflow.stages ? workflow.stages.join(', ') : t.anyStage;
  const rules = `${docs}/jado/execution`;
  return `---\n${Object.entries(fields).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${t.generated}\n\n## ${t.howTo}\n\n${workflow.notes}\n\n${t.stagesLine(stageText, surface, rules)}\n\n## ${t.map}\n\n${t.mapIntro}\n\n\`\`\`mermaid\n${mermaid(workflow)}\n\`\`\`\n\n## ${t.inputOutcome}\n\n- ${t.input}: ${workflow.inputs.join('; ')}.\n- ${t.outcome}: ${workflow.outputs.map(value => value.replace(/\.$/, '')).join('; ')}.\n\n## ${t.limits}\n\n${t.cap(workflow.budget, rules)}\n\n## ${t.steps}\n\n${steps}\n\n[${t.method}](${docs}/jado)\n`;
}

export function workflowIndex(document: GraphDocument) {
  const diagrams = workflowSections.map(section => {
    const workflows = document.workflows.filter(workflow => workflow.kind === section.kind);
    if (!workflows.length) return '';
    return `## ${section.title}\n\n${workflows.map(workflow => `### ${workflow.id} — ${workflow.title}\n\n${workflow.summary}\n\n[Source page](../content/docs/jado/${workflow.id.toLowerCase()}.md) · [Playbook page](/docs/jado/${workflow.id.toLowerCase()})\n\n\`\`\`mermaid\n${mermaid(workflow)}\n\`\`\``).join('\n\n')}`;
  }).filter(Boolean).join('\n\n');
  return `# JADO workflow diagrams\n\n<!-- Generated from jado/workflows.json. Do not edit. -->\n\nRead-only diagrams from the canonical graph. Operational workflows define activities and delivery checks; dashed arrows exist only in the stages they name. Follow the linked playbook page for conditions, permissions and completion checks. Edit the source graph on a branch, regenerate, verify and review the diff in a pull request.\n\n${diagrams}\n`;
}

export type Procedure = Omit<Agent, 'model' | 'reasoning' | 'sandbox' | 'skills'> & { instructions: string; writeScope: string; uses: { skill: string; when: string }[] };
export function resolveAgents(source: { entries: Pick<Agent, 'id' | 'name' | 'model' | 'reasoning' | 'claude' | 'sandbox' | 'procedure' | 'roles'>[]; procedures: Procedure[] }) {
  return source.entries.map(binding => {
    const procedure = source.procedures.find(p => p.procedure === binding.procedure);
    if (!procedure) throw new Error(`Missing profile procedure: ${binding.id}`);
    return { ...procedure, skills: procedure.uses.map(u => u.skill), ...binding };
  });
}

export function agentPrompt(agent: Agent & { instructions?: string; writeScope?: string }, root?: string) {
  const source = root ?? 'the JADO root supplied in jadoRoot';
  return `You are ${agent.id}: ${agent.name}.

The primary agent assigns you work from a selected JADO route through a contract: route, stage, involvement, budget and their resolved limits (variant count, fidelity, maxFixPasses, review, evidence level), goal, scope, decisions and checks. Method source: ${source}. Read the procedure the contract names (default ${agent.procedure}); it lists its conditional skills with paths relative to the JADO root. Consult the graph or the catalog only when a required capability is missing.

${agent.instructions ?? agent.description}
${agent.roles?.length ? `\nActivities you can run in this context: ${agent.roles.join(', ')}. Run only those the contract assigns.\n` : ''}
Write scope: ${agent.writeScope ?? 'Assigned artifact.'}

Work at the contract's stage. A fix pass is one batch of edits, one fresh capture and one check; at maxFixPasses, deliver with the remaining issues listed. The primary agent owns every user question: for a choice that belongs to the user, continue on your recommended default when it is reversible, mark it provisional and add it to questions; pause the dependent work only for irreversible or out-of-scope choices. Delegation and scope expansion need an explicit assignment.${agent.sandbox === 'read-only' ? ' Stay read-only: product files, Paper, Figma and every other canvas stay unchanged, even when a tool would allow edits.' : ''}

Commits, pushes, deployment, global configuration, credentials and method changes are outside this assignment. Return the handoff defined in .agents/skills/jado-evidence-contract/SKILL.md, reporting only what you actually did and observed.
`;
}

export function profile(agent: Agent & { instructions?: string; writeScope?: string }, root?: string) {
  return `# Generated from jado/agents.json.
name = ${JSON.stringify(agent.id)}
description = ${JSON.stringify(agent.description)}
model = ${JSON.stringify(agent.model)}
model_reasoning_effort = ${JSON.stringify(agent.reasoning)}
sandbox_mode = ${JSON.stringify(agent.sandbox)}
developer_instructions = ${JSON.stringify(agentPrompt(agent, root))}
`;
}

export function runInstructions(_document: GraphDocument) {
  return `---
name: jado-run
description: Start JADO design work — research, UX, visuals, content, design systems, UI implementation or review — tuned by stage, involvement and budget dials.
---

# Start a JADO assignment

1. Locate the method. Use the JADO directory supplied by the user or contract; in the JADO repository, use the current directory. Read jado/runtime/index.json for the revision, policy and routes. If the root is missing, ask for it before claiming to run the method.
2. For questions about JADO skills, agents, workflows or next steps, read .agents/skills/ask-jado/SKILL.md and return guidance without executing.
3. For work, read .agents/skills/jado-flow/SKILL.md. It resolves the three dials (stage, involvement, budget), selects the route, records the contract, coordinates roles and checks delivery. Resume an assigned route from its checkpoint instead of re-routing.
4. Method changes are separate from product work: edit canonical sources in the JADO source checkout on a dedicated branch, run npm run jado:compile, npm run check and npm run build, and open a pull request. Merge only with authorization. An installed .jado copy keeps its revision until an explicit install or update.
`;
}
