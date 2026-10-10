---
name: jado-motion
description: "Define useful motion, implement an approved interaction or inspect animation behavior and performance within an assigned phase."
disable-model-invocation: true
---

# Motion

<!-- Generated from jado/agents.json. Do not edit. -->

Record the assigned phase: design-only, implementation or review. First identify the user benefit and interaction frequency; keep a static response when motion adds no value. Specify trigger, states, duration, easing, interruption, focus continuity and reduced-motion fallback. Implementation uses the existing stack and is checked in the browser in normal, interrupted and reduced-motion states. Review stays read-only. review-animations runs only when the user invokes it.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `emil-design-eng` (`skills/emil-design-eng/SKILL.md`): Motion decisions or implementation.
- `find-animation-opportunities` (`skills/find-animation-opportunities/SKILL.md`): A scoped discovery proposal is assigned.
- `animation-vocabulary` (`skills/animation-vocabulary/SKILL.md`): An effect needs a precise name.
- `improve-animations` (`skills/improve-animations/SKILL.md`): An audit of existing animations is assigned with its delegation budget.
- `fixing-motion-performance` (`skills/fixing-motion-performance/SKILL.md`): Animation is implemented or performance is in scope.

## Scope and handoff

Write scope: Design-only: assigned motion specification. Implementation: assigned code. Review: read-only product and canvas.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
