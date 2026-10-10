import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readJado} from '../../lib/jado/store.ts';
import {runtimeArtifacts} from '../../lib/jado/runtime.ts';
const {document,catalog,guards}=await readJado();
const method=JSON.parse(await readFile('jado/policies/method.json'));
const packets=runtimeArtifacts(document,catalog,guards,method);
const index=JSON.parse(packets.get('jado/runtime/index.json'));
assert.deepEqual(index.policy.dials,method.dials,'Executors read the dials from the index');
assert.equal(index.routes.length,document.workflows.length);
assert.equal(packets.size,document.workflows.length+1,'One index and one packet per route; no role packets');
for (const workflow of document.workflows) {
  const packet=JSON.parse(packets.get(`jado/runtime/${workflow.id}.json`));
  assert.deepEqual(packet.workflow.edges,workflow.edges,'Branch and stage conditions survive compilation');
  assert.deepEqual(packet.guards,guards[workflow.id]??null,'All protected gates survive compilation');
  assert(packet.workflow.nodes.every(n=>!('position' in n)));
  for(const ref of packet.subflows) assert(packets.has(ref.packet));
  for(const s of packet.skills) assert.equal(s.path,catalog.skills.find(c=>c.id===s.id).path);
}
const moved=structuredClone(document);
moved.workflows[0].nodes[0].position.x+=120;
assert.deepEqual([...runtimeArtifacts(moved,catalog,guards,method)],[...packets],'Layout-only edits do not invalidate semantic runtime packets');
const changed=structuredClone(guards);changed.R01.required=[];
assert.notEqual(JSON.parse(runtimeArtifacts(document,catalog,changed,method).get('jado/runtime/index.json')).methodRevision,index.methodRevision);
const changedPolicy=structuredClone(method);changedPolicy.dials.stage.values.explore.maxFixPasses=2;
assert.notEqual(JSON.parse(runtimeArtifacts(document,catalog,guards,changedPolicy).get('jado/runtime/index.json')).methodRevision,index.methodRevision,'Dial changes produce a new method revision');
const patch=Buffer.byteLength(packets.get('jado/runtime/index.json')+packets.get('jado/runtime/R01.json'));
assert(patch<Buffer.byteLength(JSON.stringify(document))/2,'A patch loads a small fraction of the method');
console.log('Runtime packets preserve conditions, stage edges, guards, dials and skill paths without layout coordinates.');
