# Ten-company end-to-end evaluation

Executed on 14 August 2026 against an isolated Vercel preview with three controlled workers. Ten fictional organisations varied organisation type, visitor problem, audience, duration, movement, transport and weather relevance. Each simulation inspected live tool decisions, all agent outputs, handoff validation, generated code and the Manager decision.

## Results after remediation

| Case | Product | Relevant tools | Final outcome |
| --- | --- | --- | --- |
| Atlantic Welcome Hotel | Personalised itinerary | Web, Weather, Places, Routes | Revision required |
| Liffey Business Hotel | Personalised itinerary | Web, Weather, Places, Routes | Revision required |
| Cork Hidden Corners | Treasure hunt | Web, Places, Routes | Revision required |
| Wild Atlantic Micro Tours | Personalised itinerary | Web, Weather, Places, Routes | Revision required after Maker repair |
| Dublin Without a Car | Personalised itinerary | Web, Places, Routes | Revision required |
| Docklands Memory Museum | Interactive timeline | Web | Approved |
| Kilkenny Heritage Castle | Interactive timeline | Web, Places | Approved |
| Phoenix Discovery Park | Personalised itinerary | Web, Weather, Places | Revision required |
| Atlantic Cliffs Visitor Centre | Personalised itinerary | Web, Places | Revision required after state-read repair |
| Galway Story House | Interactive timeline | Web | Four handoffs and valid code; final Manager call blocked by exhausted API credit |

The Designer selected all three authorised product categories. Fixed historical-sequence problems produced timelines; family discovery produced a treasure hunt; time, movement and weather problems generally produced itineraries. Weather and Routes were omitted—with explicit reasons—when the experience was stationary or indoors.

## Agent validation

| Agent | Evidence from the evaluation |
| --- | --- |
| Researcher | All ten produced sourced evidence and explicit tool decisions. Movement cases called Routes after the prompt correction. Executed custom calls are now reconciled into the permanent query record. |
| Designer | Every selected product was authorised and every required evidence ID traced to Researcher output. Product selection varied with the problem. |
| Maker | Safe code validation remained mandatory. Two initial failures exposed browser-storage and empty-file behavior; stronger focused rebuilds repaired both without weakening the safety gate. |
| Communicator | Completed for every run that reached it and was evaluated against actual Maker features rather than the design idea alone. |
| Manager | Two clean cases were approved; the others received justified revisions when acceptance or launch checks failed. It did not approve everything automatically. |
| Handoffs | Nine cases reached and persisted all four handoffs. The tenth also reached four valid handoffs, but its final Manager API call was blocked by depleted Anthropic credit. |

## Gaps found and fixed

1. **Researcher tool-turn exhaustion:** five consecutive tool turns could leave no final JSON. The orchestration now forces a tool-free structured response after the limit.
2. **Route responsibility:** one Researcher deferred routing to the Designer. Its instructions now explicitly require representative route validation whenever movement is allowed.
3. **Missing audit entries:** the model could execute Routes but omit it from `source_queries`. Executed tool calls are now deterministically reconciled into the audit.
4. **False-positive code rules:** ordinary `function (...)` syntax and harmless “parent” wording were blocked. Rules now target the actual `Function` constructor and real parent-window access, with regression tests preserving both security controls.
5. **Maker correction weakness:** a rebuild could repeat browser storage or return empty files. Maker now receives the exact failures and up to two focused rebuilds requiring non-empty semantic files and memory-only state.
6. **Stale stage state:** overwritten private Blob content could remain cached for up to 60 seconds, causing duplicate work and an incomplete evaluator loop. Reads now use Vercel Blob's `useCache: false` consistent-read option.

## Interpretation

`revision_required` is a valid quality-control outcome, not a pipeline failure. It proves the Manager checks acceptance criteria and launch readiness. The two approvals demonstrate the full public experience path. The principal remaining operational risk is latency: five sequential model stages plus live research can take several minutes. The system displays progress, persists every stage and fails safely rather than showing partial work.

Run IDs are retained in private Vercel Blob; no API keys or visitor identities are stored in this report.
