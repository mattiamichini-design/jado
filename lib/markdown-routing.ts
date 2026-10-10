import { rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from './shared.ts';

const suffix = rewritePath(`${docsRoute}{/*path}.md`, `${docsContentRoute}{/*path}/content.md`).rewrite;
const negotiated = rewritePath(`${docsRoute}{/*path}`, `${docsContentRoute}{/*path}/content.md`).rewrite;
const docsPath = /^\/docs(\/|\.md$|$)/;

export type RoutingDecision = { type: 'next' } | { type: 'rewrite'; pathname: string; vary?: string };

/**
 * Decides how the proxy serves a playbook path.
 * A page has two representations: `/docs/x.md` and `/docs/x` with `Accept: text/markdown` both rewrite to the
 * markdown route; the negotiated one adds `Vary: Accept`.
 */
export function routeMarkdown(pathname: string, markdownPreferred: boolean): RoutingDecision {
  if (!docsPath.test(pathname)) return { type: 'next' };

  const suffixed = suffix(pathname);
  if (suffixed) return { type: 'rewrite', pathname: suffixed };

  if (markdownPreferred) {
    const target = negotiated(pathname);
    if (target) return { type: 'rewrite', pathname: target, vary: 'Accept' };
  }

  return { type: 'next' };
}
