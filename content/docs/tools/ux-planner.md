---
title: "UX Planner"
description: "The local application and authoring contract are two parts of the same flow."
status: "observed"
lastReviewed: "2026-10-10"
---

## Purpose

UX Planner is a local application for working on personas, journeys, flows and stories stored in the project repository. The [UX Planner repository](https://github.com/mattiamichini-design/uxplanner#readme) has the installation and usage instructions.

## Installation

```sh
git clone https://github.com/mattiamichini-design/uxplanner.git
cd uxplanner
npm ci
npm run build
```

The README documents the `init`, `start`, `demo` and `export` commands, which take the consuming project's root. The consuming project does not need a package manifest or an application dependency. The interface runs at `http://127.0.0.1:4311/ux-planner`. `init` keeps existing files. Add `.ux-planner/` to the consuming project's `.gitignore` and version the planning documents.

The root shown below is the JADO convention for new projects. Check which document root your UX Planner version reads before using `docs/ux/` in a new or migrated project.

## Document contract

```text
docs/ux/
  personas/*.md
  user-journeys/<journey>/meta.json
  user-journeys/<journey>/<persona>.json
  user-flows/<flow>/*.md
  user-stories/*.md
```

The app edits personas and journeys; flows and stories are written in the editor or with the skill. Keep slugs and IDs stable and follow the renderer format. The UX Planner skill owns traceability between artifacts; it does not assume that any generated Markdown is automatically importable as journey JSON.

## Demo and handoff

The demo works on a temporary copy. The export contains JSON, Markdown and relative paths. It can feed an agent with Figma MCP, but it is not a native Figma file or a one-click importer.

## Boundaries

It is a local, single-user tool with loopback binding and a per-project lock. Do not edit the same documents from the browser and editor simultaneously. Version design artifacts according to project conventions.

Instructions: [UX Planner README](https://github.com/mattiamichini-design/uxplanner#readme) and [UX Planner skill](/docs/automation/skills/jado-ux-artifacts).
