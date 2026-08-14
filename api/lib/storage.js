import { get, put } from "@vercel/blob";
import { createHash } from "node:crypto";

const memory = globalThis.__experienceCompassRuns ??= new Map();
const pathFor = (id) => `runs/${id}.json`;

export async function saveRun(run) {
  run.updated_at = new Date().toISOString();
  memory.set(run.id, structuredClone(run));
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(pathFor(run.id), JSON.stringify(run), { access: "private", contentType: "application/json", allowOverwrite: true, cacheControlMaxAge: 60 });
}

export async function loadRun(id) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(pathFor(id), { access: "private", useCache: false });
    if (result?.statusCode === 200) return JSON.parse(await new Response(result.stream).text());
  }
  return memory.get(id) ?? null;
}

export async function consumeRateLimit(clientId, maximum = 5) {
  const hour = new Date().toISOString().slice(0, 13);
  const digest = createHash("sha256").update(String(clientId || "unknown")).digest("hex").slice(0, 24);
  const key = `limits/${hour}/${digest}.json`;
  let count = 0;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const current = await get(key, { access: "private", useCache: false });
    if (current?.statusCode === 200) count = Number(JSON.parse(await new Response(current.stream).text()).count) || 0;
    if (count >= maximum) return false;
    await put(key, JSON.stringify({ count: count + 1, hour }), { access: "private", contentType: "application/json", allowOverwrite: true, cacheControlMaxAge: 60 });
    return true;
  }
  const memoryKey = `limit:${hour}:${digest}`;
  count = memory.get(memoryKey) || 0;
  if (count >= maximum) return false;
  memory.set(memoryKey, count + 1);
  return true;
}
