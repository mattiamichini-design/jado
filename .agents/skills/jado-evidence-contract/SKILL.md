---
name: jado-evidence-contract
description: Record verification evidence, coverage, and limits before reporting an artifact as verified.
disable-model-invocation: true
---

# Evidence contract

Evidence proves what was checked. Its weight follows the contract's stage, through the evidence level in `policy.dials.stage`:

| Level | Stage | What to keep |
| --- | --- | --- |
| `handoff` | explore | A short list of checks and capture references in the handoff message. No files. |
| `handoff with captures` | refine | Checks, coverage and the current captures, referenced in the handoff. Files only when a later step reuses them. |
| `persisted` | ship | A verification record in the product repository, plus captures. |

## 1. Record each check

For each required check record the artifact, revision, check, author, evidence and coverage. Use `passed`, `failed` or `blocked`; explain `not_applicable`; attach the user's actual words for `waived_by_user`. A capture proves capture, not inspection: mark a visual check passed only after looking at the current capture. An independent review needs an instance distinct from the author.

Complete when every check the stage requires has an outcome backed by current-revision evidence, or an explicit gap.

## 2. Persist only when the level asks for it

At the `persisted` level, follow the product's existing evidence convention; otherwise use `docs/ux/evidence/<assignment>/verification.md`, with captures beside it and `<assignment>` a stable task identifier. Store requested reference packs and moodboards in the same directory unless the product names another home. Link existing artifacts instead of copying them. Product evidence stays outside `.jado/`. One writer owns each shared evidence file; a read-only reviewer returns its record to that writer.

Complete when every persisted proof has a reachable path recorded in the contract.

## 3. Return the handoff

Return the handoff in [HANDOFF-FORMAT.md](HANDOFF-FORMAT.md). Report `success` only when every required, unwaived check passed on the current revision; keep `not_applicable` and `waived_by_user` visibly distinct from `passed`. Automated checks prove what they exercise; visual judgment needs an inspected render; documentary research and heuristic review do not establish usability with real users.

Complete when the handoff accounts for every required check and every decision taken on the user's behalf.
