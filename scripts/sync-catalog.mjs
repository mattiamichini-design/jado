import { resolveAgents } from '../lib/jado/render.ts';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { frontmatter, documents } from './validate-content.mjs';

const today = new Date().toISOString().slice(0, 10);
const dateIn = (text) => text?.match(/^lastReviewed: "(\d{4}-\d{2}-\d{2})"$/m)?.[1];

/**
 * Writes a generated page and picks its `lastReviewed` date.
 * A page keeps its recorded date while its content is unchanged, so a rerun is reproducible.
 */
async function writeDated(file, build) {
  const previous = await readFile(file, 'utf8').catch(() => null);
  let reviewed = dateIn(previous) ?? today;
  if (previous !== null && build(reviewed) !== previous) reviewed = today;
  await writeFile(file, build(reviewed));
}
const escape = (value) => String(value).replace(/[&<>|{}]/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '|': '&#124;', '{': '&#123;', '}': '&#125;' }[s]));
const git = (cwd, ...args) => {
  try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
};

export function skillSources(lock) {
  const entries = Object.entries(lock).map(([id, entry]) => {
    if (entry.sourceType !== 'github' || !/^[\w.-]+\/[\w.-]+$/.test(entry.source) || !entry.skillPath || entry.skillPath.split('/').includes('..')) throw new Error(`Invalid skill lock source: ${id}`);
    return { id, file: `${id}/SKILL.md`, source: { kind: 'external', author: entry.source.split('/')[0], repository: entry.source, path: entry.skillPath } };
  });
  return entries.filter(({file}) => !file.startsWith('.system/') && !file.startsWith('codex') && !['imagegen/SKILL.md','openai-docs/SKILL.md'].includes(file));
}

const jadoRepository = 'mattiamichini-design/jado';
const sourceURL = (repository, file) => `https://github.com/${repository}/blob/HEAD/${file.split('/').map(encodeURIComponent).join('/')}`;

export async function collectSkills(skillsRoot, lock, selectedIds, { ownRoot, repository = jadoRepository, references } = {}) {
  skillsRoot = path.resolve(skillsRoot);
  const skills = [];
  const identities = new Set();
  for (const candidate of skillSources(lock).filter(({id}) => selectedIds.includes(id))) {
    if (!/^[a-z0-9-]+$/.test(candidate.id)) throw new Error(`Invalid skill ID: ${candidate.id}`);
    if (references) {
      const reference = references.find(s => s.id === candidate.id);
      if (!reference) throw new Error(`Missing upstream reference: ${candidate.id}`);
      const url = sourceURL(candidate.source.repository,candidate.source.path);
      skills.push({id:candidate.id,name:reference.name,description:reference.description,source:{...candidate.source,url,localPath:null,localUrl:url}});
      identities.add(reference.name.toLowerCase());
      continue;
    }
    const file = path.join(skillsRoot, candidate.file);
    if (git(skillsRoot, 'check-ignore', '-q', '--', file) !== null) continue;
    let text;
    try { text = await readFile(file, 'utf8'); } catch(error) { if (error.code === 'ENOENT') { console.warn(`Not installed: ${candidate.id}`); continue; } throw error; }
    const {data} = frontmatter(text);
    if (typeof data.name !== 'string' || typeof data.description !== 'string') throw new Error(`Missing metadata: ${file}`);
    const identity = data.name.trim().toLowerCase();
    if (identities.has(identity)) continue;
    identities.add(identity);
    const description = data.description.trim();
    skills.push({ id: candidate.id, name: data.name, description, source: { ...candidate.source, url: sourceURL(candidate.source.repository, candidate.source.path), localPath: `skills/${candidate.file}`, localUrl: sourceURL(repository, `skills/${candidate.file}`) } });
  }
  if (ownRoot) {
    for (const dir of await readdir(ownRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      let text;
      try { text = await readFile(path.join(ownRoot, dir.name, 'SKILL.md'), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const { data } = frontmatter(text);
      if (!/^[a-z0-9-]+$/.test(dir.name) || data.name !== dir.name || typeof data.description !== 'string' || !data.description.trim()) throw new Error(`Invalid local skill metadata: ${dir.name}`);
      if (!selectedIds.includes(dir.name)) continue;
      if (skills.some(({id}) => id === dir.name) || identities.has(data.name.toLowerCase())) throw new Error(`Duplicate local skill identity: ${dir.name}`);
      identities.add(data.name.toLowerCase());
      const file = `.agents/skills/${dir.name}/SKILL.md`;
      skills.push({ id: dir.name, name: data.name, description: data.description.trim(), source: { kind: 'local', author: 'JADO', repository, path: file, url: sourceURL(repository, file), localPath: file, localUrl: sourceURL(repository, file) } });
    }
  }
  return skills.sort((a,b) => a.name.localeCompare(b.name));
}

async function writeJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
}
export function catalogGuide(kind, entry, editorial) {
  for (const field of ['description', 'does', 'when', 'usage', 'example']) {
    if (typeof editorial?.[field] !== 'string' || !editorial[field].trim()) throw new Error(`Missing catalog guide: ${kind}/${entry.id}/${field}`);
  }
  for (const field of ['outputs', ...(editorial.prerequisites === undefined ? [] : ['prerequisites'])]) {
    if (!Array.isArray(editorial[field]) || !editorial[field].length || editorial[field].some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`Invalid catalog guide: ${kind}/${entry.id}/${field}`);
  }
  return { ...entry, ...Object.fromEntries(['description', 'does', 'when', 'usage', 'example', 'outputs', 'prerequisites'].filter((field) => editorial[field] !== undefined).map((field) => [field, editorial[field]])) };
}

// Template wording of the generated catalog pages.
const t = {
  labels: { skills: 'Skill catalog', agents: 'Agent catalog' },
  invoke: (name) => `Ask for it by name, or invoke it with \`/${name}\` in Claude Code or \`$${name}\` in Codex. `,
  whatItDoes: 'What it does', whenToUse: 'When to use it', howToUse: 'How to use it', delivers: 'What it delivers', example: 'Example', prerequisites: 'Prerequisites',
  instructions: 'Executable instructions',
  open: (kind, entry) => `Open ${entry.source.kind === 'external' ? 'the upstream skill' : kind === 'skills' ? 'the JADO skill' : 'the JADO procedure'}`,
  installed: (author, url) => `The skill is installed from the source maintained by [${author}](${url}); its license applies.`,
  inWorkflow: 'In the workflow',
  noWorkflow: (docs) => `Use the [router](${docs}/automation/routing) to choose this capability based on the required outcome.`,
  intro: {
    skills: 'JADO procedures and upstream references for design work. Each entry explains what the skill does, when to use it, how to request it and what outcome to expect.',
    agents: 'Three working profiles and two independent reviewers for the JADO method; specialist procedures are composable skills. Each entry describes the assignment, required materials and scope limits.',
  },
  choose: (docs) => `[How to choose a skill or agent](${docs}/automation/routing)`,
  configuration: (docs) => `\n\nThe installer writes these profiles for Claude Code, Codex and OpenCode: see the [JADO configuration guide](${docs}/jado/configuration). Then choose the role for the work at hand.`,
  capability: 'Capability', assignment: 'Assignment', author: 'Author',
};
const marker = '<!-- Generated by scripts/sync-catalog.mjs. -->';

async function generate(kind, entries, workflows, copy) {
  const docs = '/docs';
  const label = t.labels[kind];
  entries = entries.map((entry) => catalogGuide(kind, entry, copy[entry.id]));
  const dir = path.join('content/docs/automation', kind);
  await mkdir(dir, { recursive: true });
  // Remove only generator-owned pages, including orphan pages absent from the previous registry.
  for (const file of await readdir(dir)) {
    if (!/^[a-z0-9-]+\.md$/.test(file) || file === 'index.md' || entries.some(({id}) => file === `${id}.md`)) continue;
    if ((await readFile(path.join(dir, file), 'utf8')).includes(marker)) await rm(path.join(dir, file));
  }
  for (const entry of entries) {
    const data = (reviewed) => ({ title: entry.name, description: entry.description, status: 'observed', lastReviewed: reviewed });
    const fm = (reviewed) => Object.entries(data(reviewed)).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    const related = workflows.filter(({data}) => data[kind]?.includes(entry.id));
    const links = related.map(({file,data}) => `- [${data.title}](${docs}/${file.replace(/^content\/docs\//, '').replace(/\.mdx?$/, '').replace(/\/index$/, '')})`).join('\n');
    const usage = `${kind === 'skills' ? t.invoke(entry.name) : ''}${escape(entry.usage)}`;
    const instructions = entry.source.localUrl;
    const source = `\n## ${t.instructions}\n\n[${t.open(kind, entry)}](${instructions})${kind === 'skills' && entry.source.kind !== 'local' ? `\n\n${t.installed(escape(entry.source.author), entry.source.url)}` : ''}\n`;
    const requirements = entry.prerequisites ? `\n## ${t.prerequisites}\n\n${entry.prerequisites.map((item) => `- ${escape(item)}`).join('\n')}\n` : '';
    await writeDated(path.join(dir, `${entry.id}.md`), (reviewed) => `---\n${fm(reviewed)}\n---\n\n${marker}\n\nID: \`${entry.id}\`.\n\n## ${t.whatItDoes}\n\n${escape(entry.does)}\n\n## ${t.whenToUse}\n\n${escape(entry.when)}\n\n## ${t.howToUse}\n\n${usage}\n\n## ${t.delivers}\n\n${entry.outputs.map((item) => `- ${escape(item)}`).join('\n')}\n\n## ${t.example}\n\n${escape(entry.example)}\n${requirements}${source}\n## ${t.inWorkflow}\n\n${links || t.noWorkflow(docs)}\n`);
  }
  await writeJSON(path.join(dir, 'meta.json'), { title: label, pages: ['index', ...entries.map((entry) => entry.id)] });
  const configuration = kind === 'agents' ? t.configuration(docs) : '';
  await writeDated(path.join(dir, 'index.md'), (reviewed) => `---\ntitle: ${JSON.stringify(label)}\ndescription: ${JSON.stringify(t.intro[kind])}\nstatus: "observed"\nlastReviewed: "${reviewed}"\n---\n\n${t.choose(docs)}${configuration}\n\n| ${t.capability} | ${t.assignment} |${kind === 'skills' ? ` ${t.author} |` : ''}\n| --- | --- |${kind === 'skills' ? ' --- |' : ''}\n${entries.map((entry) => `| [${escape(entry.name)}](${docs}/automation/${kind}/${entry.id}) | ${escape(entry.description).replace(/\n/g, ' ')} |${kind === 'skills' ? ` [${escape(entry.source.author)}](${entry.source.url}) |` : ''}`).join('\n')}\n`);
  await writeJSON(path.join('registry', `${kind}.json`), { entries });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: {
    'skills-root': { type: 'string', default: path.resolve('skills') },
    'agents-root': { type: 'string', default: path.resolve('.codex/agents') },
    'own-skills-root': { type: 'string', default: path.resolve('.agents/skills') },
    'skill-lock': { type: 'string' },
  } });
  const lockPath = values['skill-lock'] ?? path.resolve('jado/skill-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8')).skills;
  const selection = JSON.parse(await readFile('registry/catalog-selection.json', 'utf8'));
  const skills = await collectSkills(values['skills-root'], lock, selection.skills, { ownRoot: values['own-skills-root'], references: JSON.parse(await readFile('jado/skill-inventory.json','utf8')).entries });
  for (const id of selection.skills) if (!skills.some((entry) => entry.id === id)) throw new Error(`Selected skill is missing or excluded: ${id}`);
  const agents = [];
  const roles = resolveAgents(JSON.parse(await readFile('jado/agents.json', 'utf8')));
  for (const selectedId of selection.agents) {
    if (!/^[a-z0-9-]+$/.test(selectedId)) throw new Error(`Invalid agent ID: ${selectedId}`);
    const name = `${selectedId}.toml`;
    const role = roles.find(({id}) => id === selectedId);
    if (!role) throw new Error(`Agent is outside the current JADO method: ${selectedId}`);
    const profileRoot = values['agents-root'];
    const text = await readFile(path.join(profileRoot, name), 'utf8');
    // ponytail: scalar profile metadata; use a TOML parser if these fields become multiline.
    const scalar = (key) => {
      const match = text.match(new RegExp(`^${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, 'm'));
      return match ? JSON.parse(match[1]) : null;
    };
    const id = scalar('name') ?? name.replace('.toml','');
    if (id !== selectedId) throw new Error(`Agent ID mismatch: ${name}`);
    if (!scalar('description')) throw new Error(`Missing agent description: ${name}`);
    agents.push({ id, name: role.name, description: scalar('description'), routing: 'jado-flow', source: { kind: 'local', author: 'JADO', repository: jadoRepository, path: role.procedure, localPath: role.procedure, url: sourceURL(jadoRepository, role.procedure), localUrl: sourceURL(jadoRepository, role.procedure) } });
  }
  const pages = (await documents()).filter(({data}) => data.workflow || (data.inputs?.length && data.outputs?.length));
  const copy = JSON.parse(await readFile('registry/catalog-copy.json', 'utf8'));
  await generate('skills', skills, pages, copy.skills);
  await generate('agents', agents, pages, copy.agents);
  console.log(`Generated ${skills.length} selected skills and ${agents.length} agents.`);
}
