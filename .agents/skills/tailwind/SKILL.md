---
name: tailwind
description: Apply Tailwind rules with semantic tokens, parent-owned spacing, responsive layout discipline, and no inline styles.
---

# Tailwind

Use this skill for Tailwind styling, layout refactors, spacing passes, responsive fixes, or token cleanup.

## Workflow

1. Read `references/rules.md` from this skill folder.
2. If the current repo has `.agents/instructions/tailwind.instructions.md`, read it as the repo-local override.
3. Apply the global rules first, then the repo override where it is more specific.
4. If a needed utility or token does not exist, add it through the repo's stylesheet or token system, then consume it through `className`.

## Completion Criteria

- Styling goes through `className` and Tailwind utilities, not inline styles.
- Semantic tokens are used instead of raw hex values or primitive color utilities.
- Spacing is parent-owned with `grid` or `flex` plus `gap-*`.
- Layout is responsive, fluid, and mobile-safe.
- Repo-local Tailwind overrides were read and followed when present.
