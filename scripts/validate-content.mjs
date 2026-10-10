import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing frontmatter');
  return { data: parse(match[1]), body: text.slice(match[0].length) };
}
export async function documents(dir = 'content/docs') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await documents(file));
    else if (/\.mdx?$/.test(entry.name)) result.push({ file, ...frontmatter(await readFile(file, 'utf8')) });
  }
  return result;
}
export function validate(docs, registries) {
  const errors = [];
  const route = (file) => '/docs' + file.replace(/^content\/docs/, '').replace(/\.mdx?$/, '').replace(/\/index$/, '');
  const routes = new Set(['/workflows', ...docs.map(({ file }) => route(file))]);
  for (const [kind, entries] of Object.entries(registries)) {
    const ids = entries.map(({id}) => id);
    if (new Set(ids).size !== ids.length) errors.push(`Duplicate ${kind} IDs`);
  }
  for (const {file, data, body} of docs) {
    for (const key of ['title','description','status','lastReviewed']) if (typeof data[key] !== 'string' || !data[key].trim()) errors.push(`${file}: missing ${key}`);
    if ('owner' in data) errors.push(`${file}: unsupported owner field`);
    if (!['observed','proposed','unresolved'].includes(data.status)) errors.push(`${file}: invalid status`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.lastReviewed ?? '')) errors.push(`${file}: invalid review date`);
    if (data.workflow) for (const key of ['stage','inputs','outputs']) if (!data[key]?.length) errors.push(`${file}: workflow missing ${key}`);
    for (const kind of ['skills','agents','tools']) for (const id of data[kind] ?? []) if (!registries[kind].some((entry) => entry.id === id)) errors.push(`${file}: unknown ${kind} ${id}`);
    const prose = body.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
    for (const match of prose.matchAll(/\]\((\/[^\s)]+)\)/g)) {
      const target = match[1].split(/[?#]/)[0].replace(/\/$/, '');
      if (!routes.has(target)) errors.push(`${file}: broken page link ${target}`);
    }
  }
  return errors;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const docs = await documents();
  const registries = Object.fromEntries(await Promise.all(['skills','agents','tools'].map(async (kind) => [kind, JSON.parse(await readFile(`registry/${kind}.json`, 'utf8')).entries])));
  const errors = validate(docs, registries);
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else console.log(`Validated ${docs.length} pages, metadata, registry references and internal page links.`);
}
