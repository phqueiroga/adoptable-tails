import { mkdir, writeFile } from "node:fs/promises";
import { evaluatePipeline } from "../src/evaluation.js";

const ENDPOINT = "https://wwkonnsvrwrcshzyazwa.supabase.co/functions/v1/match-agents";
const KEY = "sb_publishable_yA-F94kVfZuqkggSElECag_dGuxqDdc";

const scenarios = {
  "apartment-dog": {
    species: "dog", homeType: "apartment", hasGarden: false, childrenAge: "none",
    hasDogs: false, hasCats: false, experienceLevel: "first_time", activityLevel: "medium",
    maxAloneHours: 4, preferredAge: "adult", preferredSize: "medium", openToSpecialNeeds: false
  },
  "family-with-cat": {
    species: "either", homeType: "house", hasGarden: true, childrenAge: "under_8",
    hasDogs: false, hasCats: true, experienceLevel: "some", activityLevel: "medium",
    maxAloneHours: 5, preferredAge: "any", preferredSize: "any", openToSpecialNeeds: false
  },
  "experienced-active": {
    species: "dog", homeType: "house", hasGarden: true, childrenAge: "none",
    hasDogs: false, hasCats: false, experienceLevel: "experienced", activityLevel: "high",
    maxAloneHours: 3, preferredAge: "young", preferredSize: "large", openToSpecialNeeds: true
  },
  "long-day-apartment": {
    species: "dog", homeType: "apartment", hasGarden: false, childrenAge: "under_8",
    hasDogs: true, hasCats: true, experienceLevel: "first_time", activityLevel: "medium",
    maxAloneHours: 10, preferredAge: "any", preferredSize: "any", openToSpecialNeeds: false
  }
};

const args = process.argv.slice(2);
if (args.includes("--list")) {
  console.log(Object.keys(scenarios).join("\n"));
  process.exit(0);
}
const runAll = args.includes("--all");
const requested = args.find((arg) => !arg.startsWith("--")) ?? "apartment-dog";
if (!runAll && !scenarios[requested]) {
  console.error(`Unknown scenario: ${requested}. Use --list to see available scenarios.`);
  process.exit(2);
}
const selected = runAll ? Object.entries(scenarios) : [[requested, scenarios[requested]]];
const headers = { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` };
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForRun(runId) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`${ENDPOINT}?run_id=${encodeURIComponent(runId)}`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${data.error ?? "REQUEST_FAILED"}`);
    if (data.status === "failed") throw new Error(data.error ?? "PIPELINE_FAILED");
    if (data.status === "completed" || data.status === "rejected") return data;
    await delay(3000);
  }
  throw new Error("PIPELINE_TIMEOUT");
}

console.log(`Running ${selected.length} live scenario(s). Each scenario invokes all five Claude agents.`);
const report = { generated_at: new Date().toISOString(), endpoint: ENDPOINT, model: "Claude Haiku 4.5", results: [] };

for (const [name, profile] of selected) {
  const started = Date.now();
  console.log(`\n[${name}] Starting…`);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ profile })
    });
    let data = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${data.error ?? "REQUEST_FAILED"}`);
    if (data.status === "started") data = await waitForRun(data.run_id);
    const evaluation = evaluatePipeline(data);
    report.results.push({ scenario: name, profile, duration_seconds: Math.round((Date.now() - started) / 1000), run_id: data.run_id, evaluation });
    for (const check of evaluation.checks) console.log(`${check.passed ? "PASS" : "FAIL"}  ${check.name} — ${check.detail}`);
    console.log(`${evaluation.score}/${evaluation.total} checks passed; run ${data.run_id}`);
  } catch (error) {
    report.results.push({ scenario: name, profile, duration_seconds: Math.round((Date.now() - started) / 1000), error: error.message });
    console.error(`ERROR ${error.message}`);
  }
}

await mkdir("evaluation-results", { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const path = `evaluation-results/${stamp}.json`;
await writeFile(path, JSON.stringify(report, null, 2));
console.log(`\nEvidence saved to ${path}`);
process.exit(report.results.every((result) => result.evaluation?.passed) ? 0 : 1);
