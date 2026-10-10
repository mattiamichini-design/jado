---
title: "Positioning, messages and copy"
description: "Connect audience, value and language to screens and prototypes."
status: "proposed"
lastReviewed: "2026-09-30"
stage: "definition"
workflow: true
tools: ["coding-agents"]
skills: ["product-marketing", "copywriting", "copy-editing", "better-writing", "avoid-ai-writing", "humanizer"]
agents: ["jado-agent-ux"]
inputs: ["Brief", "Research and competitor comparison"]
outputs: ["Marketing context", "Messages and copy to validate"]
---

## Context before text

The `product-marketing` skill gathers product, audience, need, alternatives, differentiation, objections, customer language and tone in `.agents/product-marketing.md`. Use existing context and involve the marketing stakeholder in positioning choices. Parts without evidence remain hypotheses.

## From value to words

1. Clarify whom we are speaking to, what outcome we promise and what evidence supports that promise.
2. With `copywriting`, prepare the message hierarchy and actions for presentation or acquisition pages relevant to the project.
3. Assign text in screen context to the content designer. With `better-writing`, work on labels, instructions, errors, confirmations and empty states along the product path.
4. With `copy-editing`, review clarity, consistency and accuracy. Use `avoid-ai-writing` or `humanizer` when artificial phrasing needs correction, preserving meaning and voice.
5. Bring copy into the prototype: space, context, order and interaction state affect comprehension.
6. During [user testing](/docs/engineering/verification), observe how terms, the promise and actions are interpreted. Update context when a shared decision changes.

## Completion criterion

Available evidence supports the promise, language is consistent and actions are understandable along the path. Testimonials, numerical results and words attributed to customers must have an actual source.

The sequence is a proposed way for the designer to work with marketing; commercial goals and approvals still need agreement with stakeholders.

References: [Product Marketing](/docs/automation/skills/product-marketing), [Copywriting](/docs/automation/skills/copywriting), [Copy editing](/docs/automation/skills/copy-editing), [Better writing](/docs/automation/skills/better-writing).
