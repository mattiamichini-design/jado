---
title: "AI coding tools and project context"
description: "Prepare context for Claude Code, Codex or OpenCode, use JADO skills and verify the handoff."
status: "observed"
lastReviewed: "2026-10-10"
---

JADO works with Claude Code, Codex and OpenCode. The installer writes native profiles, skills and instructions for each one; see [configuration](/docs/jado/configuration). The steps below are the same in every tool.

Give the tool the brief, available evidence, UX record and visual contract. The repository's `AGENTS.md`, or `CLAUDE.md` in Claude Code, sets the constraints of the project; JADO explains how to choose the route, specialists and procedures.

## Transfer work to a specialist

Pass the resolved contract: JADO root, route and revision, expected outcome, sources, decisions, exclusive scope, remaining budget and checks. Agents share the filesystem: assign independent outcomes for parallel work and sequential stages for the same files.

## Choose profiles

Use [JADO roles](/docs/jado/roles) according to the [router](/docs/jado/00-router) conditions. The main agent coordinates; the specialist applies procedures in its own context. Reviewers receive current evidence and keep the product and canvas read-only.

Start the assignment with `jado-run`. `ask-jado` clarifies open points; `jado-flow` coordinates the selected route and `jado-agent-*` profiles. To prepare JADO in a new session or another project, follow the [configuration](/docs/jado/configuration).

## Verify the handoff

The main agent reads changes, outputs and evidence. It compares what was delivered with the contract criteria; the agent's report alone does not show that they are met. Declare unverified parts and the next step.
