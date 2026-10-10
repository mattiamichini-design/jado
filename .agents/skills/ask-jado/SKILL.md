---
name: ask-jado
description: Advise which JADO route, skill or agent fits a design situation and what comes next; resolve a decision gap inside an assigned JADO task.
---

# Ask JADO

Return advice or a focused question; a consultation changes nothing. Execution belongs to `jado-flow` under the user's existing authorization.

## 1. Recover settled context

Resolve one JADO root from the assignment, project instructions or the current JADO repository; when it is missing, ask for its location before claiming catalog coverage. Read the request, the current checkpoint or assignment, the resolved dials and the settled decisions. Consult `DESIGN.md` when the question concerns the product's design.

Two branches: **user guidance** (explain, compare, recommend, next step) or an agent's **assignment gap**. A user's explicit reconsideration reopens only the affected choice; an assigned role fills its missing field and returns it to the coordinator without re-routing.

Complete when the branch, the current stage and the known and missing facts are explicit.

## 2. Find the applicable capabilities

For user guidance, start from `routes` in `jado/runtime/index.json`: each route's summary and stages place the situation on the explore → refine → ship path, and its packet names the procedures. Read `registry/jado-catalog.json` only for a question about a specific skill, a profile binding or a capability no route names. For an assignment gap, start from the selected route packet and widen to the index or catalog only when the packet leaves the question open.

Read a candidate skill's instructions before recommending it, at its exact catalog or packet path. A user-invoked skill is recommended for the user to invoke. Report unreadable instructions, missing tools and unavailable profiles separately from catalog membership, and name the gap when nothing in JADO fits.

Complete when each candidate's applicability rests on a readable source, or the coverage limit is explicit.

## 3. Recommend

Recommend the smallest route or procedure that delivers the result, sized to the stage, with its reason and expected output; add alternatives when a material tradeoff remains. `jado-flow` and the selected packet are the authority on dials, modes, reviews and budgets. Name the executor and mode when delegation matters: the mode follows the budget unless the user names one, and existing assignments keep their executor.

Facts come from sources. Taste, direction and scope belong to the user and follow the involvement dial: autopilot picks the recommended option as provisional, checkpoints holds it for the next round, pair asks now.

Complete when the recommendation fits the current scope and prerequisites, or one focused question names the remaining decision.

## 4. Return

- **User guidance**: the recommendation and reason, links to the relevant instructions, expected result, prerequisites or availability limits, and the next action. Advice on a complete brief stays advice; execution needs its own request.
- **Assignment gap**: the sourced decision, or one question with 2–4 options and a recommended default, the affected field, and whether the assignment can resume on the default. The coordinator applies the answer through `jado-flow`.
