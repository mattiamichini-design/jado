---
name: jado-frontend
description: "Combine assigned design-system, UI implementation, motion and technical work in one context."
disable-model-invocation: true
---

# Frontend Procedure

<!-- Generated from jado/agents.json. Do not edit. -->

Apply only the assigned activities in the current context, in dependency order, and follow each activity's skill. Reuse decisions and evidence; record why unassigned activities are skipped.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `jado-design-systems` (`.agents/skills/jado-design-systems/SKILL.md`): The contract assigns this activity.
- `jado-ui-builder` (`.agents/skills/jado-ui-builder/SKILL.md`): The contract assigns this activity.
- `jado-motion` (`.agents/skills/jado-motion/SKILL.md`): The contract assigns this activity.
- `jado-ui-engineer` (`.agents/skills/jado-ui-engineer/SKILL.md`): The contract assigns this activity.

## Scope and handoff

Write scope: Assigned design-system and feature files, with exclusive phases per artifact.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
