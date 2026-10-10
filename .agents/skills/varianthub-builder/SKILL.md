---
name: varianthub-builder
description: Install, upgrade or verify VariantHub in a consumer project, from the runner for HTML and URL sources or the reusable core viewer for React hosts. Use when initializing VariantHub, updating a project to a newer VariantHub checkout, migrating host integration or verifying the runtime actually served. For creating, comparing or promoting variants in a project that is already set up, use varianthub.
---

# VariantHub Builder

Set up and update VariantHub in a consumer project. Treat an upgrade as a chain of custody: the VariantHub checkout, its built packages, what the consumer installs and the UI it serves must all represent the same version.

VariantHub is distributed from GitHub only: https://github.com/mattiamichini-design/varianthub. Clone and build that checkout, then run its CLI with the consumer root. Do not install VariantHub from a public package registry. The repository's README is the command source of truth; read it before acting.

## 1. Discover the installation

Read the consumer's VariantHub documentation and inspect:

- whether the project uses the HTML/URL runner or a React host with the core viewer (`packages/core` in the VariantHub checkout)
- the dependency specifier, lockfile entry and installed package version of the core viewer, when present
- registry, provider, catalog and detail routes, frame-render and immersive-preview wiring
- the VariantHub checkout the project builds from, and its version in `packages/core/package.json` and `packages/runner/package.json`

Record the target version and its source in the task evidence. When the source cannot be established, report that gap before changing dependencies.

Discovery is complete when the source checkout, the version at every custody point, missing host seams and the required branch (bootstrap or upgrade) are explicit.

## 2. Bootstrap or upgrade

For HTML and URL sources, use the runner's `init` and `start` commands from the checkout with `--root` set to the consumer project. Keep existing configuration, roots and layouts.

For a React host, keep the host's own registry, metadata persistence, routes, URL construction, CSP and router callbacks. Connect the core viewer through the project's established local package source and add thin consumer-owned integration for:

- a singleton registry and item metadata
- the provider with a project-specific persistence key
- catalog and item-detail routes
- a frame-render route and a reloadable immersive-preview route
- URL builders, host-router callbacks and same-origin frame and CSP configuration

Shared state, canvas UI, toolbar, cards, grid behavior, renderer, iframe protocol, immersive shell and shared CSS belong to VariantHub, not the consumer. Apply a theme stylesheet after the core stylesheet instead of editing the viewer.

Document the registry, routes, persistence and package source in the consumer's VariantHub development doc. The branch is complete when a registered component and page both open in the grid and immersive preview, and their direct URLs survive reload.

## 3. Verify the served release

1. Run the consumer's tests for host routing and integration.
2. Open the served catalog, a component detail and a page detail.
3. Exercise Compare with and without a selection, arrow navigation, direct preview reload, internal page navigation, session restoration and exit.
4. Re-open the exact control or surface the task changed.

If the browser serves old behavior, compare the source file, the built file and the installed file before changing the implementation again. Verification is complete when automated checks pass and the browser visibly serves the target behavior from the target version.

## Commit boundary

Commit VariantHub changes in its own repository and each consumer separately. In a consumer, include only the host integration and dependency manifests that belong to the upgrade.
