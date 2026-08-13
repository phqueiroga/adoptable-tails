# Journey Foundry

Journey Foundry is an agentic tourism studio for organisations with a visitor-engagement problem. A client completes one briefing; five Claude Haiku 4.5 agents produce and validate one working interactive webpage.

## Workflow

1. **Atlas / Researcher** invokes the Wikidata tool and produces a sourced opportunity diagnosis.
2. **Mosaic / Designer** selects exactly one product: treasure hunt, personalised itinerary, or interactive timeline, then writes the full specification.
3. **Forge / Maker** builds self-contained HTML, CSS, and JavaScript from that specification.
4. **Beacon / Communicator** produces the visitor messaging, touchpoints, launch sequence, and metrics for the implemented product.
5. **Compass / Manager** audits every handoff, evidence trace, acceptance criterion, safety result, feasibility, and business value; it can approve, request revision, or reject.

Each LLM response uses a strict JSON schema. Deterministic gates reject invalid handoffs and unsafe generated code. Research provenance, timestamps, prompt version, and the full run are stored privately in Vercel Blob.
The public API accepts only the GitHub Pages/local origins and limits each client to five new runs per hour to protect API credit. Each agent is executed as a separate, persisted stage, so a refresh can resume the pipeline and a completed run has a shareable URL.

## Architecture

- Public UI: GitHub Pages
- API and orchestration: Vercel Functions
- Run persistence: private Vercel Blob
- LLM: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- External data: Wikidata API and SPARQL endpoint, invoked by Atlas
- Generated experience: sandboxed iframe with restrictive Content Security Policy

Detailed specifications: [scope](docs/tourism-v2/scope.md), [handoff contracts](docs/tourism-v2/handoff-contracts.md), [architecture](docs/tourism-v2/architecture.md), and [five-company evaluation](docs/five-company-evaluation.md).

## Configuration

Vercel requires `ANTHROPIC_API_KEY` and the automatically provisioned `BLOB_READ_WRITE_TOKEN`. `config.js` supplies the deployed API URL to GitHub Pages. Never commit secrets.

## Verification

```bash
npm install
npm run check
npm test
vercel build --yes
```

Manual acceptance script:

1. Submit a complete Dublin museum brief; confirm all five status stages appear and Atlas shows live Wikidata sources.
2. Confirm the result is exactly one of the three authorised products and its interactions work by mouse and keyboard.
3. Open “Inspect all five validated handoffs”; confirm the four transitions and code validation are present.
4. Submit one substantially different brief; confirm the design/product/content change rather than reproducing a template.
5. Submit an incomplete brief; confirm it cannot proceed. Temporarily use a bad API URL; confirm the UI fails safely without recommendations.

## Privacy and limitations

The briefing requests no visitor identity. Wikidata provides destination facts, not evidence of audience preferences or business performance. Generated experiences are prototypes and Manager approval is not a guarantee of commercial impact. The previous pet-adoption version remains recoverable from Git history/tag `adoption-v1`.
