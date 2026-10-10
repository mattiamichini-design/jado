---
title: "How to use the playbook"
description: "Choose an entry point and distinguish confirmed rules from proposals."
status: "observed"
lastReviewed: "2026-09-30"
---

## When starting design work

1. Gather the brief, product context, available research and agreed constraints. If working in code, read the repository instructions.
2. Ask to use `jado-run`: `ask-jado` clarifies missing choices and `jado-flow` follows the [JADO route](/docs/jado/00-router). The [complete process](/docs/operating-model/end-to-end) connects the assignment to the design cycle.
3. Gather the documents required by the stage; do not load every skill indiscriminately.
4. Leave a verifiable result and a reference to the next stage.

The route leads to testable prototypes, design systems and contributions through PRs. The [role boundaries](/docs/operating-model/roles) preserve the development process’s autonomy.

## When looking for a tool or automation

The [tool catalog](/docs/tools) distinguishes UX Planner, VariantHub and Storybook. [JADO routing](/docs/automation/routing) explains how to clarify choices, follow the route and coordinate specialists. The [skill catalog](/docs/automation/skills) and [agent catalog](/docs/automation/agents) explain when to use them, how to invoke them and where to read the author’s instructions.

## How to read an operational page

Each workflow declares purpose, entry, sequence, outputs, gates, mistakes to avoid and sources. The date is the last editorial review, not a guarantee that a dependency or external service has stayed the same. Run tool commands in the specified repository.

## How to contribute

For process chapters, edit Markdown in `content/docs` using the [templates](/docs/templates). For JADO maps, edit `jado/workflows.json` with AI on a dedicated branch; `jado:compile` generates the pages, the Mermaid index in `jado/README.md` and the corresponding instructions. Link the source and specify whether you are describing observed behavior or proposing a rule. Run `npm run check` and `npm run build`, then open a PR. Keep secrets, credentials and client data out of examples.

Generated catalog files are updated with `npm run sync:catalog`: manual card edits would be overwritten by synchronization. [Maintenance](/docs/governance/maintenance).
