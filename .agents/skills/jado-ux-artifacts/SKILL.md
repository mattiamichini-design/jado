---
name: jado-ux-artifacts
description: Create or update assigned UX flows, journeys, personas, or stories in the product repository without a mandatory dossier.
disable-model-invocation: true
---

# Update a UX artifact

The coordinator or assigned author performs this procedure in the current context. Independent review required by the route remains a separate assignment.

1. Read the artifact, the source or decision supporting the change, and affected references. Choose a flow for steps, decisions, and recovery; a journey for phases and touchpoints; a story for a capability and acceptance criteria; a persona for evidence about a user group. Label assumptions and proto-personas. Complete when the requested artifact and its evidence boundary are explicit; an analysis-only task can finish without new files.
2. Before file changes, read [the format contract](references/formats.md). Use `docs/ux/` and its four collections for new projects. Preserve an existing canonical location until a verified setup migration. Product artifacts belong outside `.jado/`. Complete when the destination and supported format are resolved.
3. For work through the UX Planner app, inspect its actual capabilities, selected workspace, and revisions. Verify that the installed version reads the resolved UX root (current versions read `docs/ux/`). If the app cannot read the agreed root, prepare authorized files there and report app verification blocked pending its update. Keep one canonical copy, without a duplicate or symlink that hides the limitation. Complete when the actual save and verification surfaces are known.
4. Reread files before saving to detect concurrent changes, and coordinate one writer with the app. Preserve IDs, supported fields, and unrelated content. If the tool cannot write the artifact type, use the authorized filesystem with conflict checks or deliver a proposal. Complete when the requested change is saved to the intended current artifact, or explicitly remains a proposal.
5. Validate format, links, and affected IDs. For flows check labeled branches, exits, errors, and recovery. For journeys check unique IDs and cells referencing existing columns. Distinguish parsing, app rendering, and validation with users. Apply `jado-evidence-contract`; deliver artifact/revision, change, rationale, evidence, and limits. Stop at the requested output.

For an assigned extended baseline or coverage audit, use `jado-ux-traceability`.
