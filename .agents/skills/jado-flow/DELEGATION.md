# Delegation

Read this before the first delegation of a run.

## Modes

- `solo`: you author everything; delegate only a stage-required independent review. With a `lean` budget that review spends the single delegation the budget reserves for it, unless the user waived the review explicitly.
- `macro`: author yourself and delegate to isolate substantive work, permissions or independent judgment. `jado-agent-ux` groups research, UX architecture and content; `jado-agent-visual` reference research, art direction and visual design; `jado-agent-frontend` design systems, implementation, motion and engineering. Reuse an instance for compatible later phases.
- `specialists`: one procedure per delegated instance, when the user asks or a council needs separate contexts.

Reviews go to `jado-agent-ux-reviewer` or `jado-agent-visual-reviewer`, always in a fresh read-only context.

## Before each delegation

1. Confirm the inputs resolve: the Paper document or code path opens, the referenced revision exists, the required tools respond. A missing input fails here, in one place, rather than inside parallel agents.
2. Fill the contract ([CONTRACT-FORMAT.md](CONTRACT-FORMAT.md)) and paste it into the delegation: the delegate sees nothing else from this conversation.
3. Pass `limits.modelTier` as the delegation's model override when the tool supports one (Claude Code Agent tool: `model`, using the tier's `claude` value; `profile` means no override).

Complete when the delegation count stays within `limits.newDelegations` and every delegate has a contract.
