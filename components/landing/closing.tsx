import Image from 'next/image';
import Link from 'next/link';
import { AUTHOR_URL, INSTALL_COMMAND, INSTALL_URL, PLAYBOOK_URL, REPO_URL } from './constants';
import { CopyCommand } from './copy-command';
import { ExternalLink } from './external-link';
import { BookIcon, ExternalIcon } from './icons';
import s from './landing.module.css';

export function FinalCta() {
  return (
    <section className={s.cta} aria-labelledby="cta-title" data-observe>
      <div className={s.ctaMesh} aria-hidden="true">
        <Image unoptimized src="/landing/cta-mesh.webp" alt="" fill sizes="600px" />
      </div>
      <div className={s.ctaContours} aria-hidden="true" />
      <h2 id="cta-title" className={s.ctaTitle} data-reveal="rise">
        Put your agents to work, in order.
      </h2>
      <div className={s.ctaRow} data-reveal="rise" style={{ '--i': 1 } as React.CSSProperties}>
        <CopyCommand command={INSTALL_COMMAND} />
        <a className={`${s.btn} ${s.btnDark} ${s.btnLg}`} href={PLAYBOOK_URL} target="_blank" rel="noopener">
          <BookIcon />
          Playbook
          <ExternalIcon />
          <span className={s.srOnly}> (opens in a new tab)</span>
        </a>
      </div>
      <p className={s.ctaNote} data-reveal="fade" style={{ '--i': 2 } as React.CSSProperties}>
        Requires Node.js 22.22 or later. Native profiles for Claude Code, Codex and OpenCode.
      </p>
    </section>
  );
}

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footBrand}>
          <Link href="/" aria-label="JADO, home">
            <Image unoptimized src="/landing/jado-lockup-carved.webp" alt="" width={171} height={49} />
          </Link>
        </div>
        <p className={s.footCenter}>
          Just Another Design Orchestrator · A method by{' '}
          {/* The referrer stays on, so mattiamichini.com can see the visit came from here. */}
          <a className={s.footAuthor} href={AUTHOR_URL} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin">
            Mattia<span className={s.srOnly}> (opens in a new tab)</span>
          </a>
        </p>
        <ul className={s.footLinks}>
          <li>
            <ExternalLink href={PLAYBOOK_URL}>Playbook</ExternalLink>
          </li>
          <li>
            <a href={REPO_URL}>GitHub</a>
          </li>
          <li>
            <a href={INSTALL_URL}>Install</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
