---
title: "Version and hand off design work"
description: "Decisions, artifacts and readable evidence in a change proposal."
status: "observed"
lastReviewed: "2026-09-30"
---

## What to version

Keep UX documents, approved decisions, component stories and interface changes in the project repository. The recipient must be able to connect each proposal to the need it solves and the evidence gathered.

## Prepare the handoff

1. Use a dedicated branch according to project rules and preserve concurrent work.
2. Make approved artifacts and alternatives still under exploration distinguishable.
3. Review changes: copy, states, interactions and documentation must describe the same experience.
4. Open a PR with the problem, resulting behavior, UX references and visual or interactive evidence.
5. Identify open decisions and the owner of the next step.

## Review and approval

Reviewers must be able to evaluate the result in Storybook or the relevant preview. Technical Git and release procedures remain in repository instructions. Merges and releases follow authorization from the project owner.

References: [handoff](/docs/delivery/release), [verification](/docs/engineering/verification) and the project’s `AGENTS.md`.
