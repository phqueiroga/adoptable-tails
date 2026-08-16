const endpoint = "https://api.anthropic.com/v1/messages";
const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const retryableStatuses = new Set([408, 429, 500, 502, 503, 504, 520, 522, 524, 529]);

export function isRetryableAnthropicStatus(status) { return retryableStatuses.has(Number(status)); }

export const DEFAULT_RUN_LIMITS = Object.freeze({
  max_calls: 9,
  max_estimated_cost_usd: 0.20,
});

export function estimateHaikuCost(usage = {}) {
  const input = Number(usage.input_tokens || 0)
    + Number(usage.cache_creation_input_tokens || 0)
    + Number(usage.cache_read_input_tokens || 0);
  const output = Number(usage.output_tokens || 0);
  return (input / 1_000_000) + (output * 5 / 1_000_000);
}

export function createUsageTracker(existing = {}, limits = {}) {
  const state = {
    calls: Number(existing.calls || 0),
    input_tokens: Number(existing.input_tokens || 0),
    output_tokens: Number(existing.output_tokens || 0),
    estimated_cost_usd: Number(existing.estimated_cost_usd || 0),
    agents: {...(existing.agents || {})},
  };
  const configured = {
    max_calls: Number(limits.max_calls || process.env.MAX_CLAUDE_CALLS_PER_RUN || DEFAULT_RUN_LIMITS.max_calls),
    max_estimated_cost_usd: Number(limits.max_estimated_cost_usd || process.env.MAX_CLAUDE_COST_PER_RUN_USD || DEFAULT_RUN_LIMITS.max_estimated_cost_usd),
  };
  return {
    state,
    limits: configured,
    beforeCall(body) {
      if (state.calls >= configured.max_calls) throw new Error("RUN_BUDGET_CALL_LIMIT");
      const projectedInputTokens = body ? Math.ceil(JSON.stringify(body).length / 3) : 0;
      const projectedCost = estimateHaikuCost({input_tokens: projectedInputTokens, output_tokens: Number(body?.max_tokens || 0)});
      if (state.estimated_cost_usd >= configured.max_estimated_cost_usd || state.estimated_cost_usd + projectedCost > configured.max_estimated_cost_usd) throw new Error("RUN_BUDGET_COST_LIMIT");
    },
    record(agentName, usage = {}) {
      const input = Number(usage.input_tokens || 0) + Number(usage.cache_creation_input_tokens || 0) + Number(usage.cache_read_input_tokens || 0);
      const output = Number(usage.output_tokens || 0);
      const cost = estimateHaikuCost(usage);
      state.calls += 1;
      state.input_tokens += input;
      state.output_tokens += output;
      state.estimated_cost_usd = Number((state.estimated_cost_usd + cost).toFixed(6));
      const agent = state.agents[agentName] || {calls: 0, input_tokens: 0, output_tokens: 0, estimated_cost_usd: 0};
      agent.calls += 1;
      agent.input_tokens += input;
      agent.output_tokens += output;
      agent.estimated_cost_usd = Number((agent.estimated_cost_usd + cost).toFixed(6));
      state.agents[agentName] = agent;
    },
  };
}

async function request(body, tracker, agentName) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_NOT_CONFIGURED");
  tracker?.beforeCall(body);
  let lastError;for(let attempt=0;attempt<3;attempt++){const response=await fetch(endpoint,{method:"POST",headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(100000)});if(response.ok){const message=await response.json();tracker?.record(agentName,message.usage);return message}const detail=(await response.text()).slice(0,160),error=new Error(`ANTHROPIC_${response.status}_${detail}`);if(!isRetryableAnthropicStatus(response.status))throw error;lastError=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)))}throw lastError;
}

function textOf(message) { return message.content?.find((item) => item.type === "text")?.text; }

function parseOutput(message, agent) {
  const text = textOf(message);
  if (!text) throw new Error(`${agent.name}_EMPTY_OUTPUT`);
  try { return JSON.parse(text); }
  catch { throw new Error(`${agent.name}_TRUNCATED_OUTPUT`); }
}

export function ensureEvidenceTrace(output, toolCalls = [], searches = []) {
  const validIds = new Set(output.source_queries?.map((query)=>query.source_query_id)??[]);
  const placeId = toolCalls.find((call)=>call.name==="search_places")?.id;
  output.evidence_items = (output.evidence_items ?? []).filter((item) => {
    if (validIds.has(item.source_query_id)) return true;
    let host="";try{host=new URL(item.source_url).hostname}catch{}
    if (placeId&&/google\.|maps\./i.test(host)) { item.source_query_id=placeId; return true; }
    return false;
  });
  return output;
}

export function reconcileToolQueries(output, toolCalls) {
  output.source_queries??=[];
  for(const call of toolCalls){const canonical={source_query_id:call.id,tool:call.name,query:call.result?.query??JSON.stringify(call.input),queried_at:call.result?.queried_at??new Date().toISOString(),result_count:Number(call.result?.result_count) || 0},index=output.source_queries.findIndex(query=>query.source_query_id===call.id);if(index>=0)output.source_queries[index]={...output.source_queries[index],...canonical};else output.source_queries.push(canonical)}
  return output;
}

export function ensureMinimumPlaceEvidence(output, toolCalls, minimum = 4) {
  output.evidence_items ??= [];
  const placeCall = toolCalls.find((call) => call.name === "search_places" && call.result?.results?.[0]);
  if (!placeCall || output.evidence_items.length >= minimum) return output;
  const place = placeCall.result.results[0], source_query_id = placeCall.id, source_url = place.source_url;
  const candidates = [
    {suffix:"identity",label:"Place identity",fact:`Google Places identifies the attraction as ${place.label}${place.address?` at ${place.address}`:""}.`,relevance:"Grounds the experience in the correct attraction."},
    place.type&&{suffix:"category",label:"Place category",fact:`Google Places classifies ${place.label} as ${place.type.replaceAll("_"," ")}.`,relevance:"Supports an attraction-appropriate visitor format."},
    place.business_status&&{suffix:"status",label:"Current listing status",fact:`The Google Places listing reports the business status as ${place.business_status.replaceAll("_"," ").toLowerCase()}.`,relevance:"Confirms the current listing context without predicting availability."},
    Number.isFinite(place.rating)&&{suffix:"rating",label:"Visitor rating context",fact:`The listing reports a ${place.rating} rating from ${place.user_rating_count||"an unspecified number of"} Google users.`,relevance:"Provides current listing context, not evidence of visitor behaviour."},
  ].filter(Boolean);
  const ids = new Set(output.evidence_items.map((item)=>item.entity_id));
  for (const candidate of candidates) { if(output.evidence_items.length>=minimum)break;const entity_id=`${place.entity_id}:${candidate.suffix}`;if(!ids.has(entity_id))output.evidence_items.push({entity_id,source_query_id,label:candidate.label,fact:candidate.fact,source_url,relevance:candidate.relevance}); }
  return output;
}

export async function callStructured(agent, input, tracker) {
  const isMaker=agent.name==="Maker",isDesigner=agent.name==="Designer",isResearcher=agent.name==="Researcher",isCommunicator=agent.name==="Communicator",max_tokens=isMaker?9500:isDesigner?2600:isResearcher?3200:isCommunicator?2000:1200;
  const create=(instruction,tokenLimit=max_tokens)=>request({model,max_tokens:tokenLimit,temperature:0.2,system:agent.system,messages:[{role:"user",content:JSON.stringify({...input,instruction})}],output_config:{format:{type:"json_schema",schema:agent.schema}}},tracker,agent.name);
  const message=await create(isMaker?"Build one visually memorable but efficient visitor microsite: photographic hero, reason-to-visit-now, signature moment, two supporting moments, three navigable areas, exactly four missions each with a real input, hint and reveal-answer control, progress and a contextual reward unlock with a congratulations message. Keep HTML under 6000 characters, CSS under 3000, JavaScript under 2500 and all code under 11000 total. Use shared classes and concise copy. Return the complete JSON object; do not include comments, explanations or optional features. It opens from a normal link: no QR or scan. Keep every non-code array to at most four short items. No extra features.":"Return a compact complete handoff. Use no more than four short items per array and one short paragraph per scalar field.");
  return{output:parseOutput(message,agent),usage:message.usage,model};
}
