---
title: "Dials, modes and limits"
description: "Stage, involvement and budget shape every run; execution modes choose who does the work."
status: "proposed"
lastReviewed: "2026-10-06"
---

The workflow defines activities, conditions, outcomes and checks. Three dials decide how much rigor, how much of your attention and how many resources a run spends. Their values live in `jado/policies/method.json` and reach agents through `jado/runtime/index.json`.

## Stage: how mature the design is

| | explore | refine | ship |
| --- | --- | --- | --- |
| Purpose | Find a direction fast | Mature the selected direction | Production quality |
| Variants by default | 4 | 2 | 1 |
| Fidelity | Real content, rough type and color | Project tokens, relevant states | Production, accessibility, edge states |
| Self-check | Broken text, clipping, overlaps, missing content | Full canvas or browser check | Full checks |
| Fix passes per artifact | 1 | 2 | 3 |
| Independent review | None | With a normal or deep budget | Required |
| Evidence | In the handoff | Handoff with captures | Persisted in the product repository |

A **fix pass** is one batch of edits, one fresh capture and one check. At the cap, the agent stops and lists the remaining issues instead of polishing. Captures happen after each visual group, not after every write, and an unchanged artifact is never reviewed twice. Routes encode the stage in their maps: dashed arrows, such as "self-check only", exist only in the stages they name, and the compiler rejects any path that skips a review in a stage where it is required.

When the stage is not stated, JADO infers it: ideas, options or moodboards mean explore; a selected direction means refine; production code or release means ship.

## Involvement: when JADO asks you

| Value | Behavior |
| --- | --- |
| autopilot | No questions during the run. JADO decides within scope, records each choice in a decision log with the alternatives considered, and marks your choices (such as the selected variant) as provisional. It stops only for irreversible actions, scope expansion or missing access. |
| checkpoints (default) | Questions only at checkpoints: an open direction after framing, variant selection, and before moving to the next stage or to code. Up to four questions per checkpoint. |
| pair | Questions before each taste or direction decision, with intermediate results. |

Only the main agent asks you, with the native question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex when available). Each question offers 2–4 options with the recommended one first. Delegated agents cannot ask you: they continue on a reversible default, mark it provisional and return the question.

## Budget: how much to spend

| | lean | normal | deep |
| --- | --- | --- | --- |
| New delegations | 1, reserved for a required review | 4 | 8 |
| Repair batches | 1 | 1 | 2 |
| Default mode | solo | macro | macro |
| Model tier | fast | profile default | strong |

The effective limit is the lower of the budget and the route cap shown on each route page. The model tier is passed as a per-call override when the delegation tool supports one (in Claude Code, `fast` maps to Sonnet and `strong` to Opus); otherwise the profile default applies.

## Set defaults and change dials

Add a line to the project instructions:

```text
JADO defaults: stage=explore involvement=autopilot budget=lean
```

A request overrides the defaults, and a message such as `jado: pair` or `jado: deep` changes a dial from the next step on. Every delivery ends with a run summary (route, dials, delegations, fix passes, questions, outcome). When project instructions name a JADO run log file, the summary is appended there, which lets you tune the dials on real runs.

## Execution modes

| Mode | Executors | Use |
| --- | --- | --- |
| solo | Main agent | Procedures in the current context; only a required independent review is delegated |
| macro | Main agent or UX, Visual and Frontend | Activities grouped by domain, in ordered stages |
| specialists | Separate instances of the five profiles | One procedure per assignment, on request or for a council |

The mode follows the budget unless you name it. In macro, `jado-agent-ux` groups research, UX architecture and content; `jado-agent-visual` groups reference research, art direction and visual design; `jado-agent-frontend` groups design systems, implementation, motion and engineering. Council proposals keep distinct contexts even when they share a profile.

## Resolve a run

At the start of a run, `jado-flow` runs a small resolver that ships with every installed copy:

```sh
node <jadoRoot>/.agents/skills/jado-flow/scripts/resolve.mjs --route R05 --stage explore --project <product root>
```

It applies the request, the project's `JADO defaults:` line and the policy defaults in that order, rejects a stage the route does not support, and prints the run's limits: variants, fidelity, self-check, fix passes, review requirement, evidence level, delegations (the lower of the budget and the route cap), mode and model tier. The agent pastes those limits into the contract instead of computing them.

## Plan a run in the source checkout

```sh
npm run jado:plan -- --workflow R05 --stage explore --budget lean
npm run jado:plan -- --workflow R04 --stage ship --budget normal
npm run jado:plan -- --workflow R07 --stage refine --mode macro --selection /tmp/plan.json
```

A plan without selections is `candidate`. `--selection file.json` accepts `branches` (invocation-path/node key, selected edge IDs as values), `availableProfiles`, `availableTools`, `delegationBudget` and `stage`. Edge IDs come from the candidate plan and the packet. A plan becomes `resolved` only with explicit branches and capabilities, within budget; it describes a consistent selection, not execution evidence.

Example: a UX artifact only in R07, main agent as author, zero delegations:

```json
{"author":"primary","stage":"refine","branches":{"R07/brief":["brief-decide"],"R07/result":["result-ux_verify"],"R07/ux_gate":["ux_gate-ux_done"]},"availableProfiles":[],"availableTools":[],"delegationBudget":0}
```

## Outcomes and resumption

Record `stopAfter`, artifact, change, constraints, decisions, author and verification in the contract; a micro-change keeps it in the message. R07 has distinct UX, canvas and code exits, each with its own gate.

A checkpoint preserves the method revision, artifact, valid decisions, missing checks, remaining budget and next action. Resume with the same author; revalidate only changed dependencies. The budget does not reset.

For artifacts, use [jado-ux-artifacts](/docs/automation/skills/jado-ux-artifacts); for an assigned extended baseline, use [jado-ux-traceability](/docs/automation/skills/jado-ux-traceability). The root in new projects is `docs/ux/`.

[Roles](/docs/jado/roles) · [Configuration](/docs/jado/configuration)
