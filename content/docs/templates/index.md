---
title: "Reusable templates"
description: "Markdown files to adapt to the product repository."
status: "observed"
lastReviewed: "2026-09-30"
---

Templates are versioned in the `templates/` folder of the [JADO repository](https://github.com/mattiamichini-design/jado). They are editorial proposals: fill fields with evidence and do not remove a question to make the document look complete.

| Template | When to use it |
| --- | --- |
| `workflow.md` | Add a process chapter to the playbook |
| `feature-definition.md` | Define need, scope and observable criteria |
| `user-flow.md` | Document a Mermaid flow and its outcomes |
| `user-journey.md` | Document stages, needs and touchpoints |
| `design-review.md` | Separate findings, evidence and priority |
| `prototype-plan.md` | Bound the question and prototype fidelity |
| `usability-test.md` | Prepare a session and distinguish observations from decisions |
| `project-agents.md` | Prepare operational agent instructions in the project |

## How to use them

Copy the file to the location specified by the repository; assign stable IDs; link sources; replace every placeholder. For a complete UX record, the template does not replace the skill contract: sources, stories, validation and traceability are also required.

JADO routes are edited in the `jado/workflows.json` source with AI and a PR. Generated pages are not authored through these templates.

## Example of a verifiable criterion

“The error flow allows retrying or exiting without losing saved data” describes behavior. “Handle errors well” does not define a test.
