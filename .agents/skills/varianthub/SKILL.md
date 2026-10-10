---
name: varianthub
description: Explore and promote component or full-page variants in a repository whose VariantHub infrastructure is already current. Use for day-to-day VariantHub work; use varianthub-builder to bootstrap or upgrade the infrastructure.
---

# VariantHub

VariantHub is an exploration environment for registered React variants. It supports isolated components and complete pages while keeping experimental code outside production imports.

Before changing a consumer repository, read its VariantHub development doc—commonly `docs/03-development/varianthub.md`—for the registry, metadata, routes, and shared-core boundary. If that integration is missing or outdated, hand off provisioning or synchronization to `varianthub-builder` before creating variants.

## Choose the mode

- **Explore** is the default. Build the smallest comparison-ready set of variants that answers the user's design question.
- **Promote** begins only when the user explicitly selects a direction for production. Follow the repository's normal implementation and verification requirements in this mode.

The mode is explicit before implementation begins. A request to create, duplicate, combine, or compare variants remains in Explore mode.

## 1. Classify the item

Choose the preview contract before writing variants:

- `component`: a UI fragment rendered in the standard comparison grid. Omitting `kind` preserves this behavior for existing registrations.
- `page`: a complete route-level experience. Set `kind: "page"`; the grid starts at one item per row and renders responsive iframe previews.

This step is complete when the registration kind and intended preview surface are explicit.

## 2. Create and register variants

1. Create variants near the target UI, normally in `src/components/**/variants/`.
2. Register every variant in the consumer-owned VariantHub registry with a stable `id`, `name`, optional `description`, and React `component`.
3. Add the item key to the repository's VariantHub metadata allowlist with at least `name`, `description`, `categories`, and `tags` when that repository uses one.
4. For a page item, add `kind: "page"` to the catalog entry.

Registration is complete when the item route resolves, every expected variant appears, and a direct reload does not return 404.

## 3. Explore with a sketch loop

Implement only the requested variants, states, and viewports. Give each alternative a stated hypothesis and a meaningful structural or interaction difference. Hold comparison content and state constant; color or font swaps alone do not answer a structural design question. Honor the requested count; explain a missing valid alternative rather than padding the set. Reuse documented design-system primitives when the concept depends on them, but keep the loop focused on the variants rather than revalidating Storybook or VariantHub infrastructure.

Use one narrow smoke check that proves the changed variants are registered and visually reachable. Inspect additional interactions or viewport states only when the user's design question depends on them. Treat unrelated infrastructure failures as handoff notes rather than expanding the task.

The Explore verification budget excludes repository-wide lint, typecheck, build, React Doctor, accessibility audits, complete Storybook suites, exhaustive Playwright matrices, task-documentation updates, and automatic commits unless the user explicitly requests one of them. The positive handoff target is a working comparison surface plus a concise note describing what was checked.

Exploration is complete when every requested variant is visible in VariantHub and the requested comparison state can be evaluated.

## Comparison behavior

Use the grid for side-by-side review. Use `Compare` for immersive review:

- With no selection, `Compare` includes every visible variant.
- With a selection, it includes only the selected variants in visible order.
- Previous/next controls and the left/right arrow keys switch variants; the sequence wraps.
- Component variants use an isolated full-viewport canvas in immersive mode.
- Page variants use responsive iframe previews in the grid and a navigable page viewport in immersive mode.

When the user asks to validate VariantHub itself, verify page items at one, two, and three columns plus scrolling, internal navigation, responsive behavior, variant switching, deep-link reload, and immersive exit. For component items, verify the grid renderer and immersive comparison. This infrastructure matrix is not part of routine variant exploration.

## 4. Promote an approved variant

Move the approved design into the normal production tree:

1. Create a clean production component or page from the approved implementation.
2. Remove exploration-only wrappers, fixtures, controls, and debug code.
3. Point production callers at the clean production module.
4. Keep the VariantHub file as historical reference or make it a thin wrapper around the production module when continued comparison is useful.

Promotion is complete when every production caller imports the clean module from the normal production tree and the shipped route passes the repository's normal production checks. Record design decisions in task documentation; keep the production API limited to runtime concerns.
