---
name: jado-design-systems
description: "Map existing tokens and components to the target UI; apply layout guidance for the actual project stack."
disable-model-invocation: true
---

# Design Systems

<!-- Generated from jado/agents.json. Do not edit. -->

Inspect the existing styling system, tokens, component APIs and target UI. Reuse local primitives before adding variants and keep other stacks in their established conventions. Map canvas decisions to components and tokens; change only assigned design-system files in an exclusive phase and document exceptions. A screen request alone does not authorize a design-system migration.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `jado-craft-core` (`.agents/skills/jado-craft-core/SKILL.md`): Always: specification mode for a mapping, code mode for implementation changes.
- `better-layout` (`skills/better-layout/SKILL.md`): Grouping, spacing or responsive behavior needs design.
- `shadcn` (`skills/shadcn/SKILL.md`): The project uses shadcn.
- `tailwind` (`.agents/skills/tailwind/SKILL.md`): Tailwind styles change.
- `oklch-skill` (`skills/oklch-skill/SKILL.md`): Color tokens are created or converted.

## Scope and handoff

Write scope: Named design-system files, with exclusive writing during the assigned phase.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
