'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { INSTALL_URL, NAV_LINKS } from './constants';
import { ExternalLink } from './external-link';
import { HomeLink } from './home-link';
import { GithubIcon } from './icons';
import s from './landing.module.css';

const SHOW_AFTER = 140;
const SECTIONS = NAV_LINKS.flatMap((link) => ('section' in link ? [link.section] : []));

// Glass pill that appears once the static nav has scrolled away. It stays visible while scrolling
// in both directions: the page is short and every link is one tap away, so hiding on scroll-down
// would only add motion without freeing space.
export function FloatingNav() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const menuId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const next = window.scrollY > SHOW_AFTER;
      setShown(next);
      if (!next) setOpen(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // The section crossing a line just above the middle of the viewport is the current one.
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setCurrent(SECTIONS.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: '-45% 0px -54% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <header ref={rootRef} className={s.fnav} data-shown={shown} inert={!shown}>
      <nav className={s.fnavPill} aria-label="Quick">
        <HomeLink className={s.fnavMark}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG mark, fixed size */}
          <img src="/landing/jado-mark-cobalt.svg" alt="" width={20} height={22} />
        </HomeLink>
        <ul id={menuId} ref={menuRef} className={s.fnavLinks} data-open={open} onClick={() => setOpen(false)}>
          {NAV_LINKS.map((link) => {
            const active = 'section' in link && link.section === current;
            return (
              <li key={link.label}>
                {'external' in link ? (
                  <ExternalLink href={link.href}>{link.label}</ExternalLink>
                ) : (
                  <a href={link.href} aria-current={active ? 'true' : undefined}>
                    {link.label}
                  </a>
                )}
              </li>
            );
          })}
          <li>
            <a className={s.fnavInstall} href={INSTALL_URL} aria-label="Install JADO from GitHub">
              <GithubIcon />
              <span>Install</span>
            </a>
          </li>
        </ul>
        <button
          ref={toggleRef}
          type="button"
          className={`${s.menuToggle} ${s.fnavToggle}`}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
        </button>
      </nav>
    </header>
  );
}
