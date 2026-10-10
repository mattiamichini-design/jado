---
title: "A design route, from analysis to handoff"
description: "Connect research, marketing, experience, prototypes, user testing and design systems."
status: "observed"
lastReviewed: "2026-09-30"
stage: "operations"
workflow: true
tools: ["ux-planner", "varianthub", "storybook", "coding-agents", "github"]
skills: ["jado-researcher", "mobbin-search", "product-marketing", "copywriting", "jado-ux-artifacts", "ask-jado", "jado-flow", "jado-run", "varianthub"]
agents: ["jado-agent-ux", "jado-agent-visual", "jado-agent-frontend"]
inputs: ["Design request", "Product context"]
outputs: ["Evidence and decisions", "Prototype and test results", "Design system and handoff"]
---

## Purpose

The route describes the designer’s contribution within a team: from understanding the need to a verifiable proposal and the components that make it consistent. The level of detail depends on the question to resolve.

## Sequence

1. **Frame the problem.** Gather goals, affected users, constraints, observations and questions in the [brief](/docs/discovery/problem).
2. **Study alternatives.** Compare competitors and interaction references with [research and Mobbin](/docs/discovery/competitors). Separate observations from opportunities to validate.
3. **Clarify the message.** Use [Product Marketing and copy skills](/docs/definition/messaging) for audience, value, language and the product promise.
4. **Define the experience.** Connect evidence, stories, journeys, flows and scenarios with [UX Planner](/docs/experience/traceability).
5. **Explore.** `jado-run` starts the assignment; `ask-jado` clarifies missing decisions and `jado-flow` follows the [JADO route](/docs/jado/00-router). [Paper](/docs/jado/r05) supports comparison on the canvas; [VariantHub](/docs/experience/explore) compares alternatives in code upon explicit request.
6. **Prototype in code.** Use existing components, Tailwind and shadcn where adopted. Build only the states and interactions needed for the [design question](/docs/engineering/implement).
7. **Observe users.** After checking the interface, conduct the [prototype test](/docs/engineering/verification), record limitations and revise the proposal based on evidence.
8. **Document and share.** Document tokens, components and states in [Storybook](/docs/design-system/storybook). Prepare the [handoff](/docs/delivery/release), including any PRs within the scope agreed with the team.

## When the work is ready to share

The team can understand the problem, try the solution and trace the evidence. It knows which states are simulated, what was observed with users and which decisions remain open. A working prototype alone does not demonstrate that the experience is understandable or ready for integration.

The [traceability example](/docs/experience/workflow-example) shows the relationship between intent, path and observable outcome. Competitor analysis and user testing procedures are operational proposals; methods, participants and criteria must be agreed for each initiative.

## Collaboration with development

Bring feasibility questions and constraints to the team in time. Agree on the scope of UI and design system PRs; leave the choice of technical process and prototype integration to the team.
