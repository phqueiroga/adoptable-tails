import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePipeline } from "../src/evaluation.js";

const valid = {
  run_id: "b97f1c0d-36e9-4c9b-80f2-3ece0126d7c8", status: "completed",
  live_query: { source: "Supabase REST Data API", record_count: 20, queried_at: "2026-08-11T20:40:00.000Z" },
  researcher: {}, designer: {},
  maker: { shortlist: [{ animal_id: "a", score: 100 }, { animal_id: "b", score: 90 }] },
  communicator: { cards: [
    { animal_id: "a", why_consider: ["fit"], confirm_with_shelter: ["meet"], call_to_action: "Contact shelter" },
    { animal_id: "b", why_consider: ["fit"], confirm_with_shelter: ["meet"], call_to_action: "Contact shelter" }
  ], transparency_notice: "AI-assisted and non-binding; not a guarantee." },
  manager: { decision: "approved", issues: [] }
};

test("accepts a complete, traceable five-agent result", () => {
  assert.equal(evaluatePipeline(valid).passed, true);
});

test("detects a broken handoff and changed ranking", () => {
  const broken = structuredClone(valid);
  broken.communicator.cards[0].animal_id = "invented";
  broken.maker.shortlist[1].score = 110;
  const result = evaluatePipeline(broken);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((check) => check.name === "Communicator preserved candidate IDs").passed, false);
  assert.equal(result.checks.find((check) => check.name === "Scores are within 0–100").passed, false);
});

test("detects missing agents and rejected management review", () => {
  const broken = structuredClone(valid);
  delete broken.designer;
  broken.manager = { decision: "rejected", issues: ["unsupported claim"] };
  const result = evaluatePipeline(broken);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((check) => check.name === "All five agent outputs present").passed, false);
  assert.equal(result.checks.find((check) => check.name === "Manager approved the evidence").passed, false);
});
