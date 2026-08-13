# Tourism Version - Technical Architecture

```text
GitHub Pages
briefing form, pipeline evidence, approved experience preview
        |
        | HTTPS
        v
Vercel Functions
validation, orchestration, rate limiting, secret protection
        |
        +---- Researcher tool call ----> Wikidata SPARQL API
        |
        +---- five sequential calls ---> Claude Haiku 4.5
        |
        +---- run evidence ------------> Vercel Blob (JSON/code bundle)
        |
        v
status/result API
        |
        v
GitHub Pages renders validated Maker files in a restricted preview
```

## Component responsibilities

### GitHub Pages

- collects the organisation briefing;
- starts a run and polls by run ID;
- shows the five cumulative handoffs;
- displays validation and Manager decision;
- previews the Maker's approved webpage;
- contains no Claude or storage credentials.

### Vercel Functions

- validate and limit public inputs;
- expose the Researcher's controlled Wikidata tool;
- orchestrate the five agents in mandatory order;
- validate every structured handoff;
- scan Maker files against the permitted-code policy;
- store and retrieve run evidence;
- return only public-safe results.

### Wikidata

- is the single live external tourism source;
- is queried at run time by the Researcher through a recorded tool call;
- returns entity IDs, factual properties, relationships, coordinates when
  available, and source links;
- is never copied into prompts as a hardcoded destination dataset.

### Vercel Blob

- stores run metadata, Wikidata query evidence, agent outputs, validation
  results, and Maker files;
- supports assignment screenshots, transcripts, and before/after comparisons;
- is not the external research source.

## Maker code policy

The Maker creates HTML, CSS, and client-side JavaScript, but the system rejects:

- external scripts, dynamic imports, or unapproved network requests;
- access to cookies, local credentials, parent-page DOM, camera, microphone, or
  geolocation;
- form submission to external destinations;
- `eval`, `Function`, inline event-handler attributes, and navigation outside
  the approved experience;
- hidden or obfuscated code.

The preview is rendered with restrictive browser permissions. This validator
and preview environment are deterministic safeguards, not a sixth agent.

## Version 1 deployment boundary

The GitHub Pages URL is the single public prototype URL. Generated experiences
are shown within that application and are not independently deployed. This
keeps publication, security, and the assignment's eight-week availability
requirement manageable.

## Evidence required per run

- run ID and timestamps;
- original client briefing;
- exact Wikidata query and retrieval timestamp;
- returned entity IDs and source links;
- input and output for every agent;
- handoff-schema validation;
- Maker code-validation and interaction-test results;
- Manager decision and reasons;
- model and prompt version identifiers.
