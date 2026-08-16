import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { agents } from "../agents/definitions.js";
import { agentOrder } from "../src/contracts.js";
import { renderAgent, readable } from "../scripts/generate-agent-docs.js";

// docs/agents/*.md is what a reader (or a marker) will actually read. The existing
// docs/tourism-v2/*.md drifted from the code and ended up describing capabilities the
// implementation never had, so these are generated and checked rather than hand-written.
for (const key of agentOrder) {
  test(`docs/agents/${key}.md is regenerated from the current prompt`, async () => {
    const onDisk = await readFile(new URL(`../docs/agents/${key}.md`, import.meta.url), "utf8");
    assert.equal(onDisk, renderAgent(key), `Run \`npm run docs:agents\` — ${key}.md no longer matches agents/definitions.js`);
  });
}

test("the rendered prompt is the real prompt, only re-wrapped", () => {
  for (const key of agentOrder) {
    const collapse = (value) => value.replace(/\s+/g, " ").trim();
    assert.equal(collapse(readable(agents[key].system)), collapse(agents[key].system), `${key}'s prompt was altered, not just re-wrapped`);
  }
});
