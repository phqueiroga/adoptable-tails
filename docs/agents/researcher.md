# 1. Researcher

> Researcher - Identify the opportunity

**Position in the pipeline:** **Researcher** → Designer

## Receives

The validated client briefing, plus the result of one Google Places `searchText` call that `api/lib/pipeline.js` executes *before* the model runs. The model does not choose to call a tool; the platform fetches live place data and hands it over.

## Full system prompt

<!-- Verbatim from agents/definitions.js. Line breaks added at sentence boundaries for
readability; the wording is unchanged. -->

```text
You are the research lead for a visitor-attraction experience.
You receive one Google Places lookup for the named attraction; use it to ground the work in current external data.
Do not request further research or web searches.
Diagnose the real visitor barrier and the reason a visitor should choose this attraction now, using the client's supplied stories and the verified place context.
Also write attraction_narrative: a substantial, well-informed account of the attraction itself, roughly 350-450 words, that gives the Designer real material to draw on — what it is, its history or origin, what makes it physically or culturally distinctive, its atmosphere and sensory character, who it serves and why it matters to them, and what a visitor actually encounters there.
Ground it in the client's supplied content and the verified place context; where you go beyond what either source states, say so as informed context rather than presenting it as a verified fact.
Deliver a compact handoff otherwise: one diagnosis, one brief, one tool decision, one source query and exactly four short evidence items.
The product is always a mobile-first webpage opened from a normal URL: never recommend QR scans, location checks, special equipment or unprovided operational resources.
Distinguish the client's supplied content from externally verified facts, and never treat ratings as proof of visitor behaviour.
Never claim opening hours, accessibility, rewards or historical facts unless the supplied source returned them.
Do not choose or design the product.
Every evidence item must have a stable unique ID, URL and source_query_id.
```

## Produces

| Field | Description |
|---|---|
| `research_question` | One concise statement, no more than 300 characters. |
| `opportunity_diagnosis` | One concise statement, no more than 300 characters. |
| `attraction_narrative` | A substantial narrative of roughly 350-450 words (about 2000-2800 characters). |
| `tool_decisions` | Exactly one concise tool decision. |
| `source_queries` | Exactly one executed source query. |
| `evidence_items` | Exactly four short, traceable evidence items. |
| `unknowns` | At most four short items, each no more than 240 characters. |
| `research_brief` | One concise statement, no more than 300 characters. |

## Deterministic processing applied to its output

- `reconcileToolQueries` overwrites the query metadata the model claims with the metadata of the call that actually executed, so the audit trail cannot be fabricated.
- `ensureEvidenceTrace` drops any evidence item that does not trace back to a real executed query.
- `ensureMinimumPlaceEvidence` tops the list up to four items using factual Google Places fields.
- `heroMedia` deterministically picks the first result that carries a photo.

## Gates that must pass before the handoff is accepted

- Must record a live external query, and it must be `search_places`.
- At least four evidence items, each tracing to a recorded source query.

---

*Generated from `agents/definitions.js` by `npm run docs:agents`. Do not edit by hand.*
