---
title: "VariantHub"
description: "React workspace and HTML/URL runner: choose the route that matches the source."
status: "observed"
lastReviewed: "2026-10-10"
---

## Purpose

VariantHub lets you compare component and page variants before choosing a direction. It offers integration for React projects and a local runner for HTML and URLs. [Repository and instructions](https://github.com/mattiamichini-design/varianthub#readme).

## Integration in a React project

The project registers its components and manages routes, metadata and adapters. The VariantHub core package (`packages/core`) provides comparison and the canvas. Document in the repository where the registry lives and which route opens the catalog, for example `/varianthub`.

- `component`: comparison of a UI fragment.
- `page`: a complete page with responsive iframe previews.
- `Compare`: all variants are visible when nothing is selected; otherwise, selected variants appear in visible order.
- Promotion is an explicit step toward contributing to shared code; selecting an alternative for a test does not automatically make it ready for integration.

## Local HTML/URL runner

```sh
git clone https://github.com/mattiamichini-design/varianthub.git
```

The README documents how to build the checkout and run the runner's `init` and `start` commands against the consuming project's root.

`varianthub.config.json` registers stable IDs, allowed roots and HTML/URL sources. The runner does not compile an arbitrary React project: that requires its React host and the core package.

## Persistence and limitations

In the runner, shared layouts live in `.varianthub/layouts`; personal favorites, visits and camera state stay in the browser. In React integration, the project defines layout and metadata persistence: verify that contract before changing it.

Previews run trusted code. Iframes isolate layout; they do not make unknown code safe. External URLs must allow embedding; CSP and cross-origin limitations still apply.

## Updates

`varianthub-builder` checks the GitHub checkout, the build, the consumer runtime and the served UI. VariantHub is distributed through GitHub; tarballs are only local checks. A manifest version does not prove that the browser is using updated code.

Instructions: [VariantHub README](https://github.com/mattiamichini-design/varianthub#readme), [VariantHub skill](/docs/automation/skills/varianthub) and [builder](/docs/automation/skills/varianthub-builder).
