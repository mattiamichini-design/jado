import type { ReactNode } from 'react';
import { ExternalIcon } from './icons';
import s from './landing.module.css';

/** A link that opens in a new tab, marked with an arrow and announced to screen readers. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={s.extLink} href={href} target="_blank" rel="noopener">
      {children}
      <ExternalIcon />
      <span className={s.srOnly}> (opens in a new tab)</span>
    </a>
  );
}
