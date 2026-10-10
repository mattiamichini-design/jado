# Product UX formats

These formats follow [UX Planner](https://github.com/mattiamichini-design/uxplanner); its README and `skills/ux-planner/SKILL.md` are the integration contract. When they disagree with this page, the installed UX Planner wins. This is a JADO integration procedure, separate from the skill that ships with the app.

JADO defaults to **docs/ux/**. Preserve the app's collection names:

- `personas/<slug>.md`: YAML frontmatter with `slug`, `name`; optional `role`, `summary`, `updated`; Markdown body. The interoperable collection name is `personas`.
- `user-stories/<slug>.story.md`: story and observable criteria, preserving project IDs.
- `user-flows/<type>/<slug>.md`: optional frontmatter, fenced Mermaid diagram, and narrative. Preserve existing names and IDs; add relevant states only.
- `user-journeys/<type>/meta.json`: `title`, `description`, `icon` (Lucide name).
- `user-journeys/<type>/<persona>.json`: the JSON board below. A Markdown table needs a real conversion, not just a changed extension.

A journey has `title`; `meta` with `persona` and optional `journeyType`, `updatedAt`, `tags`, `summary`; `columns` with `id`, `label`, optional `subtitle`; `rows` with `id`, `label`, optional `description`, `cells`. Each cell has `columnId` and `items`; each item has `text`, optional `emoji` and `emphasis` (`positive`, `neutral`, `negative`). Row and column IDs are unique; each row has at most one cell per column; every column reference resolves. Optional fields: `notes` (strings), `actors` (`id`, `label`), `content` (Markdown). The inspected parser accepts `uxArtifact` with `id`, `canonicalRecord`, `role`, `stepIds`. Validate supported fields against the installed app before adding metadata.

Observed parser limits: 100 rows, 100 columns, 100 cells per row, 100 items per cell, and 5,000 total items. These are technical ceilings, not targets. Use the actual app version's schema before migration.

Sources and decisions have one canonical home; link them from narrative or `content`/`notes`. Keep the JSON journey canonical instead of duplicating it in editable Markdown. An assigned extended dossier lives in `docs/ux/initiatives/<id>/` and links the four collections. The app does not automatically index `initiatives`.

## Setup migration

1. Inventory the existing root, files, IDs, and links; inspect the app, CLI, MCP, and exports the project uses. Complete when every consumer of the current root is identified.
2. Default to `docs/ux/` when no convention exists. For an existing project prepare and apply a migration diff only within its installation/migration assignment. Skill refresh does not authorize a repository rename. Complete when the migration scope is established.
3. If both roots exist, choose the canonical source before moving; resolve same-name conflicts explicitly. Preserve IDs and an old-to-new path map. Update links and supported configuration. Complete when each source has exactly one destination.
4. Verify that required consumers support `docs/ux/` before renaming. UX Planner's `--root` selects the repository, not the UX directory, and current versions read `docs/ux/`. If an installed consumer cannot, record an update dependency and keep the canonical files until it is resolved. Complete when destination compatibility is proven.
5. On a branch or test copy, verify parsing, opening/saving, reopening, and export. Converting a Markdown journey requires explicit phase/row/cell mapping, with transitions retained in flows. Archive originals only after comparison. Complete when the migrated artifacts work without two editable sources.
