import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred } from 'fumadocs-core/negotiation';
import { routeMarkdown } from '@/lib/markdown-routing';

export default function proxy(request: NextRequest) {
  const decision = routeMarkdown(request.nextUrl.pathname, isMarkdownPreferred(request));
  if (decision.type === 'next') return NextResponse.next();

  // Clone the URL so the query string survives; only the path changes.
  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  return NextResponse.rewrite(url, decision.vary ? { headers: { Vary: decision.vary } } : undefined);
}

export const config = {
  matcher: ['/docs', '/docs.md', '/docs/:path*'],
};
