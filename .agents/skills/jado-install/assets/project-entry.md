# Use JADO in this project

For design research, UX, UI, references/moodboards, interface content, design systems, implementation, and design review, use the installed method below. Preserve the project's product, design-system, verification, Git, and release constraints.

## Resolve the installed method

The JADO root is `.jado` relative to the product repository root. Read `.jado/jado/runtime/index.json` and `.jado/.agents/skills/jado-run/SKILL.md`; verify the revision and selected packet are available. Read `install.json` only for installation/configured-tool details. Report missing files before claiming to follow JADO.

This copy contains the installed revision. Source changes reach it through an explicit installation update. Keep this root throughout the assignment.

## Run the route

Follow the installed `jado-run`: questions go to `ask-jado`, work goes to `jado-flow`, which owns the dials, routes, delegation, caps and user questions. Execution reads only the pertinent `.jado/jado/runtime/` packet and the procedures at the exact paths it lists.

Project defaults for the dials (edit to taste; a request or `jado: …` mid-run overrides them):

JADO defaults: stage=refine involvement=checkpoints budget=normal

When a required native profile or tool is unavailable, name the gap and execute directly only when the route permits. Profile files do not prove they were loaded; tools without a native adapter receive skills rather than a verified full JADO team.

## Preserve product documents

Use this repository's components, tokens, and canonical UX documents. For ordinary artifacts read `.jado/.agents/skills/jado-ux-artifacts/SKILL.md`; for an assigned extended baseline read `.jado/.agents/skills/jado-ux-traceability/SKILL.md`. New projects use `docs/ux/`; existing projects keep their root until a setup migration verifies IDs, links, formats, and app support. Resolve durable evidence through `.jado/.agents/skills/jado-evidence-contract/SKILL.md`. Product artifacts remain outside `.jado`, which holds the method and configuration.

This routing replaces obsolete design routers in migrated entries. Report remaining conflicts and complete assisted migration in `.jado/migration.md`; package presence alone does not prove migration is complete.
