# UX Artifact Contract

Read this file in full while authoring or verifying a UX record.

## Placement

Follow the existing canonical location. For new projects use `docs/ux/`. Read `jado-ux-artifacts/references/formats.md` from the same skills root for app formats and migration limits.

The requested extended dossier lives in `docs/ux/initiatives/<initiative>/`: README.md, sources.md, validation.md and traceability.md, only as needed for the assigned baseline. Stories, personas, JSON journeys and Mermaid flows remain in their four canonical collections under `docs/ux/`; link them rather than copying them into the dossier. An existing record keeps its stable paths until a verified migration.

## Stable IDs and ownership

Use these namespaces:

| Artifact | ID shape |
| --- | --- |
| Source claim | `E-001` |
| User story | `US-001` |
| Journey | `JY-001` |
| Journey step | `JY-001.S01` |
| Flow | `FL-001` |
| Flow node | `FL-001.N01` |
| Validation scenario | `VAL-001` |

IDs remain stable when wording changes. Retire an ID with a short rationale instead of reusing it. Each statement has one canonical home: sources in `sources.md`, stories in their canonical story files, journey steps in the JSON board, flow nodes in the canonical flow file, and assertions in `validation.md`. Other files reference IDs and links.

## Initiative index

`README.md` records:

- initiative goal and UX scope;
- actors and their goals;
- experience principles or constraints supported by sources;
- links to every artifact;
- unresolved product decisions;
- last verification date and evidence boundary.

The evidence boundary states what was inspected and prevents the baseline from implying broader coverage.

## Sources

`sources.md` is the evidence ledger. For each entry record:

| ID | Kind | Claim | Source | Status |
| --- | --- | --- | --- | --- |
| `E-001` | fact, decision, constraint, assumption, or question | concise canonical claim | relative link with heading, line, issue, or commit when possible | confirmed, unresolved, superseded, or excluded |

An excluded entry includes why it is outside this initiative. An unresolved entry names the decision owner and the artifacts it blocks.

## User stories

The dossier links the canonical `.story.md` files. Each in-scope story records:

- stable ID;
- `As a <specific actor>, I want <observable capability>, so that <user value>`;
- source IDs;
- priority only when a source defines it;
- status: proposed, confirmed, superseded, or blocked.

Split stories when actor, goal, or independently observable value changes. Keep interaction sequencing in journeys and flows, and assertions in validation scenarios.

## User journeys

Use the canonical JSON board from `jado-ux-artifacts`, preserving row/column IDs. Link evidence, story IDs and relevant flow nodes in its supported narrative fields or the dossier. Record emotions only when supported by research. Preserve existing IDs; the dossier may use aliases but must link the native IDs rather than renumbering them.

## User flows

Create one flow file per bounded task or decision-heavy interaction. Record:

- flow ID, entry conditions, exit outcomes, stories, journey steps, and sources;
- a Mermaid `flowchart` whose labels include stable flow-node IDs;
- a node ledger defining each node as entry, action, system response, decision, error, recovery, success, cancellation, or exit;
- permission, empty, loading, validation, and retry states when applicable.

Every decision node has labeled outgoing edges. Every error state reaches recovery, cancellation, or a documented terminal outcome. Every entry reaches an exit; intentional loops state their limit or user-controlled escape.

## Validation scenarios

`validation.md` is the canonical home for observable assertions. Each scenario records:

| ID | Actor and precondition | Action | Observable outcome | Covers |
| --- | --- | --- | --- | --- |

`Covers` links story, journey-step, flow-node, and source IDs. Include happy path, consequential alternatives, permissions, failure/recovery, cancellation, and re-entry according to the UX record. Avoid selectors, modules, mocks, and other implementation detail unless the repository explicitly treats them as public behavior.

## Traceability

`traceability.md` contains the coverage matrix:

| Source | Story | Journey step | Flow node | Validation | Coverage note |
| --- | --- | --- | --- | --- | --- |

Each row links to the canonical anchor. Use more than one row when a claim fans out. A source without a story carries an exclusion, supersession, or unresolved rationale. A confirmed story links its acceptance scenario and the relevant journey steps or flow nodes. If an artifact type does not serve the initiative, record that reason rather than inventing it.

Also list:

- orphan IDs, which must be empty at completion;
- unresolved branches and the exact decision that would close each;
- contradictions with ADRs, plans, implementation, or tests.

## Verification checklist

The contract passes when:

- all manifest files required by the initiative exist;
- IDs are unique, stable in format, and linked to canonical anchors;
- internal links resolve;
- confirmed stories have complete forward traceability;
- material evidence has complete disposition;
- flows have no unlabeled decisions or dead ends;
- validation covers each promised outcome and consequential recovery;
- terminology matches the domain glossary;
- contradictions and unresolved decisions are explicit;
- the initiative index links the complete record.
