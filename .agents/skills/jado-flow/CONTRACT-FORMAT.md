# Contract format

Fill every field; write `none` rather than leaving one out. A small assignment fits in a few lines.

```markdown
## Contract · <route> · <methodRevision>

- jadoRoot: <absolute path>
- Product root: <absolute path>
- Goal: <the outcome in one sentence>
- Dials: <the resolver's announce line>
- Limits: <the resolver's limits: variants, fidelity, selfCheck, maxFixPasses, independentReview, evidence, newDelegations, repairBatches>
- Procedures: <procedure ids with paths from the packet>
- Settled decisions: <decision → source (user, approved artifact, provisional)>
- Write scope: <files or Paper nodes>; owner: <author>
- stopAfter: <exit node or none>
- Required checks: <checks the stage requires>
- Remaining budget: <delegations and repair batches left>
- Links: <project instructions, components, tokens, existing evidence>
```

## Checkpoint

A checkpoint is the contract plus three fields, saved where the next session can read it:

```markdown
- Revisions: <artifact → revision>
- Missing checks: <checks not yet passed>
- Next action: <the first step on resume>
```
