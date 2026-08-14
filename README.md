# Experience Compass

Experience Compass is an agentic studio for visitor attractions. A museum, park, heritage site, visitor centre or cultural venue supplies an engagement problem and its real stories, objects, events or areas. Five Claude Haiku 4.5 agents transform that material into either a treasure hunt or an interactive timeline.

## Five-agent workflow

1. **Researcher** identifies the attraction with Google Places, gathers relevant contextual evidence and diagnoses the opportunity.
2. **Designer** chooses a treasure hunt or interactive timeline and specifies its journey and acceptance criteria.
3. **Maker** creates original, self-contained HTML, CSS and JavaScript.
4. **Communicator** prepares launch touchpoints, copy and measurable engagement metrics.
5. **Manager** audits the evidence, handoffs, implementation, accessibility, feasibility and business value.

Strict JSON contracts and deterministic gates reject invalid handoffs and unsafe code. Generated experiences are displayed only after Manager approval and run inside a restricted iframe. Each run is limited to nine Claude calls and a projected maximum Claude cost of $0.20.

## Architecture

- Public interface: [GitHub Pages](https://phqueiroga.github.io/experience-compass/)
- API and orchestration: Vercel project `experience-compass` (the existing public API alias is retained for compatibility)
- LLM: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Required external API: Google Places, used to identify and ground the named attraction
- Contextual research: Anthropic web search, used only when historical or cultural evidence is relevant
- Private run evidence: Vercel Blob

Vercel requires `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY` and `BLOB_READ_WRITE_TOKEN`. Secrets are never exposed by GitHub Pages.

## Verification

```bash
npm run check
npm test
```

The ten-case evaluation script contains attraction-only scenarios across both permitted products. It is a paid live evaluation and must be run only with an explicit test budget.

## Limitations

- Google Places supplies operational place metadata, not complete historical interpretation.
- Web evidence and place data are creation-time snapshots.
- The attraction must supply its real exhibits or stories; the system must not invent them.
- Manager approval means the prototype passed the project gates, not that business impact is guaranteed.

The previous pet-adoption version remains recoverable from Git history/tag `adoption-v1`.
