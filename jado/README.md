# JADO workflow diagrams

<!-- Generated from jado/workflows.json. Do not edit. -->

Read-only diagrams from the canonical graph. Operational workflows define activities and delivery checks; dashed arrows exist only in the stages they name. Follow the linked playbook page for conditions, permissions and completion checks. Edit the source graph on a branch, regenerate, verify and review the diff in a pull request.

## Routing

### 00-router — Entry and route selection

Resolve the three dials, then pick the smallest route that delivers the requested outcome.

[Source page](../content/docs/jado/00-router.md) · [Playbook page](/docs/jado/00-router)

```mermaid
flowchart TD
  n_start(["Design request"])
  n_dials["Resolve stage, involvement and budget"]
  n_intent{"Is this a review-only request?"}
  n_review_kind{"Which review is required?"}
  n_review_ux["Review tasks and accessibility"]
  n_review_visual["Review visual output"]
  n_review_done(["Deliver findings and limits"])
  n_route{"Which route fits the outcome?"}
  n_ask["Resolve a route-changing gap"]
  n_rpatch["Patch"]
  n_rdecide["Decide with the user"]
  n_rbuild["Build"]
  n_rexplore["Explore alternatives"]
  n_rstaged["Staged delivery"]
  n_rcouncil["Council"]
  n_rvh["VariantHub"]
  n_rresearch["Visual research"]
  n_contract["Record the contract"]
  n_execute["Coordinate the route with jado-flow"]
  n_done(["Deliver result and run summary"])
  n_start --> n_dials
  n_dials --> n_intent
  n_intent -->|"Yes"| n_review_kind
  n_intent -->|"No"| n_route
  n_review_kind -->|"Tasks and behavior"| n_review_ux
  n_review_kind -->|"Composition and fidelity"| n_review_visual
  n_review_ux --> n_review_done
  n_review_visual --> n_review_done
  n_route -->|"Route-changing gap"| n_ask
  n_ask -->|"Gap resolved"| n_route
  n_route -->|"Precise fix"| n_rpatch
  n_route -->|"Open decision the user wants to make"| n_rdecide
  n_route -->|"Code from a direction or selected canvas"| n_rbuild
  n_route -->|"Paper alternatives"| n_rexplore
  n_route -->|"Several stages in one mandate"| n_rstaged
  n_route -->|"Competing perspectives on one decision"| n_rcouncil
  n_route -->|"VariantHub named"| n_rvh
  n_route -->|"References or moodboard"| n_rresearch
  n_rpatch --> n_contract
  n_rdecide --> n_contract
  n_rbuild --> n_contract
  n_rexplore --> n_contract
  n_rstaged --> n_contract
  n_rcouncil --> n_contract
  n_rvh --> n_contract
  n_rresearch --> n_contract
  n_contract --> n_execute
  n_execute --> n_done
```

## Operational workflows

### R01 — R01 · Patch

Apply a precise, reversible fix to code or Paper nodes and check the result.

[Source page](../content/docs/jado/r01.md) · [Playbook page](/docs/jado/r01)

```mermaid
flowchart TD
  n_in(["Precise fix"])
  n_surface{"Where is the change?"}
  n_code["Edit the code"]
  n_paper["Edit the Paper nodes"]
  n_proof["Capture and check"]
  n_gate{"Is the problem resolved?"}
  n_fix["One targeted fix pass"]
  n_done(["Deliver the fix and evidence"])
  n_stop(["Report the remaining issue"])
  n_in --> n_surface
  n_surface -->|"Code"| n_code
  n_surface -->|"Paper"| n_paper
  n_code --> n_proof
  n_paper --> n_proof
  n_proof --> n_gate
  n_gate -->|"Yes"| n_done
  n_gate -->|"No, fix pass left"| n_fix
  n_fix --> n_proof
  n_gate -->|"Cap reached or blocked"| n_stop
```

### R03 — R03 · Decide with the user

Resolve one open decision with the user through a few substantively different options.

[Source page](../content/docs/jado/r03.md) · [Playbook page](/docs/jado/r03)

```mermaid
flowchart TD
  n_in(["Open decision"])
  n_missing{"What is missing to decide?"}
  n_research["Collect missing evidence"]
  n_ux["Clarify flow and states"]
  n_visual["Sketch visual directions"]
  n_choices["Prepare the options"]
  n_human["Ask the user"]
  n_contract["Record choice and criteria"]
  n_next(["Deliver the decision"])
  n_in --> n_missing
  n_missing -->|"Evidence"| n_research
  n_missing -->|"Flow"| n_ux
  n_missing -->|"Direction"| n_visual
  n_missing -->|"Nothing, options are clear"| n_choices
  n_research --> n_choices
  n_ux --> n_choices
  n_visual --> n_choices
  n_choices --> n_human
  n_human --> n_contract
  n_contract --> n_next
```

### R04 — R04 · Build

Implement an approved direction or a selected canvas in code and verify it at the stage's rigor.

[Source page](../content/docs/jado/r04.md) · [Playbook page](/docs/jado/r04)

```mermaid
flowchart TD
  n_p(["Read the approved source"])
  n_ready{"Is the source complete and approved?"}
  n_canvas["Read the selected canvas"]
  n_map["Map tokens and components"]
  n_b["Implement components and states"]
  n_proof["Capture current browser evidence"]
  n_risk{"Is there a concrete technical problem?"}
  n_eng["Resolve the technical problem"]
  n_check{"Does the stage need an independent review?"}
  n_rev["Review visual output"]
  n_ux["Review critical flows and states"]
  n_parent["Aggregate findings"]
  n_gate{"Did the required checks pass?"}
  n_done(["Deliver verified implementation"])
  n_stop(["Report partial or blocked work"])
  n_p --> n_ready
  n_ready -->|"No"| n_stop
  n_ready -->|"Selected canvas"| n_canvas
  n_ready -->|"Direction with known mapping"| n_b
  n_canvas --> n_map
  n_map --> n_b
  n_b --> n_proof
  n_proof --> n_risk
  n_risk -->|"Yes"| n_eng
  n_eng -->|"Recapture after the fix"| n_proof
  n_risk -->|"No or resolved"| n_check
  n_check -.->|"Self-check only · refine only"| n_parent
  n_check -->|"Independent review"| n_rev
  n_rev -->|"Critical flows or states changed"| n_ux
  n_rev -->|"Flows unchanged"| n_parent
  n_ux --> n_parent
  n_parent --> n_gate
  n_gate -->|"Yes"| n_done
  n_gate -->|"Repair batch left"| n_b
  n_gate -->|"Cap reached or blocked"| n_stop
```

### R05 — R05 · Explore alternatives

Produce comparable Paper alternatives fast, let the user pick or iterate, then record the selection.

[Source page](../content/docs/jado/r05.md) · [Playbook page](/docs/jado/r05)

```mermaid
flowchart TD
  n_p(["Frame the comparison"])
  n_evidence{"Does missing evidence block the options?"}
  n_r["Collect blocking evidence"]
  n_d["Design the alternatives"]
  n_self["Self-check within the stage cap"]
  n_check{"Does the stage need an independent review?"}
  n_review["Review the alternatives"]
  n_fix["Repair blocking findings"]
  n_present["Present the options"]
  n_choose["Select or iterate"]
  n_next{"What did the user decide?"}
  n_snap["Record the selection"]
  n_done(["Deliver the selection"])
  n_code(["Hand off to build"])
  n_stop(["Deliver the unselected draft"])
  n_p --> n_evidence
  n_evidence -->|"Yes"| n_r
  n_evidence -->|"No"| n_d
  n_r --> n_d
  n_d --> n_self
  n_self --> n_check
  n_check -.->|"No review · explore/refine only"| n_present
  n_check -.->|"Independent review · refine only"| n_review
  n_review -->|"No blocking findings"| n_present
  n_review -->|"Blocking findings"| n_fix
  n_fix --> n_present
  n_present --> n_choose
  n_choose --> n_next
  n_next -->|"Iterate with feedback"| n_d
  n_next -->|"Selection made"| n_snap
  n_next -->|"Budget reached or no selection"| n_stop
  n_snap -->|"Stop here"| n_done
  n_snap -->|"Code in the mandate"| n_code
```

### R07 — R07 · Staged delivery

Carry one mandate through UX, canvas and code up to the recorded stopAfter, with shared budget and stage-appropriate checks.

[Source page](../content/docs/jado/r07.md) · [Playbook page](/docs/jado/r07)

```mermaid
flowchart TD
  n_p(["Verify mandate and stopAfter"])
  n_brief["Define tasks, states and criteria"]
  n_research["Collect required evidence"]
  n_decide["Resolve choices"]
  n_result{"What is the stopAfter output?"}
  n_ux_verify["Verify the UX artifact"]
  n_ux_gate{"Does the UX artifact satisfy the contract?"}
  n_ux_done(["Deliver UX and checkpoint"])
  n_copy_needed{"Does the content need work?"}
  n_copy["Prepare the content"]
  n_design["Design the canvas"]
  n_canvas_check{"Does the stage need an independent canvas review?"}
  n_canvas_review["Review the canvas"]
  n_canvas_gate{"Is the canvas accepted?"}
  n_canvas_fix["Repair the canvas"]
  n_code_scope{"Is code in the mandate?"}
  n_canvas_done(["Deliver the verified canvas"])
  n_b["Implement the accepted canvas"]
  n_code_check{"Does the stage need an independent code review?"}
  n_review["Review the browser result"]
  n_gate{"Did the final checks pass?"}
  n_fix["Return repairs to the builder"]
  n_done(["Deliver result and run summary"])
  n_stop(["Report the block and completed work"])
  n_p --> n_brief
  n_brief -->|"Evidence missing"| n_research
  n_brief -->|"Evidence sufficient"| n_decide
  n_research --> n_decide
  n_decide --> n_result
  n_result -->|"UX artifact only"| n_ux_verify
  n_result -->|"Canvas or code"| n_copy_needed
  n_result -->|"Blocked by a decision outside authority"| n_stop
  n_ux_verify --> n_ux_gate
  n_ux_gate -->|"Yes"| n_ux_done
  n_ux_gate -->|"No, fix pass left"| n_brief
  n_ux_gate -->|"Cap reached or blocked"| n_stop
  n_copy_needed -->|"New, changed or unapproved"| n_copy
  n_copy_needed -->|"Approved and unchanged: reuse"| n_design
  n_copy --> n_design
  n_design --> n_canvas_check
  n_canvas_check -.->|"Self-check only · explore/refine only"| n_canvas_gate
  n_canvas_check -->|"Independent review"| n_canvas_review
  n_canvas_review --> n_canvas_gate
  n_canvas_gate -->|"Yes"| n_code_scope
  n_canvas_gate -->|"No, repair batch left"| n_canvas_fix
  n_canvas_gate -->|"Decision or budget missing"| n_stop
  n_canvas_fix --> n_canvas_gate
  n_code_scope -->|"Yes"| n_b
  n_code_scope -->|"No, design only"| n_canvas_done
  n_b --> n_code_check
  n_code_check -.->|"Self-check only · explore/refine only"| n_gate
  n_code_check -->|"Independent review"| n_review
  n_review --> n_gate
  n_gate -->|"Yes"| n_done
  n_gate -->|"No, repair batch left"| n_fix
  n_fix --> n_gate
  n_gate -->|"Cap reached or blocked"| n_stop
```

### R08 — R08 · Council

Collect independent research, UX and visual proposals on one consequential decision, then decide or ask.

[Source page](../content/docs/jado/r08.md) · [Playbook page](/docs/jado/r08)

```mermaid
flowchart TD
  n_p(["Define the decision"])
  n_r["Evidence and uncertainty"]
  n_u["UX proposal"]
  n_v["Visual proposal"]
  n_collect["Compare independent proposals"]
  n_conflict{"Is there a substantive conflict?"}
  n_reply["One targeted reply"]
  n_decision["Record the decision"]
  n_authority{"Who selects?"}
  n_wait(["Ask the user"])
  n_execute(["Deliver decision or handoff"])
  n_p --> n_r
  n_p --> n_u
  n_p --> n_v
  n_r --> n_collect
  n_u --> n_collect
  n_v --> n_collect
  n_collect --> n_conflict
  n_conflict -->|"Yes"| n_reply
  n_conflict -->|"No"| n_decision
  n_reply --> n_decision
  n_decision --> n_authority
  n_authority -->|"The user, or outside authority"| n_wait
  n_authority -->|"Coordinator, within authority"| n_execute
```

### R09 — R09 · VariantHub on explicit request

Use VariantHub for code alternatives only when the user explicitly selects it.

[Source page](../content/docs/jado/r09.md) · [Playbook page](/docs/jado/r09)

```mermaid
flowchart TD
  n_p(["Explicit VariantHub request"])
  n_ready{"Is infrastructure ready?"}
  n_blocked(["Request separate setup"])
  n_b["Build code alternatives"]
  n_variants["Keep alternatives isolated"]
  n_smoke["Check opening and comparison"]
  n_human["Ask the user to select"]
  n_promote{"Is promotion authorized?"}
  n_done(["Deliver the alternatives"])
  n_production(["Hand off to verified integration"])
  n_gate{"Is comparison working and verified?"}
  n_fix["Repair the comparison"]
  n_stop(["Report unverified comparison"])
  n_p --> n_ready
  n_ready -->|"No"| n_blocked
  n_ready -->|"Yes"| n_b
  n_b --> n_variants
  n_variants --> n_smoke
  n_human --> n_promote
  n_promote -->|"No"| n_done
  n_promote -->|"Yes, authorized"| n_production
  n_smoke --> n_gate
  n_gate -->|"Yes"| n_human
  n_gate -->|"No, within budget"| n_fix
  n_fix -->|"Recheck"| n_smoke
  n_gate -->|"Budget exhausted or blocked"| n_stop
```

### visual-research — Visual research · patterns and style

Select comparable UI or style references and deliver the assigned comparison or moodboard.

[Source page](../content/docs/jado/visual-research.md) · [Playbook page](/docs/jado/visual-research)

```mermaid
flowchart TD
  n_start(["Read the research question"])
  n_need{"Is visual research needed?"}
  n_researcher["Define question and search coverage"]
  n_mode{"UI patterns or visual language?"}
  n_mobbin["Find real-product UI examples"]
  n_web["Find style references"]
  n_curate["Compare and select references"]
  n_surface{"Which collection output is assigned?"}
  n_paper["Build the Paper moodboard"]
  n_pack["Prepare the reference collection"]
  n_evidence["Verify sources and coverage"]
  n_done(["Hand off to UX or visual design"])
  n_skip(["Continue with sufficient references"])
  n_reference-plan["Plan candidate coverage before searching"]
  n_start --> n_need
  n_need -->|"Yes"| n_researcher
  n_need -->|"No"| n_skip
  n_researcher --> n_reference-plan
  n_mode -->|"Pattern"| n_mobbin
  n_mode -->|"Mood/style"| n_web
  n_mobbin --> n_curate
  n_web --> n_curate
  n_curate --> n_surface
  n_surface -->|"Paper"| n_paper
  n_surface -->|"Code"| n_pack
  n_paper --> n_evidence
  n_pack --> n_evidence
  n_evidence --> n_done
  n_surface -->|"Comparison only, no moodboard"| n_evidence
  n_reference-plan --> n_mode
```

## Setup and governance

### setup-project — Setup · Install or link JADO

Choose local, global or linked setup, prepare selected tools and migrate design instructions.

[Source page](../content/docs/jado/setup-project.md) · [Playbook page](/docs/jado/setup-project)

```mermaid
flowchart TD
  n_start(["Choose setup destination"])
  n_procedure["Read installation procedure"]
  n_read["Read instructions and configuration"]
  n_tools["Choose mode and tools"]
  n_existing{"Does an entry already exist?"}
  n_create["Prepare a JADO entry"]
  n_migrate["Prepare design migration"]
  n_files["Prepare the setup plan"]
  n_review["Review the setup diff"]
  n_apply["Apply authorized changes"]
  n_verify["Verify access and profiles"]
  n_gate{"Is setup verified?"}
  n_done(["Deliver verified setup"])
  n_stop(["Report remaining setup checks"])
  n_start --> n_procedure
  n_procedure --> n_read
  n_read --> n_tools
  n_tools --> n_existing
  n_existing -->|"No"| n_create
  n_existing -->|"Yes"| n_migrate
  n_create --> n_files
  n_migrate --> n_files
  n_files --> n_review
  n_review -->|"Approved diff"| n_apply
  n_apply --> n_verify
  n_verify --> n_gate
  n_gate -->|"Yes, checks complete"| n_done
  n_gate -->|"No, requirement or evidence missing"| n_stop
```
