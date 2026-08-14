const endpoint = "https://api.anthropic.com/v1/messages";
const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const retryableStatuses = new Set([408, 429, 500, 502, 503, 504, 520, 522, 524, 529]);

export function isRetryableAnthropicStatus(status) { return retryableStatuses.has(Number(status)); }

export const DEFAULT_RUN_LIMITS = Object.freeze({
  max_calls: 9,
  max_estimated_cost_usd: 0.2,
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

export function completeToolHistory(content = []) {
  const completedServerUses = new Set(content
    .filter((item) => item.type === "web_search_tool_result" && item.tool_use_id)
    .map((item) => item.tool_use_id));
  return content.filter((item) => item.type !== "server_tool_use" || completedServerUses.has(item.id));
}

export function recordServerSearches(content = [], searches = []) {
  const uses = new Map(content
    .filter((item) => item.type === "server_tool_use" && item.name === "web_search")
    .map((item) => [item.id, item.input?.query || "Focused web research"]));
  for (const result of content.filter((item) => item.type === "web_search_tool_result")) {
    if (searches.some((search) => search.tool_use_id === result.tool_use_id)) continue;
    const hits = Array.isArray(result.content) ? result.content : [];
    searches.push({tool_use_id:result.tool_use_id,query:uses.get(result.tool_use_id)||"Focused web research",urls:hits.map((hit)=>hit.url).filter(Boolean)});
  }
  return searches;
}

export function reconcileServerSearches(output, searches = []) {
  output.source_queries ??= [];
  const urlToQuery = new Map();
  searches.forEach((search,index)=>{const source_query_id=`web-${index+1}`;output.source_queries.push({source_query_id,tool:"web_search",query:search.query,queried_at:new Date().toISOString(),result_count:search.urls.length});search.urls.forEach((url)=>urlToQuery.set(url,source_query_id))});
  for (const item of output.evidence_items ?? []) {
    const matched = urlToQuery.get(item.source_url);
    if (matched) item.source_query_id = matched;
  }
  return output;
}

export function reconcileToolQueries(output, toolCalls) {
  output.source_queries??=[];
  for(const call of toolCalls){const canonical={source_query_id:call.id,tool:call.name,query:call.result?.query??JSON.stringify(call.input),queried_at:call.result?.queried_at??new Date().toISOString(),result_count:Number(call.result?.result_count) || 0},index=output.source_queries.findIndex(query=>query.source_query_id===call.id);if(index>=0)output.source_queries[index]={...output.source_queries[index],...canonical};else output.source_queries.push(canonical)}
  return output;
}

export async function callStructured(agent, input, tracker) {
  const isMaker=agent.name==="Maker",isDesigner=agent.name==="Designer",max_tokens=isMaker?5600:isDesigner?3000:2600;
  const create=(instruction)=>request({model,max_tokens,temperature:0.2,system:agent.system,messages:[{role:"user",content:JSON.stringify({...input,instruction})}],output_config:{format:{type:"json_schema",schema:agent.schema}}},tracker,agent.name);
  let message=await create(isMaker?"Build one polished but compact visitor microsite with a hero, three navigable areas, exactly four interactions, progress and a contextual reward unlock. Keep HTML + CSS + JavaScript below 9000 characters total, reuse CSS classes, keep prose concise and every non-code array to at most four items. No extra features.":"Return a compact complete handoff. Use no more than four short items per array and one short paragraph per scalar field.");
  try{return{output:parseOutput(message,agent),usage:message.usage,model}}
  catch(error){if(!(error instanceof Error)||!error.message.endsWith("_TRUNCATED_OUTPUT")||isMaker)throw error;message=await create("RETRY: produce a shorter complete handoff within the schema.");return{output:parseOutput(message,agent),usage:message.usage,model,retried:true}}
}

export async function callResearcherWithTools(agent, briefing, definitions, executor, tracker) {
  const hasPlaces=definitions.some(tool=>tool.name==="search_places");if(!hasPlaces)throw new Error("GOOGLE_MAPS_NOT_CONFIGURED");const tools=[{type:"web_search_20250305",name:"web_search",max_uses:3},...definitions],messages=[{role:"user",content:JSON.stringify({briefing,instruction:"First identify the named attraction with Google Places. Then gather only the strongest historical, cultural, observable and visitor-relevant evidence needed for Discover, Experience and Reward areas. Make no decorative calls. Return four to six concise evidence items and distinguish supplied content, sourced facts and unknowns."})}],toolCalls=[],serverSearches=[];let message,hadExternalSource=false,needsFinalResponse=false;
  for(let turn=0;turn<3;turn++){const tool_choice=turn===0?{type:"tool",name:"search_places"}:{type:"auto"},max_tokens=turn===0?900:2400;message=await request({model,max_tokens,temperature:0.15,system:agent.system,messages,tools,tool_choice,output_config:{format:{type:"json_schema",schema:agent.schema}}},tracker,agent.name);recordServerSearches(message.content,serverSearches);if(message.content?.some(item=>item.type==="web_search_tool_result"))hadExternalSource=true;const uses=message.content?.filter(item=>item.type==="tool_use")??[];if(!uses.length){needsFinalResponse=false;break}needsFinalResponse=true;messages.push({role:"assistant",content:completeToolHistory(message.content)});const results=[];for(const use of uses){try{const result=await executor(use.name,use.input),id=`tool-${toolCalls.length+1}`;toolCalls.push({id,name:use.name,input:use.input,result});results.push({type:"tool_result",tool_use_id:use.id,content:JSON.stringify({source_query_id:id,...result})})}catch(error){results.push({type:"tool_result",tool_use_id:use.id,is_error:true,content:error instanceof Error?error.message:"TOOL_FAILED"})}}messages.push({role:"user",content:results})}
  if(!message)throw new Error("RESEARCHER_EMPTY_OUTPUT");if(needsFinalResponse){messages.push({role:"user",content:"Tool-use limit reached. Return the compact handoff now with four to six strongest evidence items."});message=await request({model,max_tokens:2800,temperature:0.1,system:agent.system,messages,output_config:{format:{type:"json_schema",schema:agent.schema}}},tracker,agent.name)}let output;try{output=parseOutput(message,agent)}catch(error){if(!(error instanceof Error)||!error.message.endsWith("_TRUNCATED_OUTPUT"))throw error;messages.push({role:"user",content:"Return the same handoff radically shortened with exactly four evidence items, at most two other items per array and one sentence per field. Do not call tools."});message=await request({model,max_tokens:2500,temperature:0,system:agent.system,messages,output_config:{format:{type:"json_schema",schema:agent.schema}}},tracker,agent.name);try{output=parseOutput(message,agent)}catch{throw new Error("RESEARCHER_OUTPUT_TOO_LARGE")}}if(!toolCalls.length&&!hadExternalSource)throw new Error("RESEARCHER_DID_NOT_USE_EXTERNAL_SOURCE");
  return{output:reconcileToolQueries(reconcileServerSearches(output,serverSearches),toolCalls),tool_calls:toolCalls,usage:message.usage,model};
}
