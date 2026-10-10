---
name: jado-craft-core
description: Apply stack-neutral UI craft checks when creating or changing layouts, components, or interaction states.
disable-model-invocation: true
---

# UI craft

## 1. Establish the local contract

Read the expected result, project design instructions, existing tokens, components, and approved direction. Identify the changed surface and relevant states. Use the project's styling system; Tailwind and shadcn are conditional tools, not prerequisites.

Scale application to the contract's stage. Explore uses only the structural basics (real content, readable hierarchy, no broken layout) and skips polish. Refine applies the full checks below to the selected direction. Ship adds accessibility, responsive and edge states on the final revision.

Resolve application from the assigned deliverable. For a direction specification, apply the criteria to the proposed design and record implementation checks for the handoff; product edits or browser checks are not required. For a canvas, apply relevant composition/layout criteria and verify captures with `jado-canvas-verify` (`.agents/skills/jado-canvas-verify/SKILL.md`) in refine and ship; keyboard and runtime behavior remain unverified unless an interactive implementation is in scope. For code, apply the implementation and browser checks below.

Complete when the deliverable type, scope, reusable primitives, and applicable checks are explicit.

## 2. Build for content and interaction

Use semantic HTML and native controls with meaningful accessible names. Preserve keyboard access, visible focus, and contrast. Structure the hierarchy around the real task and realistic content. Choose composition, type, color, and imagery for their role in the brief; each decorative element earns its place through the brief. Keep informative breadcrumbs, status labels, and headings; remove labels that merely repeat the title.

Use Grid for two-dimensional composition and Flexbox for one-dimensional alignment. Let parents own sibling spacing through `gap`, and use padding for internal space. Margins remain appropriate for external separation or existing document flow. Use logical properties, content-aware sizing, wrapping, and responsive constraints; text must survive expansion without fixed-height clipping. Follow project tokens and justify absolute positioning for overlays or compositions that need it.

For a layout-specific investigation, read `better-layout`. For Tailwind or shadcn work, read their skills only when the stack uses them. For assigned motion work, read `jado-motion` (`.agents/skills/jado-motion/SKILL.md`); maintain a reduced-motion alternative and verify the interaction states affected.

Complete when the assigned specification, canvas, or UI accounts for hierarchy, content, relevant states, and target viewports at its evidence level.

## 3. Verify the change

Check in **fix passes**, at most the stage's `maxFixPasses`. For implemented code, inspect the rendered result and exercise affected keyboard, focus, responsive, and error states. For specifications or canvas work, perform the applicable checks resolved in step 1 and state the unverified runtime boundary. Apply `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`) to report the actual checks and gaps. Keep a patch within its assigned scope.

In refine or ship, when the contract asks for a design critique or polish pass, `impeccable` (`skills/impeccable/SKILL.md`: critique, polish) and `make-interfaces-feel-better` (`skills/make-interfaces-feel-better/SKILL.md`) are the deeper tools: read and follow the selected protocol, counting any delegation it requires in the route budget. In explore they are out of scope.

Complete when required checks pass for the current revision or remaining defects and verification limits are recorded.
