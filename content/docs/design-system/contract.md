---
title: "Build and document the design system"
description: "Visual policy, local primitives, shared patterns and contributions."
status: "observed"
lastReviewed: "2026-10-10"
stage: "design-system"
workflow: true
tools: ["storybook", "varianthub"]
skills: ["shadcn", "tailwind"]
agents: ["jado-agent-frontend"]
inputs: ["Component need", "Visual contract"]
outputs: ["Documented API", "Story and verification"]
---

## Source hierarchy

The visual contract defines the rules; Storybook makes tokens, components, APIs and states accessible. A common layout keeps adapted shadcn primitives in `src/components/ui/` and recurring compositions in `src/components/shared/`. Adopt the structure agreed in the project. VariantHub holds alternatives; UX Planner describes the experience need.

Online shadcn APIs do not replace local component APIs. Before adding a prop, read the existing component’s implementation and documentation.

## Contribute a component or pattern

1. Look for an existing primitive or composition. If a system assignment is needed, give it to `jado-design-systems` with precise files and changes.
2. Check APIs, states, locale and themes in Storybook.
3. If the role exists but needs a legitimate difference, prefer a semantic variant.
4. If a composition recurs across domains, consider a shared pattern.
5. If a visual rule changes, record the decision and obtain approval in the contract.
6. Update stories by importing the shared component and verify meaningful interactions. If proposing an experimental component, declare it before adoption.

## Visual foundations, tokens and accessibility

Describe the semantic role of colors, typography, spacing, surfaces and motion. Keep foreground and background consistent in hover, focus, active, selected and disabled states. Verify keyboard use, focus, accessible names and reduced motion where relevant.

Palette, typography and visual character belong to the product contract. Define these choices with the team and make them available through documented tokens and components.

## Designer contribution

The designer defines usage, anatomy, variants, states, tokens and accessibility criteria; they can build components and stories and propose them through PRs. They discuss APIs and feasibility with development. The team agrees on the shared contract and manages integration and distribution according to its process.

An exploratory component remains identifiable as such. Moving to a shared component requires an explicit decision, separate from the outcome of a single test.

## Completion criterion

One canonical contract for each public API, no unexplained clones serving the same role, stories consistent with production and traceable visual decisions.

References: [JADO roles](/docs/jado/roles), [Tailwind](/docs/automation/skills/tailwind) and [Storybook organization](/docs/design-system/storybook).
