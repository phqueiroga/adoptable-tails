// Generates one markdown file per agent from agents/definitions.js, the single source of
// truth. Run `npm run docs:agents` after changing any prompt; a test fails if they drift.
import { mkdir, writeFile } from "node:fs/promises";
import { agents } from "../agents/definitions.js";
import { agentOrder } from "../src/contracts.js";

// What the pipeline actually hands each agent, and what the deterministic layers do around it.
// Kept here (not inferred) so the docs describe the real orchestration, not a guess.
export const context = {
  researcher: {
    receives: "The validated client briefing, plus the result of one Google Places `searchText` call that `api/lib/pipeline.js` executes *before* the model runs. The model does not choose to call a tool; the platform fetches live place data and hands it over.",
    postProcessing: [
      "`reconcileToolQueries` overwrites the query metadata the model claims with the metadata of the call that actually executed, so the audit trail cannot be fabricated.",
      "`ensureEvidenceTrace` drops any evidence item that does not trace back to a real executed query.",
      "`ensureMinimumPlaceEvidence` tops the list up to four items using factual Google Places fields.",
      "`heroMedia` deterministically picks the first result that carries a photo.",
    ],
    gates: [
      "Must record a live external query, and it must be `search_places`.",
      "At least four evidence items, each tracing to a recorded source query.",
    ],
  },
  designer: {
    receives: "The briefing, the Researcher's full output, and the available hero media.",
    postProcessing: [],
    gates: [
      "`selected_product` must be `treasure_hunt` or `interactive_timeline`.",
      "`required_evidence_ids` must all exist in the Researcher's evidence — no invented sources.",
      "At least three navigation sections and four interaction specifications.",
      "Four missions, each with a title, question, single correct answer (max 60 chars) and hint.",
      "Missions are rejected if built on operational metadata (opening hours, accessibility, ratings, address).",
      "A physical reward must be marked `proposal_requires_approval`.",
    ],
  },
  maker: {
    receives: "The briefing, the Researcher's evidence items, the available hero media, and the Designer's complete specification including the declared missions.",
    postProcessing: [
      "`sanitiseMakerFiles` strips `<link>`, `<script src>`, iframe/object/embed, inline `on*` handlers, `@import` and external `url()` before anything else runs.",
      "`injectHeroMedia`, `injectMissions` and `injectRewardBadge` replace the `{{HERO_IMAGE}}`, `{{HERO_ATTRIBUTION}}`, `{{MISSIONS}}` and `{{REWARD_BADGE}}` tokens at render time.",
      "`makeSrcdoc` wraps the result in a restrictive CSP and appends the platform mission engine.",
    ],
    gates: [
      "Product type must match the Designer's choice.",
      "All four tokens present, and the reward container marked `data-ec-reward`.",
      "Semantic structure: header, nav and at least three sections.",
      "`src/code-validator.js` bans eval, Function, fetch, storage, `window.open`, parent access, geolocation, navigation and imports; the JavaScript must compile.",
      "`src/page-functional-test.js` runs the page in jsdom: plays every mission, and verifies the mission block, completion message and reward all become visible.",
    ],
  },
  communicator: {
    receives: "The briefing, the Designer's reward strategy and full output, and a *summary* of the Maker's build — deliberately not the generated code.",
    postProcessing: [],
    gates: ["Required fields only."],
  },
  manager: {
    receives: "The briefing, the executed tool calls, the hero media, the Researcher's brief and evidence, the Designer's output, a summary of the Maker's build, the code and functional validation results, the Communicator's package, and the full handoff trail.",
    postProcessing: [],
    gates: ["`decision` must be `approved`, `revision_required` or `rejected`. This decision becomes the run's final status."],
  },
};

// The prompts are single-line template strings. Break them at sentence boundaries so they can
// be read and reviewed; the text itself is unchanged.
export const readable = (prompt) => prompt.replace(/(?<=[.:]) (?=[A-Z{“"])/g, "\n");

const fields = (schema) => Object.entries(schema.properties)
  .map(([name, spec]) => `| \`${name}\` | ${spec.description || (spec.enum ? `One of: ${spec.enum.map((v) => `\`${v}\``).join(", ")}` : spec.type)} |`)
  .join("\n");

export function renderAgent(key) {
  const agent = agents[key];
  const meta = context[key];
  const position = agentOrder.indexOf(key) + 1;
  const previous = agentOrder[position - 2];
  const next = agentOrder[position];
  return `# ${position}. ${agent.name}

> ${agent.archetype}

**Position in the pipeline:** ${previous ? `${agents[previous].name} → ` : ""}**${agent.name}**${next ? ` → ${agents[next].name}` : " → final decision"}

## Receives

${meta.receives}

## Full system prompt

<!-- Verbatim from agents/definitions.js. Line breaks added at sentence boundaries for
readability; the wording is unchanged. -->

\`\`\`text
${readable(agent.system)}
\`\`\`

## Produces

| Field | Description |
|---|---|
${fields(agent.schema)}

${meta.postProcessing.length ? `## Deterministic processing applied to its output\n\n${meta.postProcessing.map((line) => `- ${line}`).join("\n")}\n` : ""}
## Gates that must pass before the handoff is accepted

${meta.gates.map((line) => `- ${line}`).join("\n")}

---

*Generated from \`agents/definitions.js\` by \`npm run docs:agents\`. Do not edit by hand.*
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(new URL("../docs/agents/", import.meta.url), { recursive: true });
  for (const key of agentOrder) {
    const path = new URL(`../docs/agents/${key}.md`, import.meta.url);
    await writeFile(path, renderAgent(key));
    console.log(`wrote docs/agents/${key}.md`);
  }
}
