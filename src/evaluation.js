const REQUIRED_AGENTS = ["researcher", "designer", "maker", "communicator", "manager"];

export function evaluatePipeline(data) {
  const checks = [];
  const add = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

  add("Pipeline completed", data?.status === "completed", `status=${data?.status ?? "missing"}`);
  add("Live source queried", data?.live_query?.source === "Supabase REST Data API", data?.live_query?.source ?? "missing");
  add("Live records returned", Number(data?.live_query?.record_count) > 0, `records=${data?.live_query?.record_count ?? 0}`);
  add("Query timestamp recorded", !Number.isNaN(Date.parse(data?.live_query?.queried_at)), data?.live_query?.queried_at ?? "missing");
  add("All five agent outputs present", REQUIRED_AGENTS.every((key) => data?.[key] && typeof data[key] === "object"), REQUIRED_AGENTS.filter((key) => !data?.[key]).join(", ") || "complete");

  const shortlist = data?.maker?.shortlist ?? [];
  const cards = data?.communicator?.cards ?? [];
  const scores = shortlist.map((item) => item.score);
  add("Maker returned 1–3 candidates", shortlist.length >= 1 && shortlist.length <= 3, `count=${shortlist.length}`);
  add("Scores are descending", scores.every((score, index) => index === 0 || scores[index - 1] >= score), scores.join(" > "));
  add("Scores are within 0–100", scores.every((score) => Number.isInteger(score) && score >= 0 && score <= 100), scores.join(", "));
  add("Communicator preserved candidate IDs", cards.length === shortlist.length && cards.every((card, index) => card.animal_id === shortlist[index]?.animal_id), `${cards.length} cards / ${shortlist.length} candidates`);
  add("Every card has balanced guidance", cards.every((card) => card.why_consider?.length && card.confirm_with_shelter?.length && card.call_to_action), `${cards.filter((card) => card.why_consider?.length && card.confirm_with_shelter?.length && card.call_to_action).length}/${cards.length} complete`);
  add("Transparency notice present", /AI|artificial intelligence/i.test(data?.communicator?.transparency_notice ?? "") && /non-binding|not a guarantee|does not guarantee/i.test(data?.communicator?.transparency_notice ?? ""), data?.communicator?.transparency_notice ?? "missing");
  add("Manager approved the evidence", data?.manager?.decision === "approved", `decision=${data?.manager?.decision ?? "missing"}`);
  add("Manager reported no issues", Array.isArray(data?.manager?.issues) && data.manager.issues.length === 0, `${data?.manager?.issues?.length ?? "missing"} issues`);
  add("Run ID retained for audit", typeof data?.run_id === "string" && data.run_id.length > 10, data?.run_id ?? "missing");

  return {
    passed: checks.every((check) => check.passed),
    score: checks.filter((check) => check.passed).length,
    total: checks.length,
    checks
  };
}
