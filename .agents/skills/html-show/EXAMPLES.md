# HTML Show Examples

Use these as invocation and structure examples. They are not copy templates.

## Feature Recap

User prompt:

```text
Create an HTML presentation for the new onboarding auth flow, with before/after screenshots and next steps.
```

Expected branch: feature/task.

Template: `templates/feature-recap.html`

Default output: `docs/04-tasks/auth/onboarding-auth-flow/index.html`

Recommended sections:

- Title and status
- What changed
- Before/after flow comparison
- User impact
- Implementation notes
- Verification evidence
- Limits and next steps

## Current-State Audit

User prompt:

```text
Create a navigable HTML audit page for the dashboard mobile layout.
```

Expected branch: current-state audit.

Template: `templates/current-state-audit.html`

Default output: `docs/05-audits/<date>-dashboard-mobile-layout/index.html`

Recommended modules:

- Filterable findings by severity or surface
- Screenshot evidence grid
- Expandable technical notes
- Before/after comparison only if a proposed or implemented fix exists

## Competitive Research

User prompt:

```text
Turn this competitor research into an internal HTML presentation.
```

Expected branch: competitive research.

Template: `templates/competitive-research.html`

Default output: `docs/ux/competitive-research/<slug>/index.html`

Recommended modules:

- Competitor matrix
- Pattern filters
- Screenshot gallery
- Opportunity map
- What to copy, avoid, and investigate

## Design Solution

User prompt:

```text
Make a section-based HTML presentation explaining the new recipe detail design direction.
```

Expected branch: feature/task or design solution.

Template: `templates/feature-recap.html` when there is an implementation delta, or `templates/explainer.html` when the request is mainly conceptual.

Default output: `docs/04-tasks/recipes/<slug>/index.html`

Recommended modules:

- Problem framing
- Structure comparison
- Interaction model
- Before/after visual slots
- Decision rationale
- Open risks

## Explainer

User prompt:

```text
Create an HTML explainer for how the fermentation timeline model works.
```

Expected branch: explainer.

Template: `templates/explainer.html`

Routing rule: ask if the page is project-critical, temporary, or a general concept for the user's shared explainers folder.

Recommended modules:

- Concept summary
- Mental model diagram
- Step-by-step walkthrough
- Example scenario
- Limits
- Practical checklist
