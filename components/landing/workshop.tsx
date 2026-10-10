import Image from 'next/image';
import { JadoWordmark } from '@/components/brand/jado-lockup';
import s from './landing.module.css';

/**
 * A keyword chip, same family as the Routes readout highlight. `n` orders the chips as they light up on scroll;
 * `tight` keeps the chip off the punctuation that follows.
 */
function Key({ children, n, tight }: { children: string; n: number; tight?: boolean }) {
  return (
    <span className={s.glassHl} data-tight={tight ? '' : undefined} style={{ '--k': n } as React.CSSProperties}>
      {children}
    </span>
  );
}

export function Workshop() {
  return (
    <section id="workshop" className={`${s.section} ${s.workshop}`} aria-labelledby="workshop-title">
      <div className={s.wrap}>
        <div className={s.sectionHead} data-reveal="rise">
          <h2 id="workshop-title" className={s.h2}>
            Every hand has a task.
          </h2>
        </div>
        <div className={s.stageWrap}>
          <div className={s.stage} data-observe>
            <div className={s.stageDots} aria-hidden="true" />
            <div className={s.parallax} aria-hidden="true">
              <div className={s.sinopia}>
                <Image unoptimized src="/landing/workshop-sinopia.webp" alt="" fill sizes="(min-width: 641px) 1700px, 945px" />
              </div>
            </div>
            <div className={s.stageContours} aria-hidden="true" />
            <div className={s.glassCard}>
              <JadoWordmark className={s.glassBrand} />
              <div className={s.lyreDisc}>
                <span>
                  <Image unoptimized src="/landing/lyre-carved-small.webp" alt="" fill sizes="164px" />
                </span>
              </div>
              <p className={s.glassText}>
                Ask for a page and JADO decides who <Key n={0} tight>researches</Key>, who <Key n={1} tight>designs</Key>, who{' '}
                <Key n={2}>builds</Key> and who <Key n={3} tight>reviews</Key>. You set how finished it gets, how often it asks and
                how much it spends.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
