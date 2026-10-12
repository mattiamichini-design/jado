'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { INSTALL_URL, NAV_LINKS } from './constants';
import { ExternalLink } from './external-link';
import { HomeLink } from './home-link';
import { GithubIcon } from './icons';
import s from './landing.module.css';

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Move focus into the menu when it opens; give it back to the toggle when it closes.
  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    } else if (wasOpen.current && menuRef.current?.contains(document.activeElement)) {
      toggleRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`${s.nav} ${s.hNav}`}>
      <nav className={s.navInner} aria-label="Primary">
        <div className={s.brandSlot}>
          <HomeLink>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG lockup, fixed size */}
            <img src="/landing/jado-lockup-cobalt.svg" alt="" width={123} height={32} />
          </HomeLink>
        </div>
        <ul id={menuId} ref={menuRef} className={s.menu} data-open={open} onClick={() => setOpen(false)}>
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {'external' in link ? <ExternalLink href={link.href}>{link.label}</ExternalLink> : <a href={link.href}>{link.label}</a>}
            </li>
          ))}
        </ul>
        <div className={s.actionsSlot}>
          <button
            ref={toggleRef}
            type="button"
            className={s.menuToggle}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
          </button>
          <a className={`${s.btn} ${s.btnDark} ${s.btnSm}`} href={INSTALL_URL}>
            <GithubIcon />
            Install JADO
          </a>
        </div>
      </nav>
    </header>
  );
}
