# Experience Compass architecture

```text
GitHub Pages
briefing form, progress, evidence, approved experience
        |
        v
Vercel Functions
input validation, rate limit, orchestration, safety gates
        |
        +-- Researcher --> Google Places (required attraction grounding)
        |              --> Anthropic web search (relevant context only)
        |
        +-- five ordered Claude Haiku 4.5 agent calls
        |
        +-- private run evidence --> Vercel Blob (consistent reads)
        |
        v
GitHub Pages renders approved Maker files in a sandboxed iframe
```

## Responsibilities

- **GitHub Pages:** collects the scoped organisation briefing, starts/resumes a run, shows validated evidence and renders only approved experiences. It contains no secrets.
- **Vercel Functions:** holds API keys, validates input and handoffs, exposes controlled external tools, scans generated code, limits public run creation and returns public-safe results.
- **Research tools:** Google Places identifies and grounds the named attraction in current place metadata. Web search supplies relevant historical or cultural context. The Researcher records all calls and unknowns.
- **Vercel Blob:** privately stores briefings, tool evidence, agent outputs, validations and generated files. `useCache: false` is required because the same run record changes after every stage.

## Maker security boundary

The Maker creates semantic HTML, CSS and JavaScript. Deterministic validation rejects external scripts, network requests, browser storage, cookies, parent-window access, navigation, device permissions, `eval`, the `Function` constructor, inline event handlers and external form actions. The approved files run with a restrictive Content Security Policy inside an iframe sandbox. This engine is a safeguard, not a sixth agent.

## Evidence retained per run

- run ID, timestamps, prompt version and original briefing;
- Researcher tool decisions, exact custom tool inputs/results and source links;
- structured output for each agent;
- four validated handoffs;
- Maker safety result and acceptance checks;
- Manager decision, issues and launch conditions.

The public URL is the GitHub Pages application. Generated experiences are independent webpages inside its isolated result area, but are not separately deployed URLs.
