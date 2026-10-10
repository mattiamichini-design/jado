import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { documentSchema, type Catalog, type Guard } from './schema.ts';

export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const json = async (file: string) => JSON.parse(await readFile(file,'utf8'));
export async function readJado(root = process.cwd()) {
  const [raw,catalog,guards] = await Promise.all([readFile(path.join(root,'jado/workflows.json'),'utf8'),json(path.join(root,'registry/jado-catalog.json')),json(path.join(root,'jado/policies/guards.json'))]);
  const document = documentSchema.parse(JSON.parse(raw));
  return { revision: digest(raw), document, catalog: catalog as Catalog, guards: guards as Record<string,Guard> };
}
export async function atomicWrite(file: string, contents: string) {
  await mkdir(path.dirname(file),{recursive:true});
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temporary,contents,{flag:'wx'}); await rename(temporary,file); }
  finally { await rm(temporary,{force:true}); }
}
