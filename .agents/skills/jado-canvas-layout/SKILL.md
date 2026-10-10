---
name: jado-canvas-layout
description: Structure nodes and groups when creating or changing a Paper layout.
disable-model-invocation: true
---

# Canvas layout

1. Identify the assigned document and nodes. Read the tree and inspect an initial capture. Establish one writer for the shared document during the phase. Complete when ownership and the starting state are explicit.
2. Define container, axis, gap, padding, alignment, growth, and bounds before coordinates. Use Flex groups where supported; justify absolute positioning for overlays or compositions that need it. Use only APIs and properties exposed by available tools. Complete when the layout structure accounts for the assigned content.
3. Preserve in-scope components and content, including relevant long text. For broad transformations, use a document copy or version when available. After the final change, run the stage's self-check; in refine and ship that is `jado-canvas-verify` (`.agents/skills/jado-canvas-verify/SKILL.md`). Complete when the modified nodes and verification handoff identify the current revision.
