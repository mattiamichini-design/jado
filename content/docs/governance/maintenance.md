---
title: "Keep the playbook current"
description: "Regenerate catalogs, verify links and revisit decisions."
status: "observed"
lastReviewed: "2026-10-10"
---

## Editorial changes

1. Change the relevant source: `jado/workflows.json` for the route, `jado/agents.json` for the role, the product repository for the domain contract. For a current JADO skill, change instructions in the repository. For an upstream package, import the update and compare it with adopted adaptations.
2. Update the operating summary and links in the playbook.
3. Update `lastReviewed` after reading the source, not after an automatic refresh.
4. Verify `npm run check` and `npm run build`.
5. Open a PR with the problem, change and evidence.

## Generated catalogs

```sh
npm run sync:catalog
npm run check
```

The editorial catalog is defined in `registry/catalog-selection.json`: skills for design, copy, marketing and research, and five JADO profiles. `jado:compile` also generates the complete method inventory. External skill provenance is preserved in `jado/skill-lock.json`; JADO-owned skills live in `.agents/skills/`. The editorial catalog reads selected entries; the complete inventory also includes internal procedures. For import and generation, see the JADO README.

Add a capability to the selection only when the design process needs it. For an external package, preserve source, version and license in the inventory; for a JADO-owned skill, link repository instructions. New installations do not automatically expand the catalog. Write its contribution to design work and how to use it in `registry/catalog-copy.json`. Regenerate the catalog and verify purpose, author, links and absence of duplicates before the PR.

## When to review a page

When a contract, path, package source, routing or product decision changes. Agree on review cadence and ownership with the team.

## What we check

Essential metadata, ID uniqueness, workflow skill/agent/tool references, internal page links, TypeScript/MDX compilation and build. Diagrams are checked with the Mermaid parser. Layout checks cover card separation, generated position stability and line routing in JADO paths.
