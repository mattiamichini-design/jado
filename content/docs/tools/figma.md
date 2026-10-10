---
title: "Figma and visual handoff"
description: "A possible integration, with declared boundaries and a process still to define."
status: "proposed"
lastReviewed: "2026-10-10"
stage: "operations"
---

## What we know

The UX Planner README describes a JSON/Markdown export that an agent with Figma MCP can use to reconstruct maps, flows and personas. This is not a native importer and does not guarantee two-way synchronization.

## Proposed procedure

1. Choose which artifact needs visual discussion and which file remains its source.
2. Export the corpus with `ux-planner export`.
3. Reconstruct only the requested scope in the tool, preserving canonical ID references.
4. Record decisions in the product source.

## To clarify

Figma’s role in the team, libraries, file ownership, design tokens and the design-to-code boundary are not documented in the sources read. The procedure above is a proposal, not an active process.

Source: [UX Planner README](https://github.com/mattiamichini-design/uxplanner#readme), handoff section.
