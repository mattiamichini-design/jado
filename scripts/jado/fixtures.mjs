import { readFile, mkdir, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Synthetic upstream packages keep installer regressions offline; they are not execution evidence.
export async function fixturePackage(name, record, skill, workspace) {
  const folder = path.join(workspace,`fixture-${name}`);
  await mkdir(folder,{recursive:true});
  const content = `---\nname: ${skill}\ndescription: Synthetic upstream fixture for ${name}.\n---\n# ${skill}\n`;
  await writeFile(path.join(folder,'SKILL.md'),content);
  if (name === 'avoid-ai-writing') {
    await mkdir(path.join(folder,'scripts'));
    await writeFile(path.join(folder,'scripts/check-pattern-count.sh'),'#!/bin/sh\nprintf "fixture\\n"\n',{mode:0o755});
  }
  return {folder,record:{...record,skillFolderHash:createHash('sha256').update(content).digest('hex')}};
}
export async function fixtureReferences() {
  return JSON.parse(await readFile(new URL('../../jado/skill-lock.json',import.meta.url))).skills;
}

// An old managed profile and renamed procedure exercise both local and global upgrades.
export async function fixtureLegacyNames(target) {
  const {state,hash,json} = await import('./install.mjs');
  const manifestFile = path.join(target,'.jado/install.json');
  const manifest = JSON.parse(await readFile(manifestFile));
  const oldProfile = '.codex/agents/jado-design.toml';
  await writeFile(path.join(target,oldProfile),'# Generated from jado/agents.json.\nname = "jado-design"\n');
  const catalogPath = '.jado/registry/jado-catalog.json';
  const catalog = JSON.parse(await readFile(path.join(target,catalogPath)));
  const retired = [oldProfile];
  for (const id of ['jado-design','jado-systems']) {
    const body = `---\nname: ${id}\ndescription: Previous generated procedure.\n---\n`;
    const oldSkill = `.jado/.agents/skills/${id}/SKILL.md`;
    const oldLink = `.agents/skills/${id}`;
    await mkdir(path.dirname(path.join(target,oldSkill)),{recursive:true});
    await writeFile(path.join(target,oldSkill),body);
    await symlink(`../../.jado/.agents/skills/${id}`,path.join(target,oldLink));
    catalog.skills.push({id,name:id,path:`.agents/skills/${id}/SKILL.md`,description:'Previous generated procedure.',design:true,source:'JADO',hash:hash(body)});
    retired.push(oldSkill,oldLink);
  }
  await writeFile(path.join(target,catalogPath),json(catalog));
  for(const file of [...retired,catalogPath]) manifest.files[file] = await state(target,file);
  await writeFile(manifestFile,json(manifest));
  return retired;
}
