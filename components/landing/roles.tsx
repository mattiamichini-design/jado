'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import s from './landing.module.css';

const W = 1328;

const CARDS = [
  { label: 'jado-flow', ax: 664, ay: 448, title: 'Picks the route', sub: 'Stage, involvement, budget', cx: 664, cy: 671, glow: 'var(--glow-blue-mid)' },
  { label: 'UX agent', ax: 624, ay: 100, title: 'Paths and words', sub: 'Research, flows, content', cx: 445, cy: 100, glow: 'var(--glow-blue)' },
  { label: 'Visual agent', ax: 422, ay: 470, title: 'Art direction', sub: 'Palette, type, composition', cx: 235, cy: 671, glow: 'var(--glow-violet)' },
  { label: 'Frontend agent', ax: 882, ay: 482, title: 'System and build', sub: 'Tokens, UI, motion', cx: 1093, cy: 671, glow: 'var(--glow-blue-soft)' },
  { label: 'UX reviewer', ax: 130, ay: 166, title: 'Tests the paths', sub: 'Tasks, states, accessibility', cx: 139, cy: 75, glow: 'var(--glow-pink)' },
  { label: 'Visual reviewer', ax: 1203, ay: 172, title: 'Checks the\u00a0captures', sub: 'Captures against direction', cx: 1189, cy: 75, glow: 'var(--glow-coral)' },
];

// start (dot), path, end (ring); ring radius 10, last one 11 (central statue)
const LINKS = [
  { d: 'M130 132 V158', dot: [130, 126], end: [130, 166], r: 10 },
  { d: 'M1203 132 V164', dot: [1203, 126], end: [1203, 172], r: 10 },
  { d: 'M566 100 H616', dot: [560, 100], end: [624, 100], r: 10 },
  { d: 'M300 614 V482 Q300 470 312 470 H414', dot: [300, 620], end: [422, 470], r: 10 },
  { d: 'M1028 614 V494 Q1028 482 1016 482 H890', dot: [1028, 620], end: [882, 482], r: 10 },
  { d: 'M664 614 V458', dot: [664, 620], end: [664, 448], r: 11 },
];

type Pop = { left: number; top: number; ox: number; oy: number; line: Array<[number, number]> | null };

const ORDER = [4, 2, 1, 0, 3, 5]; // hotspot order follows the figures, left to right

/** Two concentric rings with one of them lit: the legend's pictogram for the piazza's inner and outer ring. */
function RingIcon({ lit }: { lit: 'inner' | 'outer' }) {
  return (
    <svg className={s.ringIcon} data-lit={lit} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle className={s.ringOuter} cx="10" cy="10" r="8.25" />
      <circle className={s.ringInner} cx="10" cy="10" r="3.75" />
    </svg>
  );
}

export function Roles() {
  const stage = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const hotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const uid = useId();
  const popId = `${uid}-pop`;
  const [active, setActive] = useState<number | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const apply = () => el.style.setProperty('--s', String(Math.min(1, el.clientWidth / W)));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Anchor the popover near the active hotspot and keep it inside the strip.
  const place = useCallback(() => {
    const box = layer.current;
    const popEl = popRef.current;
    const hot = active === null ? null : hotRefs.current[active];
    if (!box || !popEl || !hot || box.offsetParent === null) {
      setPop(null);
      return;
    }
    const b = box.getBoundingClientRect();
    const h = hot.getBoundingClientRect();
    const hx = h.left + h.width / 2 - b.left;
    const hy = h.top + h.height / 2 - b.top;
    const pw = popEl.offsetWidth;
    const ph = popEl.offsetHeight;
    const dot = 11; // connector starts at the dot edge
    const gap = dot + 48; // popover edge sits ~48px from the dot edge
    const room = 48; // the popover may hang below the strip, over the legend
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const others = hotRefs.current
      .filter((el, i) => el && i !== active)
      .map((el) => {
        const r = el!.getBoundingClientRect();
        return { l: r.left - b.left - 6, t: r.top - b.top - 6, r: r.right - b.left + 6, b: r.bottom - b.top + 6 };
      });
    // Central bust: roughly the centre 30% x middle 40% of the art. Popovers and connectors avoid it.
    const bust = { l: b.width * 0.35, r: b.width * 0.65, t: b.height * 0.3, b: b.height * 0.7 };
    const hitsBust = (l: number, t: number, w: number, hgt: number) =>
      Math.min(l + w, bust.r) - Math.max(l, bust.l) > 0 && Math.min(t + hgt, bust.b) - Math.max(t, bust.t) > 0;

    // Beside first, then above, then below; the scan at the end is a last resort.
    const wants: Array<{ left: number; top: number; base: number }> = [
      { left: hx + gap, top: hy - ph / 2, base: 0 },
      { left: hx - gap - pw, top: hy - ph / 2, base: 0 },
      { left: hx - pw / 2, top: hy - gap - ph, base: 6 },
      { left: hx + gap, top: hy - gap - ph + 20, base: 8 },
      { left: hx - gap - pw, top: hy - gap - ph + 20, base: 8 },
      { left: hx - pw / 2, top: hy + gap, base: 40 },
      { left: hx + gap, top: hy + 10, base: 30 },
      { left: hx - gap - pw, top: hy + 10, base: 30 },
    ];
    for (let sx = 8; sx <= b.width - pw - 8; sx += 12) {
      for (let sy = 8; sy <= b.height + room - ph - 8; sy += 12) wants.push({ left: sx, top: sy, base: 150 });
    }
    let best: { left: number; top: number; score: number } | null = null;
    for (const want of wants) {
      const left = clamp(want.left, 8, Math.max(8, b.width - pw - 8));
      const top = clamp(want.top, 8, Math.max(8, b.height + room - ph - 8));
      const nx = clamp(hx, left, left + pw);
      const ny = clamp(hy, top, top + ph);
      const len = Math.hypot(nx - hx, ny - hy) - dot;
      let score = want.base + Math.max(0, 40 - len) * 10 + Math.max(0, len - 60) * 2.5;
      score += Math.abs(left - want.left) * 0.15 + Math.abs(top - want.top) * 0.15;
      for (const o of others) {
        const w = Math.min(left + pw, o.r) - Math.max(left, o.l);
        const hh = Math.min(top + ph, o.b) - Math.max(top, o.t);
        if (w > 0 && hh > 0) score += 20000 + w * hh;
      }
      const w0 = Math.min(left + pw, hx + 16) - Math.max(left, hx - 16);
      const h0 = Math.min(top + ph, hy + 16) - Math.max(top, hy - 16);
      if (w0 > 0 && h0 > 0) score += 5000;
      if (hitsBust(left, top, pw, ph)) score += 400;
      // the connector must not run through the bust
      for (let k = 1; k < 8; k++) {
        const px = hx + ((nx - hx) * k) / 8;
        const py = hy + ((ny - hy) * k) / 8;
        if (px > bust.l && px < bust.r && py > bust.t && py < bust.b) {
          score += 600;
          break;
        }
      }
      if (!best || score < best.score) best = { left, top, score };
    }
    const top = best!.top;
    let left = best!.left;
    const nx = clamp(hx, left, left + pw);
    const ny = clamp(hy, top, top + ph);
    const dist = Math.hypot(nx - hx, ny - hy) || 1;
    let line: Pop['line'] = [
      [hx + ((nx - hx) / dist) * dot, hy + ((ny - hy) / dist) * dot],
      [nx, ny],
    ];
    // A popover below the art gets an elbow that leaves the dot sideways and drops through a free lane,
    // so the dotted line never runs over the bust or another hotspot.
    if (top > hy + dot) {
      const blocked = (px: number, py: number) =>
        (px > bust.l && px < bust.r && py > bust.t && py < bust.b) ||
        others.some((o) => px > o.l - 6 && px < o.r + 6 && py > o.t - 6 && py < o.b + 6);
      const clear = (x1: number, y1: number, x2: number, y2: number) => {
        const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4));
        for (let k = 0; k <= n; k++) if (blocked(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n)) return false;
        return true;
      };
      if (!clear(hx, hy + dot, hx, top)) {
        // Search free lanes across the whole width, nearest first; the popover slides to meet the lane.
        const lanes: number[] = [];
        for (let x = 12; x <= b.width - 12; x += 4) lanes.push(x);
        lanes.sort((p, q) => Math.abs(p - hx) - Math.abs(q - hx));
        for (const x of lanes) {
          const pl = clamp(x - pw / 2, 8, Math.max(8, b.width - pw - 8));
          if (x < pl + 14 || x > pl + pw - 14) continue;
          const hitsOther = others.some((o) => Math.min(pl + pw, o.r) - Math.max(pl, o.l) > 0 && Math.min(top + ph, o.b) - Math.max(top, o.t) > 0);
          const sx = x > hx ? hx + dot : hx - dot;
          if (hitsOther || !clear(sx, hy, x, hy) || !clear(x, hy, x, top)) continue;
          left = pl;
          line = [[sx, hy], [x, hy], [x, top]];
          break;
        }
      }
    }
    setPop({ left, top, ox: hx - left, oy: hy - top, line });
  }, [active]);

  useLayoutEffect(() => {
    place();
    const box = layer.current;
    if (!box) return;
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [place]);

  // Escape and outside click close the popover.
  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActive(null);
    };
    const onDown = (event: PointerEvent) => {
      const t = event.target as Node;
      if (layer.current?.contains(t) || cardRefs.current.some((c) => c?.contains(t))) return;
      setActive(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [active]);

  const choose = (index: number, fromHotspot: boolean) => {
    setActive((cur) => (fromHotspot && cur === index ? null : index));
    if (fromHotspot) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      cardRefs.current[index]?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  const current = active === null ? null : CARDS[active];

  return (
    <section id="roles" className={`${s.section} ${s.roles}`} aria-labelledby="roles-title">
      <div className={s.wrap}>
        <div className={s.sectionHead} data-reveal="rise">
          <h2 id="roles-title" className={`${s.h2} ${s.h2Narrow}`}>
            <span className={s.hLine}>Three agents build.</span> <span className={s.hLine}>Two reviewers&nbsp;check.</span>
          </h2>
          <p className={s.lede}>
            The three agents share one contract and pass work along. The two reviewers stay read-only and step in when the stage calls for them.
          </p>
        </div>
        <div ref={stage} className={s.piazza} data-observe>
          <div className={s.piazzaArt} aria-hidden="true">
            <div className={s.piazzaContours} />
            <div className={s.piazzaInk}>
              <Image unoptimized src="/landing/roles-piazza.webp" alt="" fill sizes="(max-width: 900px) 100vw, 1328px" />
            </div>
            <svg className={s.connectors} viewBox="0 0 1328 830" fill="none">
              <defs>
                {LINKS.map((link, i) => (
                  <mask key={i} id={`roles-mask-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height="830">
                    <path
                      className={s.connMask}
                      d={link.d}
                      pathLength={1}
                      stroke="#fff"
                      strokeWidth="14"
                      style={{ '--i': i } as React.CSSProperties}
                    />
                  </mask>
                ))}
              </defs>
              <g>
                {LINKS.map((link, i) => (
                  <path
                    key={i}
                    d={link.d}
                    stroke="var(--cobalt)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="0 7"
                    mask={`url(#roles-mask-${i})`}
                  />
                ))}
              </g>
              <g>
                {LINKS.map((link, i) => (
                  <circle key={i} cx={link.dot[0]} cy={link.dot[1]} r="3" fill="var(--cobalt)" />
                ))}
              </g>
              {LINKS.map((link, i) => (
                <g key={i}>
                  <circle className={s.ping} cx={link.end[0]} cy={link.end[1]} r={link.r + 2} stroke="var(--cobalt)" strokeWidth="1.5" style={{ '--i': i } as React.CSSProperties} />
                  <g className={s.anchor} style={{ '--i': i } as React.CSSProperties}>
                    <circle cx={link.end[0]} cy={link.end[1]} r={link.r} fill="var(--glass-fill-faint)" stroke="var(--cobalt-edge)" strokeWidth="1.2" />
                    <circle cx={link.end[0]} cy={link.end[1]} r={link.r === 11 ? 6 : 5} fill="var(--cobalt)" stroke="var(--surface)" strokeWidth="2" />
                  </g>
                </g>
              ))}
            </svg>
          </div>

          {/* Narrow viewports: one hotspot per figure, one popover at a time. Hidden above 900px. */}
          <div ref={layer} className={s.hotLayer}>
            {pop?.line && active !== null ? (
              <svg className={s.hotLine} aria-hidden="true">
                <polyline points={pop.line.map((p) => p.join(',')).join(' ')} />
              </svg>
            ) : null}
            {ORDER.map((i, n) => {
              const card = CARDS[i];
              return (
                <button
                  key={card.label}
                  ref={(el) => {
                    hotRefs.current[i] = el;
                  }}
                  type="button"
                  className={s.hot}
                  data-active={active === i}
                  style={{ '--ax': card.ax, '--ay': card.ay, '--n': n } as React.CSSProperties}
                  aria-label={`Show ${card.label} card`}
                  aria-expanded={active === i}
                  aria-controls={popId}
                  onClick={() => choose(i, true)}
                >
                  <span className={s.hotDot} />
                </button>
              );
            })}
            <div
              ref={popRef}
              id={popId}
              role="dialog"
              aria-modal="false"
              aria-label={current ? `${current.label} card` : 'Role card'}
              hidden={active === null}
              className={s.pop}
              style={
                pop
                  ? ({ left: pop.left, top: pop.top, transformOrigin: `${pop.ox}px ${pop.oy}px`, visibility: 'visible' } as React.CSSProperties)
                  : undefined
              }
              key={active ?? 'none'}
            >
              {current ? (
                <article className={s.card} style={{ '--glow': current.glow } as React.CSSProperties}>
                  <span className={s.orbitLabel}>{current.label}</span>
                  <h3 className={s.orbitTitle}>{current.title}</h3>
                  <span className={s.orbitSub}>{current.sub}</span>
                </article>
              ) : null}
            </div>
          </div>

          <div className={s.cardsStack}>
            {CARDS.map((card, i) => (
              <div
                key={card.label}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={s.cardPos}
                data-active={active === i}
                style={{ '--cx': card.cx, '--cy': card.cy, '--i': i } as React.CSSProperties}
              >
                <article className={s.card} style={{ '--glow': card.glow } as React.CSSProperties}>
                  <span className={s.orbitLabel}>{card.label}</span>
                  <h3 className={s.orbitTitle}>{card.title}</h3>
                  <span className={s.orbitSub}>{card.sub}</span>
                </article>
                <button
                  type="button"
                  className={s.cardHit}
                  aria-pressed={active === i}
                  aria-label={`Show ${card.label} on the figures`}
                  onClick={() => choose(i, false)}
                />
              </div>
            ))}
          </div>

          <p className={s.legend}>
            <span className={s.legendPart}>
              <RingIcon lit="inner" />
              Agents on the inner ring make the work,
            </span>{' '}
            <span className={s.legendPart}>
              <RingIcon lit="outer" />
              reviewers on the outer ring check it from outside.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
