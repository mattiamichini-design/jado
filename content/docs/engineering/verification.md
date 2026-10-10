---
title: "Verify the prototype and test it with users"
description: "From interface review to observations that guide the next iteration."
status: "proposed"
lastReviewed: "2026-10-10"
stage: "engineering"
workflow: true
tools: ["storybook", "coding-agents"]
skills: ["fixing-accessibility", "review-animations", "better-writing", "ui-screenshot"]
agents: ["jado-agent-ux-reviewer", "jado-agent-visual-reviewer"]
inputs: ["Prototype", "Design questions and hypotheses"]
outputs: ["Test observations", "Decisions and proposal changes"]
---

## Before the session

Verify that the prototype supports the task: accessible path, test data, resettable initial state, readable copy and relevant error states. Check keyboard use, focus, contrast, viewports and reduced motion where applicable. Storybook helps isolate component behavior.

UX review checks tasks and accessibility; visual review compares the result with the selected direction. Both prepare the test. Observing users reveals how the experience is understood and used.

## Prepare the test

1. Write the research question and the decision that depends on the answer.
2. Agree on relevant participants, session format and recruitment criteria. The number depends on the question and context; this playbook does not set it.
3. Prepare a realistic task phrased as a goal, without suggesting buttons or steps.
4. Define what to observe: completion, hesitation, errors, recovery, term comprehension and requested help. Collect timings or other data only when they serve the question.
5. Inform participants about the purpose, collected data and any recording; agree on access and retention according to project rules.

## Conduct and synthesize

Let the person act before explaining the interface. Record what happens and separate it from your interpretation. Note each facilitator intervention and each prototype limitation that may have affected the result.

| Evidence | Interpretation | Decision | Next test |
| --- | --- | --- | --- |
| Observed behavior, scenario and session reference | Possible cause, with uncertainty | What to change or keep | How to verify the new proposal |

Use pseudonymous references in shared notes and synthetic data in playbook examples. Avoid generalizing to all users from a few cases.

## Completion criterion

Decisions are linked to observations; remaining uncertainties are declared. Update affected flows, copy, prototypes and stories, then repeat testing when needed. A favorable outcome supports the decision in the studied context; it does not certify the entire product.

This is a proposed procedure. Agree on recruitment, tools, note retention and responsibilities with the team before the first session. Use the [test template](/docs/templates).
