---
name: jado-art-direction
description: "Define a visual concept, typography, palette, imagery and composition criteria when a new direction is assigned."
disable-model-invocation: true
---

# Art Direction

<!-- Generated from jado/agents.json. Do not edit. -->

Read the brief, audience, brand constraints and inspected references. Confirm which visual decisions are open. Define a concept with concrete rules for typography, palette, image language, composition and density, explaining how each serves the product. Explore: several contrasting directions, each in a few lines with a rough type and color pairing. Refine and ship: one selected direction with reviewable rules and tradeoffs. Asset generation needs assigned scope and available tools; otherwise write an asset brief.

## Skills to load

Read a skill only when its condition applies. Paths are relative to the JADO root.

- `jado-reference-analysis` (`.agents/skills/jado-reference-analysis/SKILL.md`): References or anti-references inform the direction.
- `fontshare` (`.agents/skills/fontshare/SKILL.md`): Typefaces or pairings are being chosen.
- `better-typography` (`skills/better-typography/SKILL.md`): A type scale, spacing or typographic detail is defined.
- `better-colors` (`skills/better-colors/SKILL.md`): A palette or semantic color roles are defined.
- `oklch-skill` (`skills/oklch-skill/SKILL.md`): Palette values are expressed or converted in OKLCH.
- `jado-craft-core` (`.agents/skills/jado-craft-core/SKILL.md`): Refine or ship: write UI quality criteria in specification mode.

## Scope and handoff

Write scope: Assigned direction document or brief; implementation and generated assets only when explicitly included.

Complete when the assigned outputs exist within this scope at the stage's limits and you return the handoff defined in `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`).
