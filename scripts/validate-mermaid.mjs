import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { documents } from './validate-content.mjs';

// Mermaid's parser sanitizes labels and therefore needs a DOM even without SVG rendering.
const dom = new JSDOM('');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
const docs = await documents();
for (const file of await readdir('templates')) {
  if (file.endsWith('.md')) docs.push({ file: `templates/${file}`, body: await readFile(`templates/${file}`, 'utf8') });
}
docs.push({file:'jado/README.md',body:await readFile('jado/README.md','utf8')});
let count = 0;
try {
  for (const {file, body} of docs) {
    for (const [,chart] of body.matchAll(/^```mermaid\s*\n([\s\S]*?)^```/gm)) {
      try { await mermaid.parse(chart); count++; }
      catch(error) { throw new Error(`${file}: ${error.message}`, { cause: error }); }
    }
  }
  assert(count > 0, 'No Mermaid diagrams found');
  await assert.rejects(() => mermaid.parse('flowchart LR\n A -->'), 'Invalid Mermaid must fail validation');
  console.log(`Parsed ${count} Mermaid diagrams; invalid syntax is rejected.`);
} finally {
  dom.window.close();
}
