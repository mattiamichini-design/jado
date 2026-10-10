import assert from 'node:assert/strict';
import { routeMarkdown } from '../lib/markdown-routing.ts';

const next = { type: 'next' };
const rewrite = (pathname, vary) => (vary ? { type: 'rewrite', pathname, vary } : { type: 'rewrite', pathname });

// `.md` suffix, including the playbook root.
assert.deepEqual(routeMarkdown('/docs.md', false), rewrite('/llms.mdx/docs/content.md'));
assert.deepEqual(routeMarkdown('/docs/jado/r01.md', false), rewrite('/llms.mdx/docs/jado/r01/content.md'));
assert.deepEqual(routeMarkdown('/docs/jado/r01.md', true), rewrite('/llms.mdx/docs/jado/r01/content.md'), 'the suffix wins over negotiation and sends no Vary');

// Content negotiation sends Vary: Accept; without a markdown preference the page is served as HTML.
assert.deepEqual(routeMarkdown('/docs/jado/r01', true), rewrite('/llms.mdx/docs/jado/r01/content.md', 'Accept'));
assert.deepEqual(routeMarkdown('/docs', true), rewrite('/llms.mdx/docs/content.md', 'Accept'));
assert.deepEqual(routeMarkdown('/docs/jado/r01', false), next);
assert.deepEqual(routeMarkdown('/docs', false), next);

// Unrelated paths are not touched.
for (const pathname of ['/', '/workflows', '/docsx', '/docs-old', '/og/docs/a/image.png', '/llms.mdx/docs/a/content.md', '/api/search', '/llms.txt']) {
  assert.deepEqual(routeMarkdown(pathname, false), next, pathname);
  assert.deepEqual(routeMarkdown(pathname, true), next, `${pathname} (markdown preferred)`);
}
