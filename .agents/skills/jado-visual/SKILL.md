---
name: jado-visual
description: "Combine assigned visual research, art direction and canvas design in one context."
disable-model-invocation: true
---

# Visual Procedure

<!-- Generated from jado/agents.json. Do not edit. -->

Apply only the assigned activities in the current context, in dependency order, and follow each activity's skill. Reuse decisions and evidence; record why unassigned activities are skipped.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `jado-visual-researcher` (`.agents/skills/jado-visual-researcher/SKILL.md`): The contract assigns this activity.
- `jado-art-direction` (`.agents/skills/jado-art-direction/SKILL.md`): The contract assigns this activity.
- `jado-visual-designer` (`.agents/skills/jado-visual-designer/SKILL.md`): The contract assigns this activity.
- `jado-motion` (`.agents/skills/jado-motion/SKILL.md`): Interaction intent is assigned (design-only).

## Scope and handoff

Write scope: Assigned references, direction, moodboard and Paper nodes; one writer per document.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
