---
title: "Find your way and coordinate an assignment with JADO"
description: "Ask about JADO capabilities, resolve uncertainties and start the selected route."
status: "observed"
lastReviewed: "2026-10-02"
---

For a design assignment, use [jado-run](/docs/automation/skills/jado-run). The entry points to [jado-flow](/docs/automation/skills/jado-flow), which reads the [JADO router](/docs/jado/00-router) and consults [ask-jado](/docs/automation/skills/ask-jado) when a missing decision changes the route.

## Ask for advice at any stage

Invoke `ask-jado` to understand which skill, agent or workflow to use, compare alternatives or ask for the next step. It consults the complete catalog of the active JADO copy and reads relevant instructions: you do not need to remember skill names. It proposes a scoped activity when sufficient, or explains the suitable workflow and profile. It distinguishes catalog capabilities from tools and profiles actually available in the session.

For example: “We approved the moodboard: which skill helps me choose fonts, and who can apply it?” The answer provides rationale, links, expected outcome, prerequisites and the next step. Asking for advice, even with a complete brief, does not start execution. When you ask to proceed, `jado-flow` coordinates work within the received authorization.

## Resolve uncertainty during work

The model consults the same `ask-jado` when an important decision is missing. It starts from the selected assignment and packet, widening the catalog search only when needed. It reuses settled decisions and resolves facts from sources. Choices reserved for the user follow the involvement dial: in autopilot it takes the recommended default and marks it provisional, in checkpoints it holds the question for the next checkpoint, in pair it asks now. It returns the decision or question to the coordinator, who resumes from the current point with the same scope and budget.

## Coordinate the route

`jado-flow` reads the selected graph and coordinates native `jado-agent-*` profiles. The main agent resolves the stage, involvement and budget dials, then records the JADO root, route and revision, expected outcome, sources, owner, exclusive scope, budget and required evidence. Each agent receives this contract and applies its assigned skills. The five profiles can execute one procedure or combine several. Choose research according to the outcome: problem evidence, flow analysis, UI patterns or style references. The same source can support different procedures. A review-only request keeps the product and canvas read-only.

## Apply and verify skills

Map or procedure conditions indicate when a skill is needed. The specialist reads the instructions, applies them within its assigned scope and verifies the result. It explains inapplicable steps. If a required check fails, it fixes the issue within the stage's fix passes or delivers available evidence and identifies what remains.

`ask-jado` and `jado-flow` are repository-owned adaptations. Specialist skills retain their names and attribution; the catalog links instructions to read and the provenance of original materials.

[Method](/docs/jado) · [Roles](/docs/jado/roles) · [Configuration](/docs/jado/configuration)
