---
title: "Organize Storybook"
description: "From foundations to pages: clear responsibilities at each catalog level."
status: "observed"
lastReviewed: "2026-10-10"
---

## Catalog levels

| Level | Responsibility | Typical source |
| --- | --- | --- |
| Foundations | Visual and motion rules | Contract and tokens |
| Primitives | Focused local API | `src/components/ui/` |
| Patterns | Recurring composition | `src/components/shared/` |
| Features | Domain behavior and state | Feature modules |
| Pages | Representative path and scenario | Composition of shared components |

This structure is a starting point; adapt it to the project. Catalog order is configured in `.storybook/preview.tsx`; level responsibilities are defined in the design system contract.

## Practical rules

- A public API has canonical documentation. Other stories are compositions or recipes that reference it.
- Prefer args and controls for supported props; use custom renders for scenarios that require them.
- Import the shared component. When documenting an experimental proposal, distinguish it from adopted APIs.
- Use native toolbars for viewport, locale and theme. Do not create Mobile/Desktop copies of the same API.
- Separate stories when behavior, data or interaction state changes.
- Pages follow the product journey: access, onboarding, main activities and support destinations.

## Design review in code

The preview uses project styles, themes and supported languages. Show meaningful states, including empty, error, focus and long content. Accessibility checks and interactions help verify components; a user session observes comprehension of the path.

Use scripts available in the repository. The following examples apply to projects that expose them:

```sh
# In the product repository
npm run storybook
npm run test:storybook
npm run build-storybook
```

The MCP flow uses `list-all-documentation`, `get-documentation`, `get-storybook-story-instructions` and `run-story-tests` when available. These are not shell commands and are not assumed to be connected in every environment.

## Team agreements

Adopting these five levels is a proposal. Align taxonomy, component adoption and review ownership with the team; technical package management follows its process.

Project references: `DESIGN.md`, `.storybook/main.ts`, `.storybook/preview.tsx` and scripts in `package.json`. [Official Storybook documentation](https://storybook.js.org/docs).
