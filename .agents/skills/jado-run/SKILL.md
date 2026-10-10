---
name: jado-run
description: Start JADO design work — research, UX, visuals, content, design systems, UI implementation or review — tuned by stage, involvement and budget dials.
---

# Start a JADO assignment

1. Locate the method. Use the JADO directory supplied by the user or contract; in the JADO repository, use the current directory. Read jado/runtime/index.json for the revision, policy and routes. If the root is missing, ask for it before claiming to run the method.
2. For questions about JADO skills, agents, workflows or next steps, read .agents/skills/ask-jado/SKILL.md and return guidance without executing.
3. For work, read .agents/skills/jado-flow/SKILL.md. It resolves the three dials (stage, involvement, budget), selects the route, records the contract, coordinates roles and checks delivery. Resume an assigned route from its checkpoint instead of re-routing.
4. Method changes are separate from product work: edit canonical sources in the JADO source checkout on a dedicated branch, run npm run jado:compile, npm run check and npm run build, and open a pull request. Merge only with authorization. An installed .jado copy keeps its revision until an explicit install or update.
