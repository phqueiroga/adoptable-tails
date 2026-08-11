import { getAgent } from "./_shared/agents.ts";

const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const maxDailyRuns = Number(Deno.env.get("MAX_DAILY_RUNS") ?? "100");

type Profile = {
  species: "cat" | "dog" | "either";
  homeType: "apartment" | "house";
  hasGarden: boolean;
  childrenAge: "none" | "under_8" | "8_to_12" | "over_12";
  hasDogs: boolean;
  hasCats: boolean;
  experienceLevel: "first_time" | "some" | "experienced";
  activityLevel: "low" | "medium" | "high";
  maxAloneHours: number;
  preferredAge: "baby" | "young" | "adult" | "senior" | "any";
  preferredSize: "small" | "medium" | "large" | "any";
  openToSpecialNeeds: boolean;
};

type Animal = Record<string, unknown> & { id: string; name: string; status: string; species: string };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" }
  });
}

function envKey(name: "SUPABASE_PUBLISHABLE_KEYS" | "SUPABASE_SECRET_KEYS", legacy: string): string {
  const value = Deno.env.get(name);
  if (value) {
    const parsed = JSON.parse(value);
    return parsed.default ?? Object.values(parsed)[0];
  }
  return Deno.env.get(legacy) ?? "";
}

const publishableKey = envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
const secretKey = envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

function validateProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") throw new Error("INVALID_PROFILE");
  const p = value as Record<string, unknown>;
  const required = ["species", "homeType", "hasGarden", "childrenAge", "hasDogs", "hasCats", "experienceLevel", "activityLevel", "maxAloneHours", "preferredAge", "preferredSize", "openToSpecialNeeds"];
  if (required.some((key) => !(key in p))) throw new Error("INVALID_PROFILE");
  if (!Number.isInteger(p.maxAloneHours) || Number(p.maxAloneHours) < 0 || Number(p.maxAloneHours) > 10) throw new Error("INVALID_PROFILE");
  if (["hasGarden", "hasDogs", "hasCats", "openToSpecialNeeds"].some((key) => typeof p[key] !== "boolean")) throw new Error("INVALID_PROFILE");
  return p as Profile;
}

async function db(path: string, init: RequestInit = {}, useSecret = false) {
  const key = useSecret ? secretKey : publishableKey;
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) }
  });
  if (!response.ok) throw new Error(`DATABASE_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function enforceDailyCap() {
  const since = encodeURIComponent(new Date(Date.now() - 86_400_000).toISOString());
  const response = await fetch(`${supabaseUrl}/rest/v1/pipeline_runs?select=id&started_at=gte.${since}`, {
    method: "HEAD",
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, Prefer: "count=exact" }
  });
  const range = response.headers.get("content-range") ?? "*/0";
  const count = Number(range.split("/")[1] ?? 0);
  if (count >= maxDailyRuns) throw new Error("DAILY_LIMIT_REACHED");
}

async function fetchLiveAnimals(profile: Profile) {
  const species = profile.species === "either" ? "" : `&species=eq.${profile.species}`;
  const path = `animals?select=*&status=eq.available${species}&order=available_since.asc`;
  const animals = await db(path) as Animal[];
  return {
    animals,
    evidence: { source: "Supabase REST Data API", table: "public.animals", filter: `status=available${species}`, queried_at: new Date().toISOString(), record_count: animals.length }
  };
}

function conflict(profile: Profile, a: Record<string, unknown>): string | null {
  if (a.status !== "available") return "not available";
  if (profile.species !== "either" && a.species !== profile.species) return "species conflict";
  if (profile.childrenAge !== "none" && a.good_with_children === false) return "children conflict";
  if (profile.hasDogs && a.good_with_dogs === false) return "dog conflict";
  if (profile.hasCats && a.good_with_cats === false) return "cat conflict";
  if (!profile.hasGarden && a.garden_required === true) return "garden required";
  if (!profile.openToSpecialNeeds && a.special_needs === true) return "special needs conflict";
  return null;
}

function score(profile: Profile, a: Record<string, unknown>) {
  const strengths: string[] = [], concerns: string[] = [], unknowns: string[] = [];
  let earned = 0;
  const assess = (name: string, weight: number, match: boolean | null) => {
    if (match === null) unknowns.push(name);
    else if (match) { earned += weight; strengths.push(name); }
    else concerns.push(name);
  };
  const activity = { low: 0, medium: 1, high: 2 } as Record<string, number>;
  const experience = { first_time: 0, some: 1, experienced: 2 } as Record<string, number>;
  assess("home suitability", 20, profile.homeType === "house" ? true : typeof a.apartment_suitable === "boolean" ? a.apartment_suitable : null);
  assess("activity level", 20, typeof a.activity_level === "string" ? Math.abs(activity[a.activity_level] - activity[profile.activityLevel]) <= 1 : null);
  assess("alone time", 15, typeof a.max_alone_hours === "number" ? profile.maxAloneHours <= a.max_alone_hours : null);
  assess("experience", 15, typeof a.experience_required === "string" ? experience[profile.experienceLevel] >= experience[a.experience_required] : null);
  assess("age preference", 10, profile.preferredAge === "any" ? true : typeof a.age_group === "string" ? profile.preferredAge === a.age_group : null);
  assess("size preference", 10, profile.preferredSize === "any" ? true : typeof a.size === "string" ? profile.preferredSize === a.size : null);
  assess("care needs", 10, typeof a.special_needs === "boolean" ? (!a.special_needs || profile.openToSpecialNeeds) : null);
  return { animal_id: a.id, name: a.name, score: earned, strengths, concerns, unknowns };
}

async function callAgent(key: Parameters<typeof getAgent>[0], input: unknown) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_NOT_CONFIGURED");
  const agent = getAgent(key);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 2600,
      temperature: 0.2,
      system: agent.system,
      messages: [{ role: "user", content: JSON.stringify(input) }],
      output_config: { format: { type: "json_schema", schema: agent.schema } }
    })
  });
  if (!response.ok) throw new Error(`ANTHROPIC_${response.status}`);
  const message = await response.json();
  if (message.stop_reason === "max_tokens") throw new Error(`ANTHROPIC_TRUNCATED_${key.toUpperCase()}`);
  const text = message.content?.find((item: { type: string }) => item.type === "text")?.text;
  if (!text) throw new Error("ANTHROPIC_EMPTY_OUTPUT");
  return JSON.parse(text);
}

async function updateRun(id: string, patch: Record<string, unknown>) {
  await db(`pipeline_runs?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=minimal" } }, true);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  let runId: string | null = null;
  try {
    await enforceDailyCap();
    const profile = validateProfile((await req.json()).profile);
    const created = await db("pipeline_runs", { method: "POST", body: JSON.stringify({ model, profile }) }, true) as Array<{ id: string }>;
    runId = created[0].id;

    // Scout's tool call: live retrieval happens inside the Researcher stage.
    const live = await fetchLiveAnimals(profile);
    await updateRun(runId, { live_query: live.evidence });
    const fieldSemantics = {
      max_alone_hours: "Animal tolerance capacity. Compatible when animal.max_alone_hours >= profile.maxAloneHours.",
      preferredAge: "Weighted preference, not a hard exclusion.",
      preferredSize: "Weighted preference, not a hard exclusion.",
      null: "Unknown evidence; never a positive match."
    };
    const researcher = await callAgent("researcher", { profile, field_semantics: fieldSemantics, live_query: live.evidence, animals: live.animals });
    await updateRun(runId, { researcher_output: researcher });

    const designer = await callAgent("designer", { profile, field_semantics: fieldSemantics, researcher });
    await updateRun(runId, { designer_output: designer });

    const candidateIds = new Set<string>(researcher.candidate_ids ?? []);
    const scored = live.animals.filter((a) => candidateIds.has(a.id) && !conflict(profile, a)).map((a) => score(profile, a)).sort((a, b) => b.score - a.score).slice(0, 8);
    const maker = await callAgent("maker", { profile, field_semantics: fieldSemantics, designer, deterministic_candidates: scored });
    await updateRun(runId, { maker_output: maker });

    const selected = new Set<string>((maker.shortlist ?? []).map((item: { animal_id: string }) => item.animal_id));
    const selectedAnimals = live.animals.filter((a) => selected.has(a.id));
    const communicator = await callAgent("communicator", { field_semantics: fieldSemantics, maker, animals: selectedAnimals });
    await updateRun(runId, { communicator_output: communicator });

    const manager = await callAgent("manager", { profile, field_semantics: fieldSemantics, live_query: live.evidence, animals: selectedAnimals, researcher, designer, maker, communicator });
    const status = manager.decision === "approved" ? "completed" : "rejected";
    await updateRun(runId, { manager_output: manager, status, completed_at: new Date().toISOString() });

    return json({ run_id: runId, status, live_query: live.evidence, researcher, designer, maker, communicator, manager });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (runId) await updateRun(runId, { status: "failed", error_code: code, completed_at: new Date().toISOString() }).catch(() => undefined);
    const status = code === "DAILY_LIMIT_REACHED" ? 429 : code === "INVALID_PROFILE" ? 400 : code === "ANTHROPIC_NOT_CONFIGURED" ? 503 : 500;
    return json({ error: code }, status);
  }
});
