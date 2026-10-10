---
name: jado-ux
description: "Combine assigned documentary research, UX architecture and content work in one context."
disable-model-invocation: true
---

# UX Procedure

<!-- Generated from jado/agents.json. Do not edit. -->

Apply only the assigned activities in the current context, in dependency order, and follow each activity's skill. Reuse decisions and evidence; record why unassigned activities are skipped.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `jado-researcher` (`.agents/skills/jado-researcher/SKILL.md`): The contract assigns this activity.
- `jado-ux-architect` (`.agents/skills/jado-ux-architect/SKILL.md`): The contract assigns this activity.
- `jado-content-designer` (`.agents/skills/jado-content-designer/SKILL.md`): The contract assigns this activity.
- `jado-visual-researcher` (`.agents/skills/jado-visual-researcher/SKILL.md`): A UI-pattern comparison supports the UX question.

## Scope and handoff

Write scope: Assigned research, UX artifacts and strings; product stays read-only during research.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
