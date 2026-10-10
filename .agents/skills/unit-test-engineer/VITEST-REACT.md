# Vitest and React proof patterns

## Project authority

Treat `package.json`, test configuration, installed package versions, and
nearby tests as the source of truth. Use APIs supported by the installed
versions and preserve the project's existing environment and setup files.

## React behavior

Exercise rendered, user-visible behavior through Testing Library. Prefer
accessible queries and the repository's established interaction utilities.
Assert the observable result of an interaction rather than component internals.

## Async behavior and timers

Wait for the observable result produced by asynchronous work. Use fake timers
when elapsed time is part of the behavior under test, and restore timer state
using the repository's established lifecycle pattern.

## Mocks

Mock system boundaries such as network clients, time, randomness, storage, or
external services. Restore mock state between tests so each proof remains
isolated and repeatable.

## Next.js runtime boundaries

When the configured unit-test environment cannot faithfully execute a Server
Component, Server Action, or framework runtime boundary, test the public logic
behind that boundary or elevate the proof to an integration test. Report the
chosen surface.

## Coverage

Run the repository's configured coverage command when coverage is requested,
a coverage gate applies, or the change affects coverage configuration.

Use uncovered lines to locate missing behaviors. Judge the proof by its
discriminating assertions rather than by the percentage alone.
