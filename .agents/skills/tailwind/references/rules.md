# Tailwind Rules

These are the shared Tailwind and semantic HTML rules. Repo-local files at `.agents/instructions/tailwind.instructions.md` may add or override project-specific constraints.

## Utility Discipline

- Style through `className` with Tailwind utilities.
- Prefer standard Tailwind utilities over arbitrary values when a close utility exists.
- Avoid inline styles as a shortcut.
- Avoid raw hex values and primitive color utilities when a semantic token exists.
- Keep custom utilities in the repo stylesheet or token system, then consume them from markup.

## Semantic Tokens

- Use semantic background, text, border, and state tokens such as `bg-primary`, `bg-secondary`, `bg-brand-primary`, `text-foreground`, `text-secondary`, `border-primary`, `border-brand`, `text-error-primary`, `text-warning-primary`, and `text-success-primary`.
- Let the token system handle theme changes. Do not add ad-hoc dark-mode classes when the repo theme contract already handles them.

## Tailwind v4 Source Discovery

When a repo includes shared or symlinked folders, do not leave Tailwind v4 source discovery unconstrained. A bare `@import "tailwindcss";` can let auto-discovery follow symlink chains outside the app root.

For Next.js apps rooted under `src/`, prefer this pattern in `src/app/globals.css`:

```css
@import "tailwindcss" source("../");
```

Only widen discovery when additional in-repo sources are intentionally needed, and keep every source path explicitly constrained inside the project root.

## Layout

- Prefer CSS Grid for multi-item layout and section composition.
- Use Flexbox for one-dimensional alignment and compact control rows.
- Avoid absolute positioning for core layout unless the existing design pattern requires it.
- Avoid fixed widths and heights when fluid, content-aware, or responsive sizing is viable.
- Avoid `max-w-*` unless there is a justified existing pattern or content readability constraint.

## Spacing

- Use parent-owned spacing: put `grid` or `flex` on the parent and spacing in `gap-*`.
- Do not add margin utilities such as `m-*`, `mt-*`, `mb-*`, `ml-*`, `mr-*`, `mx-*`, or `my-*` for component spacing.
- Do not use `space-y-*` or `space-x-*` for component spacing when `gap-*` can express the layout.
- Place separators between content blocks as siblings in the parent flow. Do not attach a separator to the following block through compensating padding or margin.

## Responsive And Interactive States

- Start from mobile-safe styles, then add breakpoints such as `sm:`, `md:`, `lg:`, or `xl:` where the layout actually changes.
- Add interactive variants such as `hover:`, `focus:`, `focus-visible:`, or `active:` only for interactive elements and only when they improve feedback or accessibility.

## Semantic HTML

- Prefer semantic elements such as `header`, `nav`, `main`, `section`, `article`, and `footer` over generic `div` wrappers when the element has a real landmark or document role.
- Keep markup structure aligned with accessibility and layout needs, not just visual grouping.
