# AI Usage Log

## Tourism v2 pivot (August 2026)

- Claude Haiku 4.5 is used by five distinct agents with strict structured-output contracts.
- Atlas is forced to invoke the Wikimedia/Wikidata research tool; raw IDs, source URLs, query and timestamp are preserved.
- Forge outputs original HTML/CSS/JavaScript. Deterministic sanitisation, validation, CSP and iframe sandboxing are applied before display.
- Live acceptance run `e994182a-ae38-43f7-b988-eef1d4807aa9` completed all four handoffs and was approved by Compass with zero issues.
- Iteration findings fixed during live testing: invalid secret marker, Wikidata timeout, background-function termination, insufficient evidence, truncated Maker JSON, unsafe inline/external content, and long-stage recovery.

Record material AI-assisted work here for academic transparency. Review and correct every output before using it in the submission.

| Date | Tool/model | Task | Prompt summary | Output used | Human review or changes |
|---|---|---|---|---|---|
| 2026-08-09 | Codex | Project setup | Continue prior planning and create the initial repository foundation | README, security defaults, architecture outline, usage-log template | Pending student review |
| 2026-08-11 | Codex | Supabase fallback | Activate the live synthetic-data plan after no RescueGroups response | Database schema, RLS policy, 40 fictional records, questionnaire, deterministic matching rules and tests | Pending student review |
| 2026-08-11 | Codex | Agent architecture | Evaluate the implementation against the assignment brief and implement a cumulative five-agent Edge Function | Five distinct system prompts and schemas, live Researcher tool call, evidence records, grade-risk analysis | Pending student review |
| 2026-08-11 | Claude Haiku 4.5 + Codex | Pipeline iteration | Run the complete pipeline after configuring Claude; diagnose truncation and semantic interpretation errors | Increased structured-output allowance; added explicit alone-time semantics, preference boundaries, and score-order validation | Pending student review |
