---
name: jado-flow
description: Coordinate a JADO run started by jado-run — resolve dials and route, assign executors, cap loops, ask at checkpoints and deliver with evidence.
disable-model-invocation: true
---

# Coordinate the work

Three **dials** shape the run: **stage** (`explore` · `refine` · `ship`), **involvement** (`autopilot` · `checkpoints` · `pair`) and **budget** (`lean` · `normal` · `deep`). Their values and the method **rules** live in `policy` of `jado/runtime/index.json`; `scripts/resolve.mjs` turns them into the limits of one run. Match the rigor to the stage: exploration buys range and speed; polish, audits and independent reviews belong to refine and ship.

## 1. Resolve the dials and the route

Pick the route from `routes` in the index: `00-router` when the route is unclear, R01 for a defined fix, R09 VariantHub only on explicit request. When the stage is unstated, infer it: ideas, options, directions or moodboards → explore; a selected direction → refine; production code or release → ship. Then resolve the run:

```sh
node <jadoRoot>/.agents/skills/jado-flow/scripts/resolve.mjs --route R05 --stage explore --project <product root>
```

Pass `--involvement`, `--budget` or `--mode` only when the request or a checkpoint states them; the script applies the project's `JADO defaults:` line and the policy defaults, rejects a stage the route does not support, and prints the limits and an `announce` line. Announce that line to the user. A mid-run change such as `jado: autopilot` re-runs the script and applies from the next step. Without Node, derive the same values by hand from `policy`.

For a checkpoint, verify the artifact, decisions and revisions, then resume with the same author and the remaining budget. Read only the selected route packet. A plan request ends with the route and its assignments; a review-only request keeps product and canvas read-only.

Complete when the resolved limits are announced and the route's applicable branches are explicit.

## 2. Choose executors

The resolver's `mode` decides who works. In `solo`, you apply the assigned procedures sequentially in this context. Before any delegation, including the review that `solo` delegates, read [DELEGATION.md](DELEGATION.md).

Every independent review (the packet's `independentNodes`) runs in its own read-only reviewer context, distinct from the author.

Choose research by the question: needs, constraints and domain facts → `jado-researcher`; task flows, states and recovery → `jado-ux-architect`; interface patterns or style references → `jado-visual-researcher`; the concept that guides the visuals → `jado-art-direction`.

Complete when every activated node has an executor and the delegations fit `limits.newDelegations`.

## 3. Record the contract

Fill [CONTRACT-FORMAT.md](CONTRACT-FORMAT.md), pasting the resolver's `limits`. Delegates receive it as their whole context; in `solo` it is your checkpoint record. On resume, invalidate only work affected by changed inputs; the budget carries over.

Complete when an executor could start from the contract alone, without rediscovering goal, permissions, limits or settled decisions.

## 4. Execute with caps

Run the route. Parallelize independent outputs up to `limits.concurrent` and keep one writer per shared artifact, including each Paper document. Assign UI engineering only for an identified technical problem or an explicit request.

Bound every loop with `policy.rules`: **fix passes** up to `maxFixPasses`, the stage's `selfCheck`, one capture per visual group, one review per changed revision. At a cap, deliver with the remaining issues listed. Iteration rounds the user requests spend the same budget; at its limit, deliver and ask for more.

Complete when every activated assignment returns its handoff or a precise blocker.

## 5. Ask the user at the right moments

You are the only agent that talks to the user. **Facts are your job; decisions are the user's**: look up anything the project, canvas or sources can answer, and put only taste, direction and scope choices to the user.

Every choice taken without asking goes into the **decision log**. In `autopilot`, take the recommended defaults, including those delegates return, and mark user-owned selections **provisional**. With `checkpoints` or `pair`, read [QUESTIONS.md](QUESTIONS.md) before the first question.

Complete when every user-owned decision has an answer, a provisional entry in the decision log, or a pending question.

## 6. Verify and deliver

Apply `jado-evidence-contract` (`.agents/skills/jado-evidence-contract/SKILL.md`) to each handoff at the stage's evidence level. A required check passes only with current-revision evidence, and a required independent review only with its reviewer's verdict; missing, failed or stale evidence counts as not passed. Present each reviewer's findings under its own heading, unmerged.

Deliver in [DELIVERY-FORMAT.md](DELIVERY-FORMAT.md): result, checks, decision log, open questions, next step and the one-line **run summary**. Commit, push, merge, deploy, global configuration and method edits each need their own authorization.

Complete when every required check in the contract has an outcome and the user can see every decision taken for them.
