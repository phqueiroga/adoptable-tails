# Experience Compass

Experience Compass is an agentic studio for visitor attractions. A museum, park, heritage site, visitor centre or cultural venue supplies an engagement problem and its real stories, objects, events or areas. Five Claude Haiku 4.5 agents transform that material into either a treasure hunt or an interactive timeline: a working, deployable webpage.

## Five-agent workflow

1. **Researcher** grounds the attraction with a live Google Places lookup, diagnoses the real visitor barrier, and writes a substantial narrative account of the attraction for the Designer to draw on.
2. **Designer** chooses a treasure hunt or interactive timeline, specifies its four missions and contextual reward, commits to a distinct visual identity (palette, typography) for this attraction, and proposes one concrete real-world campaign idea for the organisation to weigh.
3. **Maker** builds the complete HTML, CSS and JavaScript microsite — hero, three navigable views, and a brief visitor-facing mention of the campaign idea in Discover — but never builds the mission-answering mechanic or reward unlock itself; the platform owns both.
4. **Communicator** drafts a ready-to-send client email that opens with the campaign proposal, then introduces the finished experience and how to distribute it.
5. **Manager** reviews evidence traceability, the working prototype and the client email together, and approves, requests revision or rejects.

## What the platform guarantees, not the agents

A recurring lesson from live testing: anything left to an LLM to remember correctly — a mission mechanic, a reward-unlock timer, an honesty boundary — eventually gets forgotten or misplaced. So the platform, not agent prompts, owns:

- Rendering and scoring the four missions, and unlocking the reward only once all four are correct (`src/code-validator.js`, `src/page-functional-test.js`)
- Keeping the reward — and an optional "show this in person" badge note — locked behind that same gate regardless of where the Maker's markup places it
- A deterministic functional test (`src/page-functional-test.js`) that loads every generated page in `jsdom`, clicks through it like a visitor, and rejects the build if any control does nothing, the reward can be seen before it's earned, or reward-view copy claims completion prematurely
- Structured-output contracts (`src/contracts.js`) that reject invalid or dishonest agent handoffs before they reach the next agent — contrast ratios, installed-font-only stacks, evidence traceability, no operational trivia disguised as a mission

Strict JSON schemas and these deterministic gates reject invalid handoffs and unsafe generated code. Experiences are displayed only after Manager approval and always run inside a sandboxed, CSP-restricted iframe. Each run is capped at nine Claude calls and a projected $0.20.

## Architecture

- Public interface: [GitHub Pages](https://phqueiroga.github.io/experience-compass/)
- API and orchestration: Vercel project `experience-compass`
- LLM: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Required external API: Google Places, the Researcher's sole grounding source for the named attraction and its hero photo
- Run state (evidence, agent outputs, usage): Vercel Blob

Vercel requires `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY` and `BLOB_READ_WRITE_TOKEN` — see `.env.example`. Secrets are never exposed by GitHub Pages. Without `ANTHROPIC_API_KEY`, the app falls back to a deterministic `MockLanguageModel` for local development.

## Verification

```bash
npm ci
npm run check
npm test
```

`app.js`/`config.js` point the static frontend at the already-deployed production API by default, so you can also preview the real, working app without deploying your own backend:

```bash
python3 -m http.server 4173   # any static server works, but the port matters
```

Then open `http://127.0.0.1:4173/index.html`. The API's CORS policy only allows `https://phqueiroga.github.io` and `http://localhost:4173` / `http://127.0.0.1:4173` as origins (see the `allowed` set in `api/runs.js` and `api/photo.js`) — serving from a different port will have the browser block the API calls. To point the frontend at your own Vercel deployment instead, edit `apiBase` in `config.js`.

`docs/agents/*.md` is generated from the live agent prompts (`npm run docs:agents`) and is checked by `test/agent-docs.test.js` to guarantee it never drifts from what is actually deployed.

## Limitations

- Google Places supplies operational place metadata, not complete historical interpretation; the attraction must supply its own real exhibits or stories, which the agents are instructed never to invent.
- Place data and the hero photo are creation-time snapshots.
- The Designer's campaign_recommendation is a proposal for the organisation to decide on; it is deliberately kept out of the delivered visitor link's substance and out of anything presented as already confirmed.
- Manager approval means the prototype passed the project's evidence, safety and honesty gates, not that business impact is guaranteed.
- No web search is used or claimed anywhere in the pipeline: the Researcher's only external source is Google Places, and its prompt explicitly forbids requesting further research.

Milestones are recoverable from Git history/tags: `adoption-v1` (the original pet-adoption prototype), `mvp-1.0` (first working attraction pipeline).
