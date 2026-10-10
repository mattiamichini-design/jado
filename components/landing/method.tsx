import Image from 'next/image';
import s from './landing.module.css';

const STEPS = [
  {
    n: '01',
    mob: { x: '6%', w: '88%' },
    title: 'Clarify',
    text: 'Record the goal, the scope and the three dials before anyone draws.',
    leaves: 'A shared brief',
    img: '/landing/method-clarify.webp',
    box: { x: '0.96%', y: '0.75%', w: '98.1%', h: '96.25%' },
    gradient:
      'radial-gradient(ellipse 70% 55% at 50% 42% in oklab, oklab(67.6% 0.072 -0.174 / 42%) 0%, oklab(67.6% 0.072 -0.174 / 0%) 70%), radial-gradient(ellipse 60% 50% at 30% 85% in oklab, oklab(80.7% 0.129 -0.077 / 40%) 0%, oklab(80.7% 0.129 -0.077 / 0%) 70%)',
  },
  {
    n: '02',
    mob: { x: '10.29%', w: '80%' },
    title: 'Route',
    text: 'jado-flow picks the smallest route that fits and keeps it through every handoff.',
    leaves: 'A work contract',
    img: '/landing/method-route.webp',
    box: { x: '5.73%', y: '1.75%', w: '89.2%', h: '87.5%' },
    gradient:
      'radial-gradient(ellipse 70% 55% at 55% 45% in oklab, oklab(78.4% 0.102 0.08 / 38%) 0%, oklab(78.4% 0.102 0.08 / 0%) 70%), radial-gradient(ellipse 60% 50% at 20% 20% in oklab, oklab(67.6% 0.072 -0.174 / 35%) 0%, oklab(67.6% 0.072 -0.174 / 0%) 70%)',
  },
  {
    n: '03',
    mob: { x: '15.71%', w: '74.3%' },
    title: 'Make',
    text: 'Each role researches, designs, writes or builds inside its own scope.',
    leaves: 'Artboards or code',
    img: '/landing/method-make.webp',
    box: { x: '11.8%', y: '9.5%', w: '82.8%', h: '81.5%' },
    gradient:
      'radial-gradient(ellipse 70% 55% at 50% 45% in oklab, oklab(80.7% 0.129 -0.077 / 42%) 0%, oklab(80.7% 0.129 -0.077 / 0%) 70%), radial-gradient(ellipse 60% 50% at 80% 85% in oklab, oklab(55.7% -0.006 -0.244 / 25%) 0%, oklab(55.7% -0.006 -0.244 / 0%) 70%)',
  },
  {
    n: '04',
    mob: { x: '8%', w: '81.4%' },
    title: 'Verify',
    text: "The stage sets the checks, and Ship always adds a reviewer who didn't make the work. It's done when the evidence is there.",
    leaves: 'Evidence you can open',
    img: '/landing/method-verify.webp',
    box: { x: '-0.64%', y: '6.5%', w: '90.8%', h: '89%' },
    gradient:
      'radial-gradient(ellipse 70% 55% at 45% 45% in oklab, oklab(55.7% -0.006 -0.244 / 28%) 0%, oklab(55.7% -0.006 -0.244 / 0%) 70%), radial-gradient(ellipse 60% 50% at 75% 85% in oklab, oklab(78.4% 0.102 0.08 / 38%) 0%, oklab(78.4% 0.102 0.08 / 0%) 70%)',
  },
];

export function Method() {
  return (
    <section id="method" className={`${s.section} ${s.method}`} aria-labelledby="method-title">
      <div className={s.wrap}>
        <div className={s.sectionHead} data-reveal="rise">
          <h2 id="method-title" className={s.h2}>
            From brief to evidence.
          </h2>
          <p className={s.lede}>Four steps, always in this order. Each one leaves something the next step can read.</p>
        </div>
        <ol className={s.steps}>
          {STEPS.map((step, i) => (
            <li key={step.n} className={s.step} data-reveal="rise" style={{ '--i': i } as React.CSSProperties}>
              <div className={s.stepImg} style={{ '--g': step.gradient } as React.CSSProperties} aria-hidden="true">
                <div className={s.stepContours} />
                <div className={s.statueDrift}>
                  <div
                    className={s.statue}
                    style={{ '--x': step.box.x, '--y': step.box.y, '--w': step.box.w, '--h': step.box.h, '--mx': step.mob.x, '--mw': step.mob.w } as React.CSSProperties}
                  >
                    <Image unoptimized src={step.img} alt="" fill sizes="(min-width: 1100px) 310px, (min-width: 641px) 45vw, 350px" />
                  </div>
                </div>
              </div>
              <div className={s.stepBody}>
                <h3 className={s.stepTitle}>
                  <span className={s.stepNum}>{step.n}</span>
                  <span>{step.title}</span>
                </h3>
                <p className={s.stepText}>{step.text}</p>
              </div>
              <dl className={s.leaves}>
                <dt>Leaves</dt>
                <dd>{step.leaves}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
