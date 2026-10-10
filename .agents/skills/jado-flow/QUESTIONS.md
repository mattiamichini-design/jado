# Asking the user

Read this when involvement is `checkpoints` or `pair`. The resolver's `involvement` says when to ask; this file says how.

Ask in **rounds**. A round holds the open user decisions whose prerequisites are settled, up to four; a decision that depends on an answer still pending waits for the next round. Delegates' `questions` join the round with their recommended defaults.

Use the native question tool: `AskUserQuestion` in Claude Code, `request_user_input` in Codex. Without one, end the turn with numbered questions.

For each question:

- 2–4 concrete options, the recommended one first with a one-line reason;
- the default that applies if the user does not choose;
- for a visual choice, the capture or artboard each option refers to.

Keep independent work going while a round is pending.

Complete when the round is asked and every answered decision is recorded in the decision log as the user's.
