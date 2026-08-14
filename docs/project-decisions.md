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
| Contextual research | Anthropic web search | Adds relevant historical or cultural evidence when needed |

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
