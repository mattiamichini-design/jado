---
title: "JADO agent profiles and skills"
description: "Five native profiles, composable specialist procedures and proportionate assignments."
status: "observed"
lastReviewed: "2026-10-10"
---

Profiles use the `jado-agent-` prefix; skills describe procedures that can run in the current context. A skill’s presence does not create delegation. The main agent uses `jado-flow` to choose activities, executors and checks.

| Profile | Entry skill | Default procedures |
| --- | --- | --- |
| `jado-agent-ux` | `jado-ux` | `jado-researcher`, `jado-ux-architect`, `jado-content-designer` |
| `jado-agent-visual` | `jado-visual` | `jado-visual-researcher`, `jado-art-direction`, `jado-visual-designer` |
| `jado-agent-frontend` | `jado-frontend` | `jado-design-systems`, `jado-ui-builder`, `jado-ui-engineer`, `jado-motion` |
| `jado-agent-ux-reviewer` | `jado-ux-reviewer` | Independent read-only UX review |
| `jado-agent-visual-reviewer` | `jado-visual-reviewer` | Independent read-only visual review |

## Models and reasoning

`jado/agents.json` sets default model settings for each profile: model and effort for Claude Code, model and reasoning for Codex. The installer writes them into the tool-specific profiles. They are defaults, not requirements; edit the profile if your account uses other models. In Claude Code, profiles name explicit model IDs instead of inheriting the coordinator's model.

| Profile | Claude Code model | Effort | Codex model | Reasoning |
| --- | --- | --- | --- | --- |
| UX | `claude-opus-5-5` | high | `gpt-6.1-sol` | high |
| Visual | `claude-opus-5-5` | high | `gpt-6.1-sol` | high |
| Frontend | `claude-sonnet-5-5` | medium | `gpt-6.1-sol` | medium |
| UX Reviewer | `claude-opus-5-5` | high | `gpt-6.1-sol` | high |
| Visual Reviewer | `claude-opus-5-5` | high | `gpt-6.1-sol` | high |

These are per-profile defaults, not benchmark results. The budget dial can override them per delegation through its model tier (`fast` uses Sonnet, `strong` uses Opus in Claude Code) when the delegation tool accepts a model override; exploration on a normal budget also uses the fast tier for generators. Applying a skill in solo mode retains the main session's model. OpenCode profiles inherit the session model. Provider effort labels are calibrated independently.

Each tool must support the selected model IDs and effort fields, and your account or provider must make those models available. Verify the actual model in a new session after updating; generated files do not prove successful execution. Both reviewers retain the read-only sandbox. In Claude Code their profiles also deny the known Paper, Figma Console and Figma write tools while keeping captures and inspection; other MCP servers stay protected only by the instruction. An author cannot declare its own verification independent.

## Assign a few or many activities

You can assign only `jado-content-designer` to `jado-agent-ux`, or research, flow analysis and content in ordered stages. Table mappings are defaults: the contract can include other relevant skills with compatible tools and scope. An independent review keeps a separate context and read-only permissions.

In macro mode, reuse the same instance across compatible stages. In specialists mode, assign one procedure per assignment to separate instances of the same profiles. The specialist procedures remain skills; additional native profiles are unnecessary. In solo mode, the main agent applies them. [Modes and limitations](/docs/jado/execution).

## Choose research

| Required outcome | Relevant procedure and tools |
| --- | --- |
| Evidence about users, needs, the problem or domain | `jado-researcher`: documentary research in the current context |
| Analysis of tasks, sequences, decisions, states and errors | `jado-ux-architect`; also `mobbin-search` to compare actual flows; `jado-ux-artifacts` for requested artifacts |
| Interface patterns for UI development | `jado-visual-researcher`, with `mobbin-search` and `jado-reference-analysis` |
| Visual language and moodboard | `jado-visual-researcher`, using Pinterest, images and relevant websites |

The question and expected outcome guide the choice. Mobbin can serve both a flow and a screen. A mixed request combines procedures, reusing sources and decisions. A UI comparison does not automatically require a moodboard; flow analysis does not require new UX Planner artifacts. Distinguishing observations, hypotheses and evidence avoids presenting documentary research as user testing.

## Sources and handoff

`jado/agents.json` separates the five profile bindings from procedure definitions. Each procedure lists its conditional skills in `uses`, with the condition that activates them; the compiler writes them, with paths, into the generated skill. The graph references procedures as skill nodes, and `roles` assigns each specialist procedure to its default profile.

Transfer the JADO root, route and revision, dials with their limits, mode, activities, outcomes, sources, decisions, scope and budget. The handoff contains artifacts, current evidence and limitations. After an update, open a new session to verify available profiles: [configuration](/docs/jado/configuration).

[Agent catalog](/docs/automation/agents) · [Skill catalog](/docs/automation/skills)

## Direction, content and motion

[Art direction](/docs/automation/skills/jado-art-direction) turns references into criteria for composition, imagery, typography and color, using `fontshare` and `better-typography` for type and `better-colors` and `oklch-skill` for palettes. In explore it sketches several contrasting directions; in refine it fixes one. The researcher gathers and compares; art direction proposes or chooses within its mandate; the designer builds. Pinterest, images and websites are supported sources through available tools, without forcing the work through Mobbin.

[Content designer](/docs/automation/skills/jado-content-designer) distinguishes UI text (`better-writing`), new marketing copy (`copywriting`) and marketing copy revision (`copy-editing`). A mixed request assigns sections and procedures without three mandatory passes over every text.

[Motion](/docs/automation/skills/jado-motion) distinguishes opportunities, specification, implementation and verification. The default profile is Frontend; Visual may receive specification only. `review-animations` remains an explicitly invoked skill; a broad audit with `improve-animations` keeps its own protocol and budget. A static capture verifies layout, not duration and interruptions.

## References and evidence

Selection defines context before research and explains chosen and rejected references. A known brand can be relevant; its reputation does not prove that the pattern works better in the project. An isolated screen does not attest to a complete flow.

Reusable evidence follows product repository conventions; without one, the reference is `docs/ux/evidence/<assignment>/verification.md`, with links to captures. The handoff can suffice for a brief check. The skill describes a recording contract, not an automatic logging service. [Evidence contract](/docs/automation/skills/jado-evidence-contract).

Maps come from the canonical graph and preserve its conditions.
