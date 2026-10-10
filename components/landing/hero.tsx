import Image from 'next/image';
import { INSTALL_URL, PLAYBOOK_URL } from './constants';
import { BookIcon, ExternalIcon, GithubIcon } from './icons';
import s from './landing.module.css';

const TITLE = ['Every', 'agent', 'knows', 'its', 'part.'];
const FACTS = [
  { value: 8, label: 'Routes' },
  { value: 5, label: 'Roles' },
  { value: 4, label: 'Steps' },
];

const idx = (i: number) => ({ '--i': i }) as React.CSSProperties;

export function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroArt} aria-hidden="true">
        <div className={`${s.heroMesh} ${s.hMesh}`}>
          <Image unoptimized src="/landing/hero-mesh.webp" alt="" fill sizes="780px" priority />
        </div>
        <div className={`${s.contours} ${s.hContours}`} />
        <div className={`${s.heroLyre} ${s.hLyre}`}>
          <Image unoptimized src="/landing/lyre-carved.webp" alt="" fill sizes="(min-width: 641px) 350px, 260px" priority />
        </div>

        <div className={`${s.orbit} ${s.orbitRoute} ${s.hOrbit}`} style={idx(0)}>
          <span className={s.orbitLabel}>jado-flow</span>
          <span className={s.orbitTitle}>Route selected</span>
          <span className={s.orbitSub}>Explore alternatives</span>
        </div>
        <div className={`${s.orbit} ${s.orbitAgent} ${s.hOrbit}`} style={idx(1)}>
          <span className={s.orbitLabel}>Visual agent</span>
          <span className={s.orbitTitle}>Two options ready</span>
          <span className={s.orbitSub}>Same content, two structures</span>
        </div>
        <div className={`${s.orbit} ${s.orbitReview} ${s.hOrbit}`} style={idx(2)}>
          <i className={s.dot} />
          <span>Visual review · passed with evidence</span>
        </div>
      </div>

      <div className={s.heroText}>
        <h1 id="hero-title" className={s.title}>
          {TITLE.map((word, i) => (
            <span key={word}>
              <span className={s.w}>
                <span className={`${s.wi}`} style={idx(i)}>
                  {word}
                </span>
              </span>
              {i < TITLE.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>

        <div className={s.rule}>
          <span className={s.ruleLine} aria-hidden="true" />
          <p className={`${s.about} ${s.hRise}`} style={idx(0)}>
            JADO brings a design studio&apos;s order to your AI tools: a brief, a route, clear roles and a review before anything is called done.
          </p>
          <div className={`${s.facts} ${s.hRise}`} style={idx(1)}>
            <dl className={s.glass}>
              {FACTS.map((fact) => (
                <div key={fact.label} className={s.fact}>
                  <dt className={s.factLabel}>{fact.label}</dt>
                  <dd className={s.factNum} data-count={fact.value}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={`${s.ctas} ${s.hRise}`} style={idx(2)}>
            <a className={`${s.btn} ${s.btnDark}`} href={INSTALL_URL}>
              <GithubIcon />
              Install JADO
            </a>
            <a className={`${s.btn} ${s.btnGlass}`} href={PLAYBOOK_URL} target="_blank" rel="noopener">
              <BookIcon />
              Read the playbook
              <ExternalIcon />
              <span className={s.srOnly}> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
