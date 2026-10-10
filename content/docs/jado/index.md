---
title: "JADO: method, graph and agents"
description: "Just Another Design Orchestrator: playbook and method configuration in the same repository."
status: "observed"
lastReviewed: "2026-10-10"
---

JADO brings together the design method, [playbook](/docs/operating-model/end-to-end), Mermaid maps, skills and agent profiles. The graph in `jado/workflows.json` feeds Mermaid maps and agent instructions. Maps describe the method; source files define its behavior.

## Start a run

Start `jado-run` with the request and project context. `ask-jado` answers questions about skills, agents, workflows and next steps without starting work; `jado-flow` resolves the [route](/docs/jado/00-router) and coordinates the agents.

Every run is shaped by three dials. Name them in the request, set project defaults, or let JADO infer them; you can change them mid-run with a short message such as `jado: autopilot`.

| Dial | Values | What it changes |
| --- | --- | --- |
| Stage | explore · refine · ship | Variant count, fidelity, fix passes, whether an independent review is required, evidence level |
| Involvement | autopilot · checkpoints · pair | When JADO asks you, using the native question tool |
| Budget | lean · normal · deep | Delegations, repair batches, execution mode and model tier |

```text
Use jado-run: explore, autopilot, lean. Six hero directions for the pricing page in Paper.
Use jado-run: refine, checkpoints. Develop option B with our tokens.
Use jado-run: ship, normal. Implement the selected canvas.
```

[Dials, modes and limits](/docs/jado/execution) explains the values and the caps that keep loops short.

## Choose the route

| Route | When to use it | Stages |
| --- | --- | --- |
| [R01 · Patch](/docs/jado/r01) | A precise fix in code or Paper | any |
| [R03 · Decide with the user](/docs/jado/r03) | An open decision you want to make yourself | explore, refine |
| [R04 · Build](/docs/jado/r04) | Code from an approved direction or a selected canvas | refine, ship |
| [R05 · Explore alternatives](/docs/jado/r05) | Comparable Paper options to choose from | explore, refine |
| [R07 · Staged delivery](/docs/jado/r07) | One mandate across UX, canvas and code up to a stopAfter | any |
| [R08 · Council](/docs/jado/r08) | Competing perspectives on one consequential decision | explore, refine |
| [R09 · VariantHub](/docs/jado/r09) | Code alternatives, only when you name VariantHub | explore, refine |
| [Visual research](/docs/jado/visual-research) | UI patterns, style references or a moodboard | explore, refine |
| [Setup](/docs/jado/setup-project) | Install, link or update JADO in a project | any |

Paper is the preferred canvas; VariantHub enters only on explicit request. [Roles](/docs/jado/roles) describes the three operational profiles and the two independent reviewers.

## Shared rules

The main agent records a contract with route and revision, JADO root, dials and their limits, goal, sources, owner, scope, decisions and remaining budget, and passes it to the agents it delegates to. Agents apply only the skills whose conditions match their assignment.

Only `jado-run`, `ask-jado` and `jado-install` trigger automatically; `jado-flow` and the procedures stay user-invoked and load by path from the selected route, so their descriptions cost nothing in unrelated sessions.

Only one author changes a shared artifact during a stage; independent outcomes can run in parallel. An independent reviewer works read-only on the latest revision. Loops are capped: each artifact gets the stage's fix passes, and at the cap the agent delivers with the remaining issues listed. Only the main agent asks you questions; delegated agents return them with a recommended default.

## Read and change a map

Read Mermaid diagrams from top to bottom: nodes describe steps, arrows describe conditions, dashed arrows exist only in the stages they name, and loops describe corrections within budget. Below each map are instructions and procedure links. The repository's `jado/README.md` index collects the same diagrams.

To change a skill, condition or connection, assign a method change to the AI. The change takes place in versioned sources, is compiled and verified, and goes through a PR. Protected checks and the stages in which they apply live in `jado/policies/guards.json`; dial values live in `jado/policies/method.json`.

## Method sources

`jado/agents.json` defines the five profiles and the procedures, each with its conditional skills. `.agents/skills/` contains the JADO-owned procedures and skills. The lock and inventory contain references and attribution for external dependencies downloaded during installation and refresh.

[Configuration and portability](/docs/jado/configuration) · [Roles](/docs/jado/roles) · [Architecture](/docs/governance/architecture)
