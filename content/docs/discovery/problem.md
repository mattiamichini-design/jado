---
title: "Frame the problem"
description: "From a request to a design brief with evidence, constraints and questions."
status: "proposed"
lastReviewed: "2026-09-30"
stage: "discovery"
workflow: true
tools: ["coding-agents"]
skills: ["jado-researcher", "jado-ux-artifacts"]
agents: ["jado-agent-ux"]
inputs: ["Request", "Context and sources"]
outputs: ["Design brief", "Evidence and hypothesis log"]
---

## When to use it

At the start of a new initiative or when a UI request contains an ambiguous need. This procedure is a proposal to adapt to the project context.

## Procedure

1. Gather the product goal, affected users, usage scenario and constraints. Use `ask-jado` if a missing decision changes the research question; record the answer in the brief.
2. Observe the current experience and consult available evidence: existing research, feedback, requests and accessible data. Record provenance and limitations.
3. Distinguish observed facts, decisions, constraints, hypotheses and questions. Do not turn a suggested solution into a demonstrated need.
4. Define which questions require research with people and which can be addressed through documentary research or [competitor analysis](/docs/discovery/competitors).
5. Write the desired outcome, exclusions and the criterion for recognizing improvement.
6. Share the brief with stakeholders and proceed to [experience definition](/docs/definition/feature).

## Output

A brief with the problem, actor, context, evidence, constraints, expected impact and questions. Each important hypothesis indicates how it could be verified.

## Completion criterion

The group shares the design question and knows which parts remain uncertain. If interviews or data are missing, say so: do not invent people, emotions, metrics or quotes to fill a field.

References: [Documentary research](/docs/automation/skills/jado-researcher), [UX Planner](/docs/automation/skills/jado-ux-artifacts) and [templates](/docs/templates).
