import { readFile, mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory } from "./import-local.mjs";
import { validateDocument } from '../../lib/jado/schema.ts';
import { profile, workflowPage, workflowIndex, workflowSections, runInstructions, resolveAgents } from '../../lib/jado/render.ts';

import { runtimeArtifacts } from '../../lib/jado/runtime.ts';

const readJSON = async (file) => JSON.parse(await readFile(file,'utf8'));
// Owned procedures live in .agents/skills; upstream references install into skills/. Paths are relative to the JADO root.
const skillPath = (id, imported) => imported.entries.find(s => s.id === id)?.path ?? `.agents/skills/${id}/SKILL.md`;
const roleSkill = (agent, imported) => `---
name: ${agent.id}
description: ${JSON.stringify(agent.description)}
disable-model-invocation: true
---

# ${agent.name}

<!-- Generated from jado/agents.json. Do not edit. -->

${agent.instructions}

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

${agent.uses.map(u => `- \`${u.skill}\` (\`${skillPath(u.skill, imported)}\`): ${u.when}`).join('\n')}

## Scope and handoff

Write scope: ${agent.writeScope}

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in \`jado-evidence-contract\` (\`.agents/skills/jado-evidence-contract/SKILL.md\`).
`;
// Internal procedures stay out of implicit invocation in Codex as well; jado-flow and the profiles reach them by path.
const internalPolicy = 'policy:\n  allow_implicit_invocation: false\n';
const policyPath = (procedure) => path.join(path.dirname(procedure),'agents/openai.yaml');

export async function artifacts(root = process.cwd()) {
  const [document,agents,lock,imported,guards,tools,selection] = await Promise.all(['jado/workflows.json','jado/agents.json','jado/skill-lock.json','jado/skill-inventory.json','jado/policies/guards.json','jado/tools.json','registry/catalog-selection.json'].map((file) => readJSON(path.join(root,file))));
  const skills = await inventory(path.join(root,'.agents/skills'),{skills:{}},[],'.agents/skills');
  const catalog = { agents: resolveAgents(agents), skills:[...imported.entries.filter(s => !['ask-design','ui-flow'].includes(s.name)),...skills].map((s) => ({ id:s.id,name:s.name,description:s.description,path:s.path,source:s.source,hash:s.hash,design:s.path.startsWith('.agents/') || selection.skills.includes(s.id) })), tools:tools.entries };
  for (const dependency of imported.entries) {
    const record = lock.skills[dependency.id];
    if (!record || record.sourceType !== 'github' || !/^[\w.-]+\/[\w.-]+$/.test(record.source) || dependency.path !== `skills/${dependency.id}/SKILL.md` || record.source !== dependency.sourceRecord?.source) throw new Error(`Invalid upstream reference: ${dependency.id}`);
  }
  const errors = validateDocument(document,catalog,guards);
  for (const procedure of agents.procedures) {
    if (!Array.isArray(procedure.uses) || !procedure.uses.length) errors.push(`Procedure without skills to load: ${procedure.id}`);
    for (const use of procedure.uses ?? []) if (!catalog.skills.some(s => s.id === use.skill) || !use.when?.trim()) errors.push(`Invalid skill use in ${procedure.id}: ${use.skill}`);
  }
  // Claude and Codex must agree on which owned skills are user-invoked.
  for (const skill of skills) {
    const text = await readFile(path.join(root,skill.path),'utf8');
    const hidden = /^disable-model-invocation: true$/m.test(text.split('\n---')[0]);
    const policy = await readFile(path.join(root,path.dirname(skill.path),'agents/openai.yaml'),'utf8').catch(() => '');
    if (hidden !== /allow_implicit_invocation: false/.test(policy)) errors.push(`Invocation mismatch between SKILL.md and agents/openai.yaml: ${skill.id}`);
  }
  const method = await readJSON(path.join(root,'jado/policies/method.json'));
  for (const key of ['stage','involvement','budget']) if (!method.dials?.[key]?.values?.[method.dials[key].default]) errors.push(`Missing default for dial: ${key}`);
  for (const agent of catalog.agents) {
    if (!agent.id.startsWith('jado-agent-') || typeof agent.model !== 'string' || !agent.model.trim()) errors.push(`Unsupported profile binding: ${agent.id}`);
    if (!['low','medium','high','xhigh','max','ultra'].includes(agent.reasoning)) errors.push(`Unsupported Codex reasoning: ${agent.id}`);
    if (typeof agent.claude?.model !== 'string' || !agent.claude.model.trim() || !['low','medium','high','xhigh','max'].includes(agent.claude?.effort)) errors.push(`Unsupported Claude binding: ${agent.id}`);
    for (const id of agent.roles ?? []) if (!catalog.skills.some(s => s.id === id) || id.startsWith('jado-agent-')) errors.push(`Missing assigned procedure: ${id}`);
    for (const id of agent.skills) if (!catalog.skills.some((s) => s.id === id)) errors.push(`Missing skill in ${agent.id}: ${id}`);
  }
  const assigned = catalog.agents.flatMap(a => a.roles ?? []);
  for (const p of agents.procedures.filter(p => !p.roles)) if (!assigned.includes(p.id)) errors.push(`Procedure without a default profile: ${p.id}`);
  if (new Set(assigned).size !== assigned.length) errors.push('Procedure with multiple default profiles.');
  if (catalog.agents.some(a => catalog.skills.some(s => s.id === a.id))) errors.push('Profiles and skills must have distinct names.');
  if (errors.length) throw new Error(errors.join('\n'));
  const outputs = runtimeArtifacts(document,catalog,guards,method);
  outputs.set('registry/jado-catalog.json',JSON.stringify(catalog,null,2)+'\n');
  for (const agent of catalog.agents) {
    outputs.set(`.codex/agents/${agent.id}.toml`,profile(agent));
  }
  for (const procedure of agents.procedures) { outputs.set(procedure.procedure,roleSkill(procedure,imported)); outputs.set(policyPath(procedure.procedure),internalPolicy); }
  outputs.set('.agents/skills/jado-run/SKILL.md',runInstructions(document));
  outputs.set('jado/README.md',workflowIndex(document));
  for (const w of document.workflows) outputs.set(`content/docs/jado/${w.id.toLowerCase()}.md`,workflowPage(w,catalog));
  outputs.set('content/docs/jado/meta.json',JSON.stringify({title:'JADO',pages:['index','configuration','execution','roles',...workflowSections.flatMap(section => {
    const pages = document.workflows.filter(w => w.kind === section.kind).map(w => w.id.toLowerCase());
    return pages.length ? [`---${section.title}---`, ...pages] : [];
  })]},null,2)+'\n');
  return outputs;
}
export async function compile(root = process.cwd(), check = false) {
  // Role skills and entry exist before catalog inventory so generated hashes describe the final contents.
  const document = await readJSON(path.join(root,'jado/workflows.json'));
  const agents = await readJSON(path.join(root,'jado/agents.json'));
  const entry = '.agents/skills/jado-run/SKILL.md';
  // Retire only compiler-owned profiles and renamed generated procedure folders.
  const obsolete = ['.agents/skills/jado-design', '.agents/skills/jado-development', '.agents/skills/jado-systems'];
  for (const name of await readdir(path.join(root,'.codex/agents')).catch(e => { if(e.code === 'ENOENT') return []; throw e; })) {
    if (name.startsWith('jado-') && name.endsWith('.toml') && !agents.entries.some(a => `${a.id}.toml` === name)) {
      const file = path.join('.codex/agents',name);
      if ((await readFile(path.join(root,file),'utf8')).startsWith('# Generated from jado/agents.json.')) obsolete.push(file);
    }
  }
  // Generated workflow pages and runtime packets for routes that left the graph.
  const ids = new Set(document.workflows.map(w => w.id));
  for (const name of await readdir(path.join(root,'jado/runtime')).catch(() => [])) {
    if (name.endsWith('.json') && name !== 'index.json' && !ids.has(name.slice(0,-5))) obsolete.push(path.join('jado/runtime',name));
  }
  for (const name of await readdir(path.join(root,'content/docs/jado')).catch(() => [])) {
    if (!name.endsWith('.md') || document.workflows.some(w => `${w.id.toLowerCase()}.md` === name)) continue;
    if ((await readFile(path.join(root,'content/docs/jado',name),'utf8')).includes('<!-- Generated from jado/workflows.json. Do not edit. -->')) obsolete.push(path.join('content/docs/jado',name));
  }

  for (const file of obsolete) {
    try { await readdir(path.join(root,file)); } catch(e) { if(e.code === 'ENOENT') continue; if(e.code !== 'ENOTDIR') throw e; }
    if (check) throw new Error(`Obsolete artifact: ${file}. Run npm run jado:compile.`);
    await rm(path.join(root,file),{recursive:true});
  }

  if (!check) {
    const imported = await readJSON(path.join(root,'jado/skill-inventory.json'));
    const preliminary = new Map([[entry,runInstructions(document)]]);
    for (const a of agents.procedures) { preliminary.set(a.procedure,roleSkill(a,imported)); preliminary.set(policyPath(a.procedure),internalPolicy); }
    for (const [file,contents] of preliminary) { await mkdir(path.dirname(path.join(root,file)),{recursive:true}); await writeFile(path.join(root,file),contents); }
  }
  const outputs = await artifacts(root);
  const stale = [];
  for (const [file,contents] of outputs) {
    if (check) { let actual; try {actual = await readFile(path.join(root,file),'utf8');} catch {} if (actual!==contents) stale.push(file); }
    else { await mkdir(path.dirname(path.join(root,file)),{recursive:true}); await writeFile(path.join(root,file),contents); }
  }
  if (stale.length) throw new Error(`Outdated artifacts: ${stale.join(', ')}. Run npm run jado:compile.`);
  return outputs.size;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const {values}=parseArgs({options:{check:{type:'boolean',default:false}}});
  console.log(`${await compile(process.cwd(),values.check)} JADO artifacts ${values.check?'verified':'generated'}. No global installation.`);
}
