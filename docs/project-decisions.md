# Project Decisions

## Confirmed

| Decision | Choice | Rationale |
|---|---|---|
| Project name | Experience Compass | Reflects the current visitor-attraction experience studio |
| Client scope | Visitor attractions | Museums, parks, heritage sites, visitor centres and cultural venues |
| Generated products | Treasure hunt or interactive timeline | Bounded outputs selected by the Designer |
| LLM | Claude Haiku 4.5 | User-selected model |
| Repository owner | `phqueiroga` | User's GitHub account |
| Repository visibility | Public | Supports assessment access and GitHub Pages |
| Required external API | Google Places | Grounds the named attraction in current place data |
| Contextual research | Google Places only | Anthropic web search was evaluated and deliberately not implemented — added cost, latency and a further failure mode for a single-agent gain the Researcher's Google Places grounding already covered; the Researcher's live prompt explicitly forbids requesting further research |
| Visual identity | Designer-owned per attraction | Designer commits to a four-colour palette and installed-font typography per run, contrast- and font-validated by `src/contracts.js` before the Maker builds on it |
| Reward and mission mechanics | Platform-owned, not agent-owned | Repeated live-testing failures (missions silently unplayable, rewards visible before completion) came from trusting agent-authored code with mechanics that must always work; the platform now renders, scores and locks/unlocks these deterministically regardless of what the Maker writes |

## Superseded

- Supabase project and protected Edge Function deployment — abandoned with the pivot away from the pet-adoption client; Vercel Blob is the run-state store instead
- Questionnaire wording and scoring weights — specific to the abandoned pet-adoption matching flow
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
