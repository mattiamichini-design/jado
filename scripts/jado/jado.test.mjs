import assert from 'node:assert/strict';
import { readFile, writeFile, cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { documentSchema, validateDocument } from '../../lib/jado/schema.ts';
import { readJado } from '../../lib/jado/store.ts';
import { mermaid, workflowIndex, workflowPage } from '../../lib/jado/render.ts';
import { mayCopy, inventory, importLocal } from './import-local.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const current = await readJado();
assert.deepEqual(validateDocument(current.document,current.catalog,current.guards),[]);
assert.equal(current.catalog.agents.length,5);
const selection = JSON.parse(await readFile('registry/catalog-selection.json','utf8'));
assert.deepEqual(current.catalog.skills.filter(s => s.design).map(s => s.id).sort(), [...selection.skills].sort(), 'Design discovery follows the current selection, not stale imported flags');
assert(!current.catalog.skills.some(s => ['ask-design','ui-flow'].includes(s.name)), 'Retired routing must not be discoverable in the current runtime');
for (const id of ['ask-jado','jado-flow','jado-run']) assert(current.catalog.skills.some(s => s.id === id && s.path === `.agents/skills/${id}/SKILL.md`), 'Current routing resolves to repo-owned procedures');
assert.equal(current.document.workflows.find(w => w.id === '00-router').nodes.find(n => n.id === 'ask').ref,'ask-jado');
assert(current.catalog.agents.every((a)=>a.id.startsWith('jado-agent-')&&a.model==='gpt-6.1-sol'));
assert.equal(current.catalog.agents.filter((a)=>a.sandbox==='read-only').length,2);
const change = (id, mutate) => {
 const document = structuredClone(current.document);
 mutate(document.workflows.find((w)=>w.id===id));
 return validateDocument(document,current.catalog,current.guards);
};
assert(change('R08',w=>{w.nodes.find(n=>n.id==='r').kind='action';delete w.nodes.find(n=>n.id==='r').ref;}).some(e=>e.includes('Protected independent')));
assert(change('R04',(w)=>{w.nodes.find((n)=>n.id==='b').ref='missing-agent';}).some((e)=>e.includes('unknown')));
assert(change('R04',(w)=>{w.edges.push({id:'bypass',from:w.entry,to:'done',label:''});}).some((e)=>e.includes('bypass')));
assert(change('R04',(w)=>{w.requiredNodes=[];w.nodes=w.nodes.filter((n)=>n.id!=='rev');w.edges=w.edges.filter((e)=>e.from!=='rev'&&e.to!=='rev');}).some((e)=>e.includes('Protected check rev')));
assert(change('R04',(w)=>{w.nodes.find((n)=>n.id==='rev').ref='jado-ui-builder';}).some((e)=>e.includes('read-only')));
assert(change('R04',(w)=>{w.nodes.push({id:'new-end',kind:'end',label:'Alternative delivery',position:{x:0,y:0}});w.edges.push({id:'bypass-new-end',from:w.entry,to:'new-end',label:''});}).some((e)=>e.includes('bypass')));
assert(change('setup-project',(w)=>{w.edges.push({id:'bypass-review',from:'files',to:'apply',label:''});}).some((e)=>e.includes('review')&&e.includes('bypass')), 'Project setup cannot bypass instruction review');
assert(change('R01',(w)=>{w.nodes.find((n)=>n.id==='paper').ref='missing-skill';}).some((e)=>e.includes('unknown')));
// Stage guards: ship keeps the independent review; refine may skip it only through a refine-only edge.
assert.deepEqual(change('R04',(w)=>{w.edges.push({id:'refine-skip',from:'proof',to:'parent',label:'Refine shortcut',stages:['refine']});}),[],'A refine-only shortcut is allowed when the review is required only in ship');
assert(change('R04',(w)=>{w.edges.push({id:'ship-skip',from:'proof',to:'parent',label:'Shortcut'});}).some((e)=>e.includes('bypassed before delivery in ship')),'An unconditioned shortcut bypasses the ship review');
assert(change('R04',(w)=>{w.edges.find((e)=>e.id==='check-parent').stages=['refine','ship'];}).some((e)=>e.includes('in ship')),'The self-check branch cannot extend to ship');
assert(change('R05',(w)=>{w.edges.push({id:'bad-stage',from:'p',to:'d',label:'Ship',stages:['ship']});}).some((e)=>e.includes('stage outside')),'Edge stages stay within the route stages');
assert(change('R07',(w)=>{w.edges.find((e)=>e.id==='canvas_check-canvas_gate').stages=undefined;}).some((e)=>e.includes('canvas_review')&&e.includes('ship')),'Canvas review stays mandatory in ship');
assert(change('R01',(w)=>{w.edges.find((e)=>e.from==='gate').label='';}).some((e)=>e.includes('branches')));
assert(change('R04',(w)=>{w.nodes.push({id:'recursion',kind:'subflow',ref:w.id,label:'Recursion',position:{x:0,y:0}});w.edges.push({id:'recursive-edge',from:w.entry,to:'recursion',label:''});w.edges.push({id:'recursive-out',from:'recursion',to:'done',label:''});}).some((e)=>e.includes('Recursive')));
assert(!documentSchema.safeParse({...current.document,workflows:[{...current.document.workflows[0],id:'../escape'}]}).success);
for(const file of ['.env','.env.local','auth.json','credentials.toml','key.pem','node_modules/a.js','cache/.git/index'])assert.equal(mayCopy(file),false);
assert.equal(mayCopy('example/scripts/run.mjs'),true);

const fixture=await mkdtemp(path.join(tmpdir(),'jado-regression-'));
try{
 for(const dir of ['jado','registry','.agents/skills'])await cp(dir,path.join(fixture,dir),{recursive:true,filter:(file)=>!file.includes('/.local')&&!file.endsWith('.write.lock')&&!file.includes('/sources')&&!file.includes('/legacy')});
 const invalid=structuredClone(current.document.workflows.find(w=>w.id==='R04'));
 invalid.nodes.find(n=>n.id==='b').ref='missing';

 const source=path.join(fixture,'import-source');const destination=path.join(fixture,'import-destination');
 await mkdir(path.join(source,'demo/scripts'),{recursive:true});await mkdir(path.join(destination,'registry'),{recursive:true});
 await writeFile(path.join(source,'demo/SKILL.md'),'---\nname: demo\ndescription: Example skill\n---\n');
 await writeFile(path.join(source,'demo/scripts/run.mjs'),'export const example = true;\n');
 await writeFile(path.join(source,'demo/.env'),'sample=excluded\n');
 await writeFile(path.join(fixture,'lock.json'),JSON.stringify({version:3,skills:{demo:{sourceType:'github',source:'original/demo',skillPath:'skills/demo/SKILL.md'}}}));
 await writeFile(path.join(destination,'registry/catalog-selection.json'),'{"skills":["demo"]}');
 const imported=await importLocal(source,path.join(fixture,'lock.json'),destination);
 assert.equal(imported.length,1);
 assert.equal(imported[0].sourceRecord.source,'original/demo');
 await assert.rejects(()=>readFile(path.join(destination,'skills/demo/SKILL.md')),/ENOENT/,'Reference import must not vendor upstream bytes');
 assert.equal(await readFile(path.join(source,'demo/.env'),'utf8'),'sample=excluded\n','Originals remain intact');
 await symlink(path.join(source,'demo/SKILL.md'),path.join(source,'demo/link'));
 await assert.rejects(()=>inventory(source,{skills:{}},[]),/symlink/);

 const transport=new StdioClientTransport({command:process.execPath,args:[path.resolve('scripts/jado/mcp.mjs'),'--root',fixture],stderr:'pipe'});
 const client=new Client({name:'jado-regression',version:'1.0.0'});
 try{
  await client.connect(transport);
  assert.deepEqual((await client.listTools()).tools.map((t)=>t.name).sort(),['get_catalog','get_workflows','validate_workflow']);
  const workflows=await client.callTool({name:'get_workflows',arguments:{id:'R04'}});
  const state=JSON.parse(workflows.content[0].text);
  assert.equal(state.workflows[0].id,'R04');
  const result=await client.callTool({name:'validate_workflow',arguments:{workflow:invalid}});
  assert(JSON.parse(result.content[0].text).errors.length>0);

 }finally{await client.close();}
}finally{await rm(fixture,{recursive:true,force:true});}
console.log('JADO regressions passed: references, gate bypass, readonly review, recursion, import integrity, read-only MCP and generated Mermaid diagrams.');

assert(change('R07',w=>{w.edges.push({id:'bypass-canvas',from:'design',to:'canvas_done',label:'bypass'});}).some(e=>e.includes('bypass')),'Canvas-only delivery keeps its gate');
assert(change('R07',w=>{w.edges.push({id:'bypass-ux',from:'result',to:'ux_done',label:'bypass'});}).some(e=>e.includes('bypass')),'UX-only delivery keeps its verification gate');

const index = await readFile('jado/README.md','utf8');
assert.equal(index, workflowIndex(current.document), 'The Mermaid index follows the canonical graph');
for (const workflow of current.document.workflows) {
 const page = workflowPage(workflow, current.catalog);
 for (const heading of ['How to use this route', 'Map', 'Input and outcome', 'Work limits', 'Step instructions']) assert(page.includes(`## ${heading}`), `${workflow.id}: English workflow heading ${heading}`);
 assert(index.includes(mermaid(workflow)), `${workflow.id}: index contains the generated diagram`);
 assert(index.includes(`/docs/jado/${workflow.id.toLowerCase()}`), `${workflow.id}: index links to the playbook`);
}

const navigation = JSON.parse(await readFile('content/docs/jado/meta.json', 'utf8')).pages;
const sectionPages = (title) => {
 const start = navigation.indexOf(`---${title}---`);
 assert(start >= 0, `Missing navigation section: ${title}`);
 const end = navigation.findIndex((page, i) => i > start && page.startsWith('---'));
 return navigation.slice(start + 1, end < 0 ? undefined : end);
};
assert.deepEqual(sectionPages('Operational workflows'), ['r01', 'r03', 'r04', 'r05', 'r07', 'r08', 'r09', 'visual-research']);
for (const workflow of current.document.workflows) {
 assert.equal(navigation.filter(page => page === workflow.id.toLowerCase()).length, 1, `${workflow.id}: navigation includes each map exactly once`);
}
assert(!navigation.some(page => page.startsWith('role-') || ['a-solo','b-adaptive','c-council','r02','r06','z-governance'].includes(page)), 'Retired routes leave the navigation');
assert(current.document.workflows.length <= 12, 'The graph stays small enough to read');

// Entry skills stay model-invoked; internal procedures load by path, so their descriptions stay out of every session.
const hidden = async (id) => /^disable-model-invocation: true$/m.test((await readFile(`.agents/skills/${id}/SKILL.md`,'utf8')).split('\n---')[0]);
for (const id of ['jado-run','ask-jado','jado-install']) assert(!(await hidden(id)), `${id} remains an entry point`);
const procedureIds = JSON.parse(await readFile('jado/agents.json','utf8')).procedures.map(p => p.id);
for (const id of ['jado-flow','jado-evidence-contract','jado-canvas-verify',...procedureIds]) assert(await hidden(id), `${id} is reached by path, not by implicit invocation`);

// Branch files and formats sit beside SKILL.md and are reached by relative links that must resolve.
for (const id of ['jado-flow','jado-evidence-contract','jado-install']) {
  const text = await readFile(`.agents/skills/${id}/SKILL.md`,'utf8');
  for (const [, link] of text.matchAll(/\]\(([A-Z-]+\.md)\)/g)) await readFile(`.agents/skills/${id}/${link}`,'utf8');
}

// The resolver turns dials into one run's limits deterministically.
const { resolve } = await import('../../.agents/skills/jado-flow/scripts/resolve.mjs');
const method = JSON.parse(await readFile('jado/policies/method.json','utf8'));
const leanExplore = await resolve({ route:'R05', stage:'explore', budget:'lean' });
assert.equal(leanExplore.announce, `JADO · R05 explore · ${method.dials.involvement.default} · lean`);
assert.equal(leanExplore.limits.mode, 'solo');
assert.equal(leanExplore.limits.maxFixPasses, method.dials.stage.values.explore.maxFixPasses);
assert.match(leanExplore.limits.independentReview, /skipped/);
assert.equal((await resolve({ route:'R05', stage:'refine', budget:'normal' })).limits.independentReview, 'required');
assert.equal((await resolve({ route:'R04', stage:'ship', budget:'lean' })).limits.independentReview, 'required', 'Ship keeps its review on a lean budget');
const r05 = JSON.parse(await readFile('jado/runtime/R05.json','utf8')).workflow.budget;
assert.equal((await resolve({ route:'R05', budget:'deep', stage:'explore' })).limits.newDelegations, Math.min(method.dials.budget.values.deep.newDelegations, r05.newDelegations), 'The route cap bounds the budget dial');
await assert.rejects(resolve({ route:'R05', stage:'ship' }), /does not support ship/);
await assert.rejects(resolve({ route:'R99' }), /Unknown route/);
const project = await mkdtemp(path.join(tmpdir(),'jado-defaults-'));
await writeFile(path.join(project,'AGENTS.md'),'# Product\n\nJADO defaults: stage=explore involvement=autopilot budget=lean\n');
const defaults = await resolve({ route:'R05', project, budget:'normal' });
assert.deepEqual([defaults.dials.stage, defaults.dials.involvement.value, defaults.dials.budget.source], [{ value:'explore', source:'AGENTS.md' }, 'autopilot', 'request'], 'Request beats project defaults, which beat policy defaults');
await rm(project,{recursive:true});
