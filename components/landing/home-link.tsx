'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Logo link to the landing page. Next skips the scroll when the target is the current page, so a
 * plain click scrolls back to the top here (smooth unless reduced motion is on) and drops any
 * section hash. Modified clicks keep the default behaviour, such as opening a new tab.
 */
export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== '/') return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // The floating nav turns inert at the top; blurring returns focus to the start of the document.
    // Blur before scrolling: in Chrome, a blur cancels a smooth scroll that is already running.
    event.currentTarget.blur();
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0 });
  };

  return (
    <Link className={className} href="/" aria-label="JADO, home" onClick={onClick}>
      {children}
    </Link>
  );
}
