---
title: "Build a rapid prototype in code"
description: "Use components, Tailwind and shadcn to let people try a design hypothesis."
status: "observed"
lastReviewed: "2026-09-30"
stage: "engineering"
workflow: true
tools: ["coding-agents", "storybook", "varianthub"]
skills: ["tailwind", "shadcn", "varianthub"]
agents: ["jado-agent-frontend", "jado-agent-visual-reviewer"]
inputs: ["Design question", "Flow and direction to try"]
outputs: ["Navigable prototype", "Declared simulated states and data"]
---

## Choose the necessary fidelity

Start from the question: understanding the path, hierarchy, copy, control behavior or transition. Build enough interaction to observe it. A real backend or the entire product is needed only when essential to the agreed test.

## Procedure

1. Read the visual contract and look for available components in Storybook. Agree where the prototype will live.
2. Define paths, states, viewports and data needed for the test. Use synthetic data and make simulations and limitations explicit.
3. Choose the [JADO route](/docs/jado/00-router): R01 for a precise correction, R04 to implement an approved direction or a selected canvas (refine or ship stage). For an open direction, use R03 or R05; VariantHub enters only upon explicit request.
4. Assign the UI builder (`jado-ui-builder`) a scoped deliverable: the flow to make testable, visual references, components, copy and verification criterion.
5. Use Tailwind for tokens, layout and responsive adaptation; use shadcn if adopted by the project, respecting local component APIs.
6. Try the path in the browser. Involve the UI engineer (`jado-ui-engineer`) for a concrete technical problem with layout, interactions, animations or performance. The visual reviewer checks current evidence according to the route.
7. Prepare prototype access and a way to reset it before [user testing](/docs/engineering/verification).

## What to deliver

A link or startup method, the scenario to try, hypotheses, covered states and limitations. If the prototype simulates saving, authentication or data, the team and test facilitator must know.

## From prototype to contribution

A research-supported choice can become a [design system](/docs/design-system/contract) component or story, or an agreed PR. The development team evaluates how to integrate it and which code to reuse. Selecting a variant does not certify that the prototype is production-ready.

References: [JADO implementation](/docs/jado/r04), [Tailwind](/docs/automation/skills/tailwind), [shadcn](/docs/automation/skills/shadcn), [VariantHub](/docs/experience/explore).
