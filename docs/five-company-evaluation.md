# Five-company agent evaluation

Executed on 13 August 2026 against an isolated Vercel preview using five fictional tourism organisations. Each case used a different engagement problem, audience, constraint set, and desired outcome. The evaluation inspected every agent output, all four handoffs, API evidence, generated code, and the Manager decision.

## Scenarios and results

| Organisation | Expected challenge | Product selected | First-run outcome |
| --- | --- | --- | --- |
| Dublin Docklands Museum | Explain change across historical periods | Interactive timeline | Revision required |
| Atlantic Welcome Hotel | Replace generic rainy-day advice | Personalised itinerary | Maker safely blocked prohibited code |
| Cork Hidden Corners Tours | Lead families to lesser-known stories | Treasure hunt | Approved |
| Kilkenny Heritage Castle | Clarify the sequence of eras and people | Interactive timeline | Revision required |
| Atlantic Cliffs Visitor Centre | Plan a short, mobility-aware visit | Personalised itinerary | Revision required |

The three permitted product categories were all selected. This demonstrates that the Designer responds to the problem rather than returning one fixed template. A revision-required result is not automatically a failure: the Manager is expected to withhold approval whenever acceptance, accessibility, evidence, or feasibility checks are not satisfied.

## Validation by agent

| Agent | What was inspected | Result |
| --- | --- | --- |
| Researcher | Real Wikidata tool call, at least three sourced evidence items, source URLs, and explicit unknowns | Passed in all five cases; 11–15 entities returned per case |
| Designer | One authorised product, problem-to-product rationale, acceptance criteria, and evidence IDs traceable to Researcher output | Product choice varied correctly; an evidence-ID gap was discovered and fixed |
| Maker | Product category preserved, build marked ready, HTML/CSS/JS safety validation, and acceptance checks | Four initial builds completed; one unsafe construct was correctly blocked and then fixed on retry |
| Communicator | Ready-to-use copy, launch touchpoints, measurable engagement metrics, and communication risks | Passed in every completed first run |
| Manager | Audit checks, issue list, evidence-based decision, and no automatic approval | One approval and three justified revision requests; the interrupted case completed after repair and received a justified revision request |
| Handoffs | Researcher → Designer → Maker → Communicator → Manager | Four persisted handoffs in every completed pipeline |

## Gaps found and corrections

1. The Designer occasionally cited Wikidata IDs that were not present in the Researcher's evidence list. The prompt now restricts citations to supplied evidence IDs, and the handoff contract rejects any untraceable ID.
2. One Maker response used the JavaScript `Function` constructor. The safety gate correctly stopped it. The Maker instructions now explicitly prohibit `eval`, `Function`, and `new Function`.
3. The affected hotel run was resumed after the correction. It preserved the personalised-itinerary design, generated valid code, completed all four handoffs, and reached Manager review.
4. Automated contract tests now include rejection of an invented evidence ID.

## Repeat procedure

Run `node scripts/run-five-company-eval.js` against a test deployment. The script creates the five briefs, advances each stage, and emits a JSON audit containing the result for every agent. It should be used on a preview deployment because it consumes LLM credit and creates stored evaluation runs.

Pass criteria: Researcher uses live sourced data; Designer cites only Researcher evidence; Maker preserves the chosen category and passes code safety; Communicator supplies usable copy and metrics; Manager makes an evidence-based decision; and all four handoffs are stored. Any gate failure is recorded as a finding, corrected, and rerun rather than hidden.
