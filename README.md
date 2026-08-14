# Experience Compass

Experience Compass is an agentic tourism studio for hotels, tourism agencies and attractions. A client submits one engagement problem; five Claude Haiku 4.5 agents research it, design one of three permitted experience categories, build a working interactive webpage, prepare its customer-engagement plan and decide whether it is ready to launch.

## Five-agent workflow

1. **Researcher** decides which live sources are relevant, gathers evidence and diagnoses the opportunity.
2. **Designer** selects exactly one product—treasure hunt, personalised itinerary or interactive timeline—and specifies its journey and acceptance criteria.
3. **Maker** creates original, self-contained HTML, CSS and JavaScript for that specification.
4. **Communicator** prepares touchpoints, launch copy, channel actions and measurable engagement metrics for the implemented product.
5. **Manager** audits evidence, handoffs, code validation, acceptance criteria, communication, feasibility and business value; it approves, requests revision or rejects.

Each response follows a strict JSON schema. Deterministic gates reject invalid handoffs and unsafe generated code. Run IDs, timestamps, external queries, agent outputs and validations are stored privately in Vercel Blob. Generated experiences are shown only after Manager approval and run inside a restricted iframe.

## Live data and architecture

- Public interface: [GitHub Pages](https://phqueiroga.github.io/adoptable-tails/)
- API/orchestration: Vercel Functions
- LLM: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Contextual research: Anthropic web search
- Current places and operational metadata: Google Places API
- Distance and travel duration: Google Routes API
- Current conditions and forecast: Open-Meteo
- Private run evidence: Vercel Blob with uncached consistent reads

The Researcher chooses tools according to the engagement problem. Weather and routing are not called decoratively. If movement is permitted, the Researcher must resolve locations and test at least one representative route. Every executed custom tool call is inserted into the permanent query audit even if the model omits it from its response.

## Configuration

Vercel requires `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY` and the automatically provisioned `BLOB_READ_WRITE_TOKEN`. Open-Meteo does not require a key. `config.js` contains only the public API URL. Secrets must never be committed or exposed to GitHub Pages.

## Verification

```bash
npm install
npm run check
npm test
node scripts/run-ten-company-eval.js
```

The automated suite currently contains 11 contract, safety, form, traceability and rate-limit tests. The ten-company live evaluation covers hotels, agencies and five attraction types; movement and fixed-site problems; walking, public transport and driving; weather-relevant and weather-irrelevant contexts; and all three product categories. See [the evaluation report](docs/five-company-evaluation.md) and [short testing guide](docs/testing-guide-tourism.md).

## Limitations

- Five sequential agents and live tools make generation take several minutes.
- Live source data is a creation-time snapshot, not a guarantee of conditions at visit time.
- Google accessibility and opening-hour fields may be absent; missing values remain unknown.
- Manager approval means the prototype passed the defined evidence and quality checks, not that business impact is guaranteed.
- Anthropic API credit is required for each agent call; incomplete runs stop safely and publish no experience.

The previous pet-adoption version remains recoverable from Git history/tag `adoption-v1`.
