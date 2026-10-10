# Handoff format

The coordinator reads every handoff in full, so keep it short: the summary in three lines, and long material linked when the evidence level allows files. Read-only reviewers write no files: they return findings inline, under 400 words, most severe first.

```markdown
## Handoff · <procedure> · <status: success | partial | blocked | failed>

- Artifact revision: <revision or capture id>
- Files changed: <files or Paper nodes, or none>
- Summary: <what was produced, at most three lines>
- Checks:
  | Check | Outcome | Evidence | Coverage | Fix passes used |
- Decisions: <choice → alternatives → reason; mark user-owned choices provisional>
- Questions: <decision for the user, 2–4 options, recommended default first>
- Risks: <or none>
- Next step: <one line>
```

Reviewers add a `Findings` list: severity, element, criterion, evidence, suggested fix.
