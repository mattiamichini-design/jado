---
title: "Explore and choose a direction"
description: "A VariantHub comparison that ends with an explicit decision."
status: "observed"
lastReviewed: "2026-09-30"
stage: "experience"
workflow: true
tools: ["varianthub", "paper"]
skills: ["varianthub"]
agents: ["jado-agent-frontend", "jado-agent-visual"]
inputs: ["Design question", "Constraints"]
outputs: ["Comparable variants", "Decision"]
---

## When to use it

Use a comparison when a layout, interaction or hierarchy decision is open. Choose the fewest alternatives that make the difference assessable. In Paper, follow [R05](/docs/jado/r05); the steps below concern [R09](/docs/jado/r09), when VariantHub is explicitly requested.

## Procedure

1. Record the comparison question, states and viewports. Use Explore mode inside VariantHub.
2. Read the repository’s VariantHub documentation. If infrastructure is missing, stop at that prerequisite: `varianthub-builder` requires a separate assignment to prepare it.
3. Choose `component` for a fragment or `page` for a complete experience.
4. Create the variants, register them with stable IDs and update the metadata allowlist where required.
5. Open the catalog and direct route; verify that reload works and all variants are visible.
6. Present the comparison. A request to create or combine variants does not authorize promotion.
7. Bring the selected direction into the [prototype to test](/docs/engineering/implement). Use **Promote** only when a contribution to shared code is requested and its scope is agreed.

## Verify the comparison

Explore requires a focused smoke check. The skill excludes repository-wide builds, lint and tests, full audits, task documentation and automatic commits unless explicitly requested. Git boundaries and isolation from production still apply.

## Outcome and completion criterion

An accessible comparison, a readable question, assessable differences and a completed check. Choosing a direction prepares user testing; a contribution to shared code requires an explicit decision.

## Avoid

Changing the design system because a variant looks promising; importing `variants/` into production; fixing unrelated infrastructure during the comparison.

Source: [VariantHub skill](/docs/automation/skills/varianthub). For routes and registration, consult the consuming project’s documentation.
