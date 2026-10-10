'use client';

import { Fragment, useEffect, useId, useRef, useState } from 'react';
import {
  BUDGETS,
  BUDGET_LABELS,
  INVOLVEMENTS,
  INVOLVEMENT_LABELS,
  STAGES,
  STAGE_LABELS,
  STAGE_LETTERS,
  availabilityNote,
  chainMarkers,
  columnSummary,
  joinNames,
  readoutSegments,
  runsAt,
  stageNames,
  stageSummary,
  type Budget,
  type Dials,
  type Involvement,
  type RouteModel,
  type RoutesModel,
  type Stage,
} from './routes-model';
import s from './landing.module.css';

/* ---------- Dial bar ---------- */

type DialProps<T extends string> = {
  name: string;
  label: string;
  values: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  variant?: 'stage';
};

/** A segmented radio group: native radios, so arrow keys move and check, one tab stop. */
function Dial<T extends string>({ name, label, values, labels, value, onChange, variant }: DialProps<T>) {
  const labelId = useId();
  return (
    <div className={s.dialGroup} data-variant={variant}>
      <span id={labelId} className={s.dialLabel}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={s.dialTrack}>
        {values.map((item) => (
          <label key={item} className={s.dialOpt}>
            <input
              type="radio"
              className={s.dialInput}
              name={name}
              value={item}
              checked={value === item}
              onChange={() => onChange(item)}
            />
            <span className={s.dialFace} data-text={labels[item]}>
              {labels[item]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- Readout ---------- */

/** A dial-dependent fragment. It pulses and fades in when its text changes; static words never do. */
function HlFragment({ text, tight }: { text: string; tight: boolean }) {
  const previous = useRef(text);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;
    setGeneration((g) => g + 1);
  }, [text]);
  return (
    <span key={generation} className={s.hl} data-fx={generation > 0 ? '' : undefined} data-tight={tight ? '' : undefined}>
      <span className={s.hlText}>{text}</span>
    </span>
  );
}

function Readout({ route, dials, model }: { route: RouteModel; dials: Dials; model: RoutesModel }) {
  const segments = readoutSegments(route, dials, model);
  return (
    <p className={s.readout}>
      {segments.map((segment, i) =>
        typeof segment === 'string' ? (
          <Fragment key={`t${i}`}>{segment}</Fragment>
        ) : (
          <HlFragment key={segment.id} text={segment.text} tight={/^[,.:;]/.test(String(segments[i + 1] ?? ''))} />
        ),
      )}
    </p>
  );
}

/* ---------- Route detail ---------- */

function Chain({ route, dials, model }: { route: RouteModel; dials: Dials; model: RoutesModel }) {
  const markers = chainMarkers(route, dials, model);
  return (
    <div className={s.chainBlock}>
      <p className={s.eyebrow}>What runs</p>
      <ol className={s.chain} aria-label="Steps">
        {route.chain.map((step, i) => {
          const marker = markers[i];
          const splitHere = route.chain.length >= 5 && step.kind === 'review';
          return (
            <li key={step.label} style={{ display: 'contents' }}>
              {splitHere ? <span className={s.rowBreak} aria-hidden="true" /> : null}
              <span className={s.stepUnit}>
                <span className={s.link} aria-hidden="true" />
                <span className={s.stepCol}>
                  {marker ? (
                    <span className={s.marker} data-ask={marker.ask} data-tone={marker.dot ? 'dot' : 'plain'}>
                      {marker.dot ? <i className={s.markerDot} data-hollow={marker.hollow ? '' : undefined} aria-hidden="true" /> : null}
                      {marker.text}
                    </span>
                  ) : null}
                  <span
                    className={`${s.step2} ${step.kind === 'review' ? s.step2Review : ''} ${step.kind === 'end' ? s.step2End : ''}`}
                    data-ask={marker?.ask && marker.dot ? 'true' : undefined}
                  >
                    {step.label}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Panel({
  route,
  open,
  id,
  labelledBy,
  dials,
  model,
  onStage,
}: {
  route: RouteModel;
  open: boolean;
  id: string;
  labelledBy: string;
  dials: Dials;
  model: RoutesModel;
  onStage: (stage: Stage) => void;
}) {
  const runs = runsAt(route, dials.stage);
  const names = stageNames(route.stages);
  return (
    <div id={id} role="region" aria-labelledby={labelledBy} className={s.panel} data-open={open} inert={!open}>
      <div className={s.panelClip}>
        <div className={s.panelBody} data-unavailable={runs ? undefined : ''}>
          {runs ? (
            <>
              <Readout route={route} dials={dials} model={model} />
              <Chain route={route} dials={dials} model={model} />
              <div className={s.mustPass}>
                <p className={s.eyebrow}>Must pass</p>
                <ul className={s.chips}>
                  {route.mustPass.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className={s.detailText}>{route.text}</p>
            </>
          ) : (
            <p className={s.availability}>
              {route.name} runs at {joinNames(names)}. Switch the stage to{' '}
              {route.stages.map((stage, i) => (
                <Fragment key={stage}>
                  {i > 0 ? ' or ' : null}
                  <button type="button" className={s.stageLink} onClick={() => onStage(stage)}>
                    {STAGE_LABELS[stage]}
                  </button>
                </Fragment>
              ))}{' '}
              to see how it runs with your settings.
            </p>
          )}
          {route.code ? <p className={s.playbook}>Playbook {route.code}</p> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- Matrix ---------- */

function barPhrase(route: RouteModel): string {
  const runs = stageNames(route.stages);
  const skips = STAGES.filter((stage) => !runsAt(route, stage)).map((stage) => STAGE_LABELS[stage]);
  return skips.length ? `Runs at ${joinNames(runs)}, not at ${joinNames(skips)}` : 'Runs at every stage';
}

export function Routes({ model }: { model: RoutesModel }) {
  const uid = useId();
  const [stage, setStage] = useState<Stage>('explore');
  const [involvement, setInvolvement] = useState<Involvement>('checkpoints');
  const [budget, setBudget] = useState<Budget>('normal');
  const [openId, setOpenId] = useState<string | null>('R05');
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const firstRender = useRef(true);

  const dials: Dials = { stage, involvement, budget };
  const columns = STAGES.map((st) => columnSummary(st, budget, model));
  const active = columns[STAGES.indexOf(stage)];
  const openIndex = model.routes.findIndex((r) => r.id === openId);

  // The active stage is announced once per stage change, not on load and not per fragment.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setAnnouncement(`${active.label}, ${active.routes}`);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the clicked header where the pointer is while another panel collapses above it.
  const toggle = (route: string, open: boolean, button: HTMLButtonElement) => {
    const before = button.getBoundingClientRect().top;
    setOpenId(open ? null : route);
    let frame = 0;
    let start = -1;
    const stop = () => cancelAnimationFrame(frame);
    const cancel = () => {
      stop();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    };
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchmove', cancel, { passive: true, once: true });
    const tick = (now: number) => {
      if (start < 0) start = now;
      const delta = button.getBoundingClientRect().top - before;
      if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
      if (now - start < 560) frame = requestAnimationFrame(tick);
      else cancel();
    };
    frame = requestAnimationFrame(tick);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-route]') ?? []);
    const at = buttons.indexOf(event.currentTarget);
    let next = at;
    if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, at + 1);
    if (event.key === 'ArrowUp') next = Math.max(0, at - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    event.preventDefault();
    buttons[next]?.focus();
  };

  // The stage link sits inside the opened route; the route stays open and keeps focus.
  const switchStage = (next: Stage, routeId: string) => {
    setStage(next);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`button[data-route="${routeId}"]`)?.focus());
  };

  return (
    <section id="routes" className={`${s.section} ${s.routes}`} aria-labelledby="routes-title">
      <div className={s.wrap}>
        <div className={s.sectionHead} data-reveal="rise">
          <h2 id="routes-title" className={s.h2}>
            Eight routes. One graph.
          </h2>
          <p className={s.lede}>
            Set the stage, your involvement and the budget. The matrix marks the routes that stage allows. Open one to see how it runs with your
            settings.
          </p>
        </div>

        <div className={s.dials} data-reveal="fade">
          <Dial name={`${uid}-stage`} label="Stage" values={STAGES} labels={STAGE_LABELS} value={stage} onChange={setStage} variant="stage" />
          <span className={s.dialSep} aria-hidden="true" />
          <Dial name={`${uid}-involvement`} label="Involvement" values={INVOLVEMENTS} labels={INVOLVEMENT_LABELS} value={involvement} onChange={setInvolvement} />
          <span className={s.dialSep} aria-hidden="true" />
          <Dial name={`${uid}-budget`} label="Budget" values={BUDGETS} labels={BUDGET_LABELS} value={budget} onChange={setBudget} />
        </div>
        <p className={s.srOnly} role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        <div className={s.mSummary}>
          <p className={s.mStage}>{stageSummary(stage, model)}</p>
          <p className={s.mLine}>
            {active.options} · {active.review}
          </p>
          <ul className={s.mKey} aria-label="Key">
            <li>
              <i className={s.swatch} data-state="active" aria-hidden="true" />
              Runs at {STAGE_LABELS[stage]}
            </li>
            <li>
              <i className={s.swatch} data-state="other" aria-hidden="true" />
              Another stage
            </li>
            <li>
              <i className={s.swatch} data-state="none" aria-hidden="true" />
              Doesn&apos;t run
            </li>
          </ul>
        </div>

        <div className={s.matrix} style={{ '--stage-i': STAGES.indexOf(stage) } as React.CSSProperties} data-observe>
          <div className={s.mHead} data-before-open={openIndex === 0}>
            <span className={s.tintHead} aria-hidden="true" />
            <span className={s.mHeadRoute}>Route</span>
            {columns.map((col) => (
              <div key={col.stage} className={s.colHead} data-active={col.stage === stage}>
                <p className={s.colTitle}>
                  <span className={s.colName}>{col.label}</span>
                  <span className={s.colCount}>{col.routes}</span>
                </p>
                <p className={s.colLine}>{col.options}</p>
                <p className={s.colLine}>{col.review}</p>
              </div>
            ))}
            <span className={s.letters}>
              {STAGES.map((st) => (
                <span
                  key={st}
                  className={s.letter}
                  role="img"
                  aria-label={STAGE_LABELS[st]}
                  aria-current={st === stage ? 'true' : undefined}
                  data-active={st === stage}
                >
                  {STAGE_LETTERS[st]}
                </span>
              ))}
            </span>
          </div>

          <div className={s.listWrap}>
            <span className={s.tintBody} aria-hidden="true" />
            <ul ref={listRef} className={s.list}>
              {model.routes.map((route, i) => {
                const open = route.id === openId;
                const runs = runsAt(route, stage);
                const note = availabilityNote(route);
                const panelId = `${uid}-panel-${route.id}`;
                const buttonId = `${uid}-btn-${route.id}`;
                const useId2 = `${uid}-use-${route.id}`;
                const barId = `${uid}-bar-${route.id}`;
                return (
                  <li
                    key={route.id}
                    className={s.row}
                    data-open={open}
                    data-unavailable={runs ? undefined : ''}
                    data-before-open={openIndex === i + 1}
                  >
                    <h3 className={s.rowHead}>
                      <button
                        id={buttonId}
                        type="button"
                        data-route={route.id}
                        className={s.rowBtn}
                        aria-expanded={open}
                        aria-controls={panelId}
                        aria-label={runs || !note ? route.name : `${route.name}, ${note}`}
                        aria-describedby={`${useId2} ${barId}`}
                        onClick={(event) => toggle(route.id, open, event.currentTarget)}
                        onKeyDown={onKeyDown}
                      >
                        <span className={s.cInfo}>
                          <span className={s.cText}>
                            <span className={s.cNameLine}>
                              <span className={s.cName}>{route.name}</span>
                              {!runs && note ? <span className={s.pill} aria-hidden="true">{note}</span> : null}
                            </span>
                            <span id={useId2} className={s.cUse}>
                              {route.use}
                            </span>
                          </span>
                          <span className={s.cIcon} aria-hidden="true" />
                        </span>
                        {STAGES.map((st, c) => {
                          const here = runsAt(route, st);
                          const start = here && !runsAt(route, STAGES[c - 1]);
                          const end = here && !runsAt(route, STAGES[c + 1]);
                          return (
                            <span key={st} className={s.cell} aria-hidden="true" data-start={start || undefined} data-end={end || undefined}>
                              {here ? (
                                <span className={s.seg} data-active={st === stage} data-start={start} data-end={end} data-label={start}>
                                  {start ? route.surface : null}
                                </span>
                              ) : null}
                            </span>
                          );
                        })}
                        <span id={barId} className={s.mini} role="img" aria-label={barPhrase(route)}>
                          {STAGES.map((st) => (
                            <i key={st} data-state={!runsAt(route, st) ? 'none' : st === stage ? 'active' : 'other'} />
                          ))}
                        </span>
                      </button>
                    </h3>
                    <Panel
                      route={route}
                      open={open}
                      id={panelId}
                      labelledBy={buttonId}
                      dials={dials}
                      model={model}
                      onStage={(next) => switchStage(next, route.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
