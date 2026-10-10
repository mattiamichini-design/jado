import { createHash } from 'node:crypto';
import { assignedAgent, type Catalog, type GraphDocument, type Guard } from './schema.ts';

// Same canonical graph and guards as the generated diagrams; coordinates and the full catalog are not runtime input.
export function runtimeArtifacts(document: GraphDocument, catalog: Catalog, guards: Record<string, Guard>, method: unknown) {
  const flows = document.workflows.map(w => ({...w, nodes:w.nodes.map(({position: _position, ...n}) => n)}));
  const methodRevision = createHash('sha256').update(JSON.stringify({flows, guards, method, agents:catalog.agents})).digest('hex');
  const output = new Map<string,string>();
  const file = (id: string) => `jado/runtime/${id}.json`;
  const index = {schemaVersion:1, methodRevision, policy:method, routes:flows.map(w => ({id:w.id, summary:w.summary, ...(w.stages ? {stages:w.stages} : {}), packet:file(w.id)}))};
  output.set('jado/runtime/index.json',JSON.stringify(index,null,2)+'\n');
  for (const flow of flows) {
    const refs = flow.nodes.filter(n => n.kind === 'skill').map(n => n.ref);
    const skills = catalog.skills.filter(s => refs.includes(s.id)).map(s => ({id:s.id,path:s.path}));
    const profiles = [...new Set(document.workflows.find(w => w.id === flow.id)!.nodes.map(n => assignedAgent(n,catalog)?.id).filter(Boolean))].map(id => { const a = catalog.agents.find(a => a.id === id)!; return {id:a.id, procedure:a.procedure, sandbox:a.sandbox, roles:a.roles}; });
    output.set(file(flow.id),JSON.stringify({schemaVersion:1,methodRevision,workflow:flow,guards:guards[flow.id] ?? null,skills,profiles,subflows:flow.nodes.filter(n => n.kind === 'subflow').map(n => ({node:n.id,packet:file(n.ref!)}))},null,2)+'\n');
  }
  return output;
}
