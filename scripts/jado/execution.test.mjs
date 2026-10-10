import assert from 'node:assert/strict';
import { readJado } from '../../lib/jado/store.ts';
import { executionPlan } from '../../lib/jado/execution.ts';
import { readFile } from 'node:fs/promises';

const { document, catalog, guards } = await readJado();
const method = JSON.parse(await readFile('jado/policies/method.json'));
const plan = (workflow, mode, options = {}) => executionPlan(document, catalog, guards, workflow, mode, options);
assert.equal(method.executionModes.default, 'macro');
assert.throws(() => plan('R04', 'swarm'), /Unknown mode/);
assert.throws(() => plan('missing', 'solo'), /Unknown workflow/);
assert.throws(() => plan('R05', 'solo', {stage:'ship'}), /does not support/, 'Routes reject stages they do not support');

// Dials: one source of truth with ordered rigor.
const stage = method.dials.stage.values, budget = method.dials.budget.values;
assert.deepEqual(Object.keys(stage), ['explore','refine','ship']);
assert(stage.explore.maxFixPasses < stage.refine.maxFixPasses && stage.refine.maxFixPasses < stage.ship.maxFixPasses, 'Fix caps grow with maturity');
assert.equal(stage.explore.independentReview, 'none');
assert.equal(stage.ship.independentReview, 'required');
assert(stage.explore.variants > stage.refine.variants, 'Exploration produces more options than refinement');
assert.deepEqual(Object.keys(method.dials.involvement.values), ['autopilot','checkpoints','pair']);
assert.equal(budget.lean.mode, 'solo');
assert.equal(budget.lean.newDelegations, 1, 'Lean reserves one delegation for a required review');
for (const key of ['stage','involvement','budget']) assert(method.dials[key].values[method.dials[key].default], `${key} has a valid default`);

for (const workflow of document.workflows) {
  const specialists = plan(workflow.id, 'specialists');
  const macro = plan(workflow.id, 'macro');
  const solo = plan(workflow.id, 'solo');
  assert.deepEqual(macro.assignments.map(a => [a.workflow,a.node,a.activity,a.procedure,a.independent]), specialists.assignments.map(a => [a.workflow,a.node,a.activity,a.procedure,a.independent]), 'Changing executors must preserve activities and review requirements');
  assert(specialists.assignments.every(a => a.executor.startsWith('jado-agent-')));
  assert.equal(new Set(specialists.assignments.map(a => a.context)).size,specialists.assignments.length,'Specialist tasks use separate instances even when profiles match');
  assert(solo.assignments.filter(a => !a.independent).every(a => a.executor === 'primary'), 'Solo authors in the primary context');
  assert(solo.assignments.filter(a => a.independent).every(a => a.executor !== 'primary'), 'Independent reviews never run in the author context');
  for (const a of macro.assignments) {
    const role = catalog.agents.find(r => r.id === a.executor);
    if (role.sandbox === 'read-only') {
      assert(a.independent);
      assert.notEqual(a.context, a.executor, 'Review contexts must not reuse an author context');
    } else {
      const owner = catalog.agents.find(r => r.roles?.includes(a.activity));
      if (owner) assert.equal(a.executor, owner.id);
    }
  }
}
assert.equal(new Set(plan('R08','macro').assignments.map(a => a.context)).size,3,'Council proposals remain independent when two roles share a macro profile');

// Stage shapes the work: exploration on a lean budget needs no delegation and no review.
const profiles = catalog.agents.map(a => a.id), toolIds = catalog.tools.map(t => t.id);
const resolved = (workflow, mode, stageId, branches, extra = {}) => executionPlan(document,catalog,guards,workflow,mode,{stage:stageId,branches,author:'primary',availableProfiles:profiles,availableTools:toolIds,...extra});
const explore = resolved('R05','solo','explore',{'R05/evidence':['evidence-d'],'R05/check':['check-present'],'R05/next':['next-snap'],'R05/snap':['snap-done']},{delegationBudget:budget.lean.newDelegations});
assert.equal(explore.status,'resolved');
assert.equal(explore.delegations,0);
assert(explore.selection[0].excluded.includes('review'),'Explore never reaches the independent review');
assert.throws(()=>resolved('R05','solo','explore',{'R05/check':['check-review']}),/selection/,'The review branch does not exist in explore');
const refine = resolved('R05','macro','refine',{'R05/evidence':['evidence-d'],'R05/check':['check-review'],'R05/review':['review-present'],'R05/next':['next-snap'],'R05/snap':['snap-done']});
assert.equal(refine.status,'resolved');
assert.equal(refine.delegations,1,'Refine with a review uses one reviewer context');
assert.throws(()=>resolved('R04','macro','ship',{'R04/check':['check-parent']}),/selection/,'Ship cannot take the self-check-only branch');
const shipLean = resolved('R04','solo','ship',{'R04/ready':['ready-b'],'R04/risk':['risk-check'],'R04/check':['check-rev'],'R04/rev':['rev-parent'],'R04/gate':['gate-done']},{delegationBudget:budget.lean.newDelegations});
assert.equal(shipLean.status,'resolved','Lean ship spends its reserved delegation on the review');
assert.equal(shipLean.delegations,1);
assert.equal(resolved('R04','solo','ship',{'R04/ready':['ready-b'],'R04/risk':['risk-check'],'R04/check':['check-rev'],'R04/rev':['rev-ux'],'R04/gate':['gate-done']},{delegationBudget:1}).status,'blocked','A second review exceeds the lean budget');

// R07 exits: UX, canvas or code, with stage-dependent reviews.
const uxBranches = {'R07/brief':['brief-decide'],'R07/result':['result-ux_verify'],'R07/ux_gate':['ux_gate-ux_done']};
const ux = resolved('R07','macro','refine',uxBranches);
assert.equal(ux.status,'resolved');
assert.equal(ux.delegations,0);
assert(ux.selection[0].selected.includes('ux_done'));
assert(ux.selection[0].excluded.includes('b') && ux.selection[0].excluded.includes('canvas_review'));
const canvasBranches = {'R07/brief':['brief-decide'],'R07/result':['result-copy_needed'],'R07/copy_needed':['copy_needed-copy'],'R07/canvas_check':['canvas_check-canvas_gate'],'R07/canvas_gate':['canvas_gate-code_scope'],'R07/code_scope':['code_scope-canvas_done']};
const canvas = resolved('R07','macro','explore',canvasBranches);
assert.equal(canvas.status,'resolved');
assert.equal(canvas.delegations,0,'Exploration canvas: primary writes, no reviewer');
assert(canvas.selection[0].selected.includes('canvas_done'));
assert(canvas.procedures.some(p=>p.id==='jado-content-designer'));
const reusedCopy = resolved('R07','macro','explore',{...canvasBranches,'R07/copy_needed':['copy_needed-design']});
assert(reusedCopy.selection[0].excluded.includes('copy'));
assert(!reusedCopy.procedures.some(p=>p.id==='jado-content-designer'),'Approved unchanged copy must not activate writing');
assert.throws(()=>resolved('R07','macro','ship',canvasBranches),/selection/,'Ship canvas cannot skip the independent review');
const shipCanvas = resolved('R07','macro','ship',{...canvasBranches,'R07/canvas_check':['canvas_check-canvas_review']});
assert.equal(shipCanvas.status,'resolved');
assert.equal(shipCanvas.delegations,1);
assert(shipCanvas.assignments.filter(a=>a.independent).every(a=>a.executor!=='primary'));
const undecidedCopy = {...canvasBranches};
delete undecidedCopy['R07/copy_needed'];
assert.equal(resolved('R07','macro','explore',undecidedCopy).status,'candidate','Content routing must be resolved before execution');
assert.equal(resolved('R07','macro','ship',{...canvasBranches,'R07/canvas_check':['canvas_check-canvas_review']},{availableProfiles:[]}).status,'blocked');
assert.equal(resolved('R07','macro','ship',{...canvasBranches,'R07/canvas_check':['canvas_check-canvas_review']},{delegationBudget:0}).status,'blocked');
assert.throws(()=>resolved('R07','macro','refine',{...uxBranches,'R07/not-found':['x']}),/selection/);
const moved = structuredClone(document);
for (const w of moved.workflows) for (const n of w.nodes) n.position.x+=100;
assert.deepEqual(executionPlan(moved,catalog,guards,'R07','macro',{branches:uxBranches}),executionPlan(document,catalog,guards,'R07','macro',{branches:uxBranches}),'Editor geometry has no execution meaning');

// Two actual invocations of the same subflow remain distinct; a repair loop is not a new invocation.
const twice = structuredClone(document);
const router = twice.workflows.find(w=>w.id==='00-router');
router.nodes.push({...router.nodes.find(n=>n.id==='rcouncil'),id:'second'});
router.edges.push({id:'route-second',from:'route',to:'second',label:'Second council'},{id:'second-contract',from:'second',to:'contract',label:''});
const repeated=executionPlan(twice,catalog,guards,'00-router','macro',{branches:{'00-router/intent':['intent-route'],'00-router/route':['route-rcouncil','route-second']}});
assert.equal(repeated.assignments.length,6);
assert.equal(new Set(repeated.assignments.map(a=>a.context)).size,6);
const readonlyCatalog=structuredClone(catalog);
readonlyCatalog.agents.find(a=>a.id==='jado-agent-ux').sandbox='read-only';
assert(!executionPlan(document,readonlyCatalog,guards,'R03','macro').assignments.some(a=>a.independent),'Readonly permissions alone do not imply independence');

// Procedures declare their conditional skills directly; no role packets.
const procedures = JSON.parse(await readFile('jado/agents.json')).procedures;
const uses = (id) => procedures.find(p => p.id === id).uses.map(u => u.skill);
const coverage = catalog.agents.filter(a => a.roles).flatMap(a => a.roles);
assert.equal(new Set(coverage).size,coverage.length,'Each specialist activity has one macro owner');
assert.deepEqual([...coverage].sort(),procedures.filter(p => !p.roles).map(p => p.id).sort());
assert(procedures.every(p => p.uses.length && p.uses.every(u => catalog.skills.some(s => s.id === u.skill) && u.when.trim())), 'Every skill use resolves and has a condition');
assert.deepEqual(['better-writing','copywriting','copy-editing'].filter(id => uses('jado-content-designer').includes(id)),['better-writing','copywriting','copy-editing']);
for (const id of ['fontshare','better-typography','better-colors','oklch-skill']) assert(uses('jado-art-direction').includes(id), `Art direction reaches ${id}`);
assert(/explicitly assigns/.test(procedures.find(p => p.id === 'jado-researcher').uses.find(u => u.skill === 'research').when),'Documentary research never invokes the upstream delegation protocol by default');
assert(/Refine or ship/.test(procedures.find(p => p.id === 'jado-visual-designer').uses.find(u => u.skill === 'jado-canvas-verify').when),'Exploration skips full canvas verification');
assert(!uses('jado-motion').includes('review-animations'),'review-animations stays user-invoked');
assert(uses('jado-ux-architect').includes('mobbin-search') && uses('jado-ux-architect').includes('jado-ux-artifacts'));
assert.equal(catalog.agents.length,5);
assert(catalog.agents.every(a => !catalog.skills.some(s => s.id === a.id)),'Profile and procedure names never collide');
console.log('Dials, stage-dependent reviews, lean solo planning, R07 exits and procedure skill uses verified.');
