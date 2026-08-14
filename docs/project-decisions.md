# Project Decisions

## Confirmed

| Decision | Choice | Rationale |
|---|---|---|
| Project name | Adoptable Tails | Clear reference to pets available for adoption |
| Organisation | Adoptable Tails Ireland | Suitable fictional Irish context for the assignment |
| Initial species | Cats and dogs | Focused scope with broad customer relevance |
| LLM | Claude Haiku 4.5 | User-selected model |
| Repository owner | `phqueiroga` | User's GitHub account |
| Repository visibility | Public | Supports assessment access and GitHub Pages |
| Primary animal data | Supabase | Dynamically queried, controllable live synthetic dataset |
| Optional animal data | RescueGroups | Connector may be activated later if access is approved |

## Pending

- Supabase project and protected Edge Function deployment
- Questionnaire wording and scoring weights
- Visual identity and interface style
- Deployment and testing evidence
## Proposed scope pivot

### 2026-08-13 - Tourism Experience Studio specification

The proposed next version changes the fictional organisation from a pet-adoption
recommender to an agentic studio serving tourism organisations. Clients submit
an engagement problem rather than selecting a predetermined deliverable. The
Designer selects exactly one of three outputs: a treasure hunt, personalised
itinerary, or interactive timeline. The Maker builds the complete webpage.

The implemented stack is GitHub Pages for the public prototype, Vercel
Functions for protected orchestration, Vercel Blob for evidence storage,
Anthropic web search for context, Google Places and Routes for current place
and travel evidence, Open-Meteo for relevant weather, and Claude Haiku 4.5 for
the five agents. The pet-adoption version remains recoverable from Git history.

### 2026-08-14 - Simplified Experience Compass scope

- Clients are visitor attractions only, using a bounded attraction subtype list.
- The attraction supplies its real stories, objects, events or areas.
- The Designer chooses either a treasure hunt or an interactive timeline.
- Google Places is the sole custom external API and grounds the named attraction.
- Weather, routes, transport questions and personalised itineraries are removed.
- The Maker builds the complete specific webpage; the Communicator launches it;
  the Manager may approve, require revision or reject.
