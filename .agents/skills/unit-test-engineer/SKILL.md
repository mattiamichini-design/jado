---
name: unit-test-engineer
description: Unit-test pass for Next.js and React. Use when changed behavior needs executable coverage, a unit test fails, or another skill needs fresh test evidence.
---

# Unit-test pass

A unit-test pass turns changed behavior into fresh, executable proof.

## 1. Locate the proof surface

Inspect the changed files, repository test scripts, test configuration,
installed runner version, and nearby tests.

List every changed observable behavior and identify its current test surface.
If the task is test-first, apply the `tdd` skill for the implementation loop,
then return here for the final test pass.

Complete when every changed behavior has:

- an existing test;
- a planned test; or
- an explicit reason why a unit test is the wrong surface.

## 2. Build discriminating proof

Reuse the repository's test structure and conventions. Add or update the
smallest tests that would fail if the changed behavior regressed.

Exercise public interfaces, use independent expected values, and isolate
system boundaries when determinism requires it. An existing red test may
serve as the proof for a reported failure.

Read [`VITEST-REACT.md`](VITEST-REACT.md) when the proof surface includes
React rendering, asynchronous behavior, timers, mocks, Next.js runtime
boundaries, or coverage configuration.

Complete when every planned test can catch the regression it claims to cover.

## 3. Run the tight proof

Run the smallest repository-native command that exercises the affected tests.
Read its complete output and exit code.

When an unexpected failure requires investigation, apply the
`diagnosing-bugs` skill with this command as the feedback loop.

Complete when the targeted command is green or the exact blocker is
reproduced and reported.

## 4. Match the blast radius

Run a broader repository test command when the change affects shared logic,
test infrastructure, configuration, or multiple consumers.

Complete when the executed scope accounts for every affected consumer, or
the unverified scope is identified as residual risk.

## 5. Report the proof

Report:

- behaviors covered;
- test files added or changed;
- exact commands and outcomes;
- remaining coverage gaps or blockers.

Fresh command output is the evidence for every reported pass.
