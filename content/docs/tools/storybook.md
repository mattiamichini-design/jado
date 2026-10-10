---
title: "Storybook"
description: "The executable catalog of approved components."
status: "observed"
lastReviewed: "2026-10-10"
---

Use Storybook to choose an actual API, see supported states and verify component interactions. The [catalog structure](/docs/design-system/storybook) describes five suggested catalog levels.

## Procedure

1. Start `npm run storybook` in the product repository.
2. Consult the live catalog or configured MCP server.
3. Read the documentation before using a prop.
4. Update the story by importing the actual component.
5. View affected stories and run relevant tests.

Use the project configuration: `.storybook/` and its scripts indicate how to start the catalog and which checks are available. Keep stories beside the code they document.

Instructions: [official Storybook documentation](https://storybook.js.org/docs), `DESIGN.md` and the project’s `.storybook/` configuration.
