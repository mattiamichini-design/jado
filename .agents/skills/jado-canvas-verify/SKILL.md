---
name: jado-canvas-verify
description: Verify a changed canvas through its structure and inspected captures from the final revision.
disable-model-invocation: true
---

# Canvas verification

Scale the check to the contract's stage. Explore checks that each option is readable and comparable; refine and ship check craft.

1. After the final change of a visual group, capture each changed surface once and inspect it.
   - Explore: look only for broken or overflowing text, clipping, overlapping nodes and missing content.
   - Refine and ship: also inspect hierarchy, dimensions, alignment, container overflow and baselines. Distinguish container centering from optical centering.

   Complete when each assigned surface has one inspected capture from its current revision.
2. Record document, nodes, capture, state and coverage in the handoff (`jado-evidence-contract`, `.agents/skills/jado-evidence-contract/SKILL.md`). A render-changing edit makes earlier captures stale. Canvas captures prove appearance only; keyboard, screen-reader and performance claims need other evidence. Complete when each finding points to its inspected capture.
3. When you may write, fix in **fix passes**, at most the stage's `maxFixPasses` per artifact. At the cap, list the remaining issues and hand off. A read-only reviewer returns findings without touching the document. Complete when the stage's checks pass or the remaining issues are listed.
