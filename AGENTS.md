# JADO

This repository holds the JADO method sources, the installer and the playbook site. Product repositories own their own product contracts; JADO changes here never edit them.

## Context

- Read README.md, content/docs/governance/architecture.md and content/docs/governance/sources.md.
- jado/workflows.json is the routing graph. jado/agents.json defines the five jado-agent-* profiles and the procedures they load. jado-run is the entry point, ask-jado answers capability questions and missing decisions, and jado-flow selects and coordinates a route. Keep the resolved route in handoffs.
- Product runs read jado/runtime/index.json and the selected packet only. ask-jado reads registry/jado-catalog.json for broader guidance. The full graph is for method changes.
- New UX documents go in docs/ux/ with personas, user-stories, user-journeys and user-flows. Existing projects move there only after links, IDs and the tools that read them are checked.
- Upstream skills are references in jado/skill-lock.json and jado/skill-inventory.json and are downloaded at install time. Skills JADO owns live in .agents/skills/. Do not edit upstream instructions or user-level profiles.
- Keep observed configuration, proposed method and execution evidence apart. A generated profile does not prove that a session loaded it.
- For Next.js, read node_modules/next/dist/docs/ before changing Next APIs; this version differs from older releases. Keep the existing Fumadocs primitives.
- Write all maintained content in English: documentation, UI, workflow labels, skills, profiles, runtime procedures, templates and CLI messages. Apply `writing-for-agents` to agent-facing material, including `SKILL-MECHANICS.md` for skills.

## Ownership

- Hand-written playbook pages: content/docs/, except the generated catalog and workflow pages.
- Sources: jado/workflows.json for routing, jado/policies/ for the settings and protected checks, jado/agents.json for profiles, .agents/skills/ for owned procedures (ask-jado and jado-*, except the generated role skills and jado-run).
- Generated files: .codex/agents/jado-agent-*.toml, jado/runtime/, registry/jado-catalog.json, the role skills, jado/README.md and the workflow pages in content/docs/jado. Regenerate them with npm run jado:compile; never edit them by hand.
- Generated catalog pages: npm run sync:catalog. Upstream references: npm run jado:import. Reusable templates: templates/.
- A design task does not rewrite the method or its review criteria. Graph edits are a separate method-change task: edit the sources, regenerate, verify, then review source and generated changes together in a pull request.
- Do not modify other repositories, install profiles in a user's home directory or deploy as a side effect. Test the installer with --user-root pointing to a temporary folder, or with --dry-run.

## Verification

Run npm run check and npm run build after changes to content, configuration, rendering or routes. Preview interactive UI and Mermaid diagrams. Keep regression tests for validation, installer conflicts and uninstall. Keep diagrams as generated Mermaid fences and keep /docs/... links stable.

Every workflow has status, lastReviewed, stage, inputs and outputs, and its references resolve in the registries. One writer per shared artifact. Do not invent evidence, approvals or usage figures.

## Git

Work on a dedicated branch and open a pull request. Do not merge or release without the maintainer's approval. Keep concurrent work intact, keep builds reproducible and keep upstream attribution. Never commit credentials, client records or environment secrets.

Run the checks in CONTRIBUTING.md locally before you push. Open pull requests as drafts while you iterate, push follow-up fixes together, and mark the pull request ready once: CI skips drafts, and each push to a ready pull request starts a full run.

GitHub is the only distribution channel. Do not publish packages to a registry or add registry install instructions.
