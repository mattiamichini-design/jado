'use client';

import { useEffect, useLayoutEffect } from 'react';

const ROOT = '[data-landing]';

// Timings shared with the stylesheet. They are declared once, as custom properties on the landing root in
// landing.module.css, and read from there so the script and the CSS cannot drift apart. Every read takes a
// fallback equal to the declared value, so a missing token keeps today's behaviour instead of producing NaN.
/** A duration token (`--count-delay`) in milliseconds. Browsers may serialise `1050ms` as `1.05s`, so the unit is read. */
function durationToken(root: HTMLElement, name: string, fallback: number) {
  const value = getComputedStyle(root).getPropertyValue(`--${name}`).trim();
  const unit = value.endsWith('ms') ? 1 : value.endsWith('s') ? 1000 : Number.NaN;
  const parsed = Number.parseFloat(value) * unit;
  return parsed > 0 ? parsed : fallback;
}

/**
 * Landing motion controller. Renders nothing.
 * - Marks the page ready (the inline script in the layout set data-motion before first paint).
 * - Starts the hero choreography once fonts are ready.
 * - Reveals [data-reveal] / [data-observe] elements once, when they enter the viewport.
 * - Counts the hero facts up.
 * All visual states live in CSS; with reduced motion or no JS nothing is hidden.
 */
export function LandingMotion() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(ROOT);
    if (!root) return;
    root.setAttribute('data-ready', '');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.removeAttribute('data-motion');
      return;
    }
    // Client-side navigation does not rerun the inline layout script.
    root.setAttribute('data-motion', 'on');
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(ROOT);
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      root.setAttribute('data-hero', 'in');
      return;
    }

    const cleanups: Array<() => void> = [];

    const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
    const targets = counters.map((el) => Number(el.dataset.count ?? el.textContent));
    counters.forEach((el) => (el.textContent = '0'));

    const countUp = () => {
      const start = performance.now() + durationToken(root, 'count-delay', 1050);
      const duration = durationToken(root, 'count-duration', 1100);
      let frame = 0;
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - t, 3);
        counters.forEach((el, i) => (el.textContent = String(Math.round(targets[i] * eased))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      cleanups.push(() => cancelAnimationFrame(frame));
    };

    let started = false;
    const startHero = () => {
      if (started) return;
      started = true;
      requestAnimationFrame(() => {
        root.setAttribute('data-hero', 'in');
        countUp();
      });
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const fallback = window.setTimeout(startHero, durationToken(root, 'hero-fallback', 700));
    cleanups.push(() => window.clearTimeout(fallback));
    if (fonts?.ready) fonts.ready.then(startHero);
    else startHero();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-in', '');
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    const targets2 = Array.from(root.querySelectorAll('[data-reveal], [data-observe]'));
    targets2.forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // Failsafe: if the observer never fires, reveal anything that is inside the viewport.
    const sweep = () => {
      const vh = window.innerHeight;
      for (const el of targets2) {
        if (el.hasAttribute('data-in')) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh * 0.94) {
          el.setAttribute('data-in', '');
          io.unobserve(el);
        }
      }
    };
    let sweepFrame = 0;
    const onScroll = () => {
      cancelAnimationFrame(sweepFrame);
      sweepFrame = requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    const timer = window.setInterval(sweep, durationToken(root, 'sweep-interval', 1000));
    const first = window.setTimeout(sweep, durationToken(root, 'sweep-first', 1200));
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearInterval(timer);
      window.clearTimeout(first);
      cancelAnimationFrame(sweepFrame);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
