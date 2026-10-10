import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const excluded = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', '.cache', '.DS_Store']);
export const mayCopy = (file) => !file.split(path.sep).some((p) => excluded.has(p) || /^\.env(?:\.|$)/.test(p) || /^(?:auth|credentials)\.(?:json|toml)$/.test(p) || /\.(?:pem|key)$/.test(p));
export async function inventory(root, lock, designIds, prefix = 'skills') {
  const files = [];
  const walk = async (dir) => {
    for (const e of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir,e.name);
      if (!mayCopy(file)) continue;
      if (e.isSymbolicLink()) throw new Error(`Non-portable symlink: ${file}`);
      if (e.isDirectory()) await walk(file);
      else files.push(file);
    }
  };
  await walk(root);
  const result = [];
  for (const file of files.filter((f) => path.basename(f) === 'SKILL.md')) {
    const folder = path.dirname(file);
    const relative = path.relative(root, folder).split(path.sep).join('/');
    const sourceKey = relative.split('/')[0];
    const contents = await readFile(file, 'utf8');
    const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const data = match ? parse(match[1]) : {};
    const hash = createHash('sha256');
    for (const child of files.filter((f) => f.startsWith(folder + path.sep))) {
      hash.update(path.relative(folder,child)); hash.update('\0'); hash.update(await readFile(child)); hash.update('\0');
    }
    const record = lock.skills?.[sourceKey];
    const source = record ? `https://github.com/${record.source}/blob/HEAD/${record.skillPath}` : 'local snapshot; upstream provenance not established in the lock';
    result.push({ id: relative.replaceAll('/', '-').replace(/^\./, ''), name: data.name ?? sourceKey, description: typeof data.description === 'string' ? data.description : 'Local instructions', path: `${prefix}/${relative}/SKILL.md`, source, hash: hash.digest('hex'), design: designIds.includes(sourceKey), sourceRecord: record ?? null,
      absolutePathReferences: [...new Set(contents.match(/\/(?:Users|home)\/[^\s`"')]+/g) ?? [])],
      licenseFiles: files.filter((f) => f.startsWith(folder + path.sep) && /^(LICENSE|NOTICE)/i.test(path.basename(f))).map((f) => path.relative(root,f)) });
  }
  return result;
}

export async function importLocal(skillsRoot, lockFile, destination = process.cwd()) {
  const lock = JSON.parse(await readFile(lockFile,'utf8'));
  const selection = JSON.parse(await readFile(path.join(destination,'registry/catalog-selection.json'),'utf8'));
  const entries = (await inventory(skillsRoot,lock,selection.skills)).filter(s => selection.skills.includes(s.id) && s.sourceRecord?.sourceType === 'github');
  if (!entries.length) throw new Error('Source has no selected upstream references: import cancelled.');
  const metadata = path.join(destination,'jado');
  await mkdir(metadata,{recursive:true});
  // Import references only. Owned procedures live in .agents/skills; upstream bytes are never vendored.
  const filteredLock = {version:3,skills:Object.fromEntries(entries.map(s => [s.id,s.sourceRecord]))};
  const { atomicWrite } = await import('../../lib/jado/store.ts');
  await atomicWrite(path.join(metadata,'skill-lock.json'),JSON.stringify(filteredLock,null,2)+'\n');
  await atomicWrite(path.join(metadata,'skill-inventory.json'),JSON.stringify({importedAt:new Date().toISOString(),source:'upstream-references',entries},null,2)+'\n');
  return entries;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const {values}=parseArgs({options:{'skills-root':{type:'string',default:path.join(homedir(),'.agents/skills')},'skill-lock':{type:'string'}}});
  const entries = await importLocal(values['skills-root'], values['skill-lock'] ?? path.join(values['skills-root'],'..','.skill-lock.json'));
  console.log(`Imported ${entries.length} upstream references. No external content copied. Run npm run jado:compile.`);
}
