const endpoint = "https://api.anthropic.com/v1/messages";
const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

async function request(body) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_NOT_CONFIGURED");
  const response = await fetch(endpoint, { method:"POST", headers:{"x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"}, body:JSON.stringify(body), signal:AbortSignal.timeout(100000) });
  if (!response.ok) throw new Error(`ANTHROPIC_${response.status}_${(await response.text()).slice(0,160)}`);
  return response.json();
}

function textOf(message) { return message.content?.find((item) => item.type === "text")?.text; }

function parseOutput(message, agent) {
  const text = textOf(message);
  if (!text) throw new Error(`${agent.name}_EMPTY_OUTPUT`);
  try { return JSON.parse(text); }
  catch { throw new Error(`${agent.name}_TRUNCATED_OUTPUT`); }
}

export async function callStructured(agent, input) {
  const isForge=agent.name==="Forge",max_tokens=isForge?8000:6000;
  const create=(instruction)=>request({model,max_tokens,temperature:0.2,system:agent.system,messages:[{role:"user",content:JSON.stringify({...input,instruction})}],output_config:{format:{type:"json_schema",schema:agent.schema}}});
  let message=await create(isForge?"Build a complete but compact prototype. Keep HTML+CSS+JavaScript below 9000 characters total.":"Return the required structured handoff concisely.");
  try{return{output:parseOutput(message,agent),usage:message.usage,model}}
  catch(error){if(!(error instanceof Error)||!error.message.endsWith("_TRUNCATED_OUTPUT"))throw error;message=await create(isForge?"RETRY: your previous output was truncated. Produce a simpler complete prototype with no more than 6500 total code characters. Prioritise working core interaction and accessibility.":"RETRY: produce a shorter complete handoff within the schema.");return{output:parseOutput(message,agent),usage:message.usage,model,retried:true}}
}

export async function callResearcherWithTool(agent, briefing, toolExecutor) {
  const tools = [{name:"search_wikidata",description:"Search Wikidata live for tourism and cultural entities within the supplied destination. Must be called before the research brief.",input_schema:{type:"object",properties:{destination:{type:"string"},themes:{type:"array",items:{type:"string"}},limit:{type:"integer",minimum:6,maximum:30}},required:["destination","themes","limit"],additionalProperties:false}}];
  const first = await request({model,max_tokens:1800,temperature:0.1,system:agent.system,messages:[{role:"user",content:JSON.stringify({briefing,instruction:"Use search_wikidata now, then analyse its returned evidence."})}],tools,tool_choice:{type:"any"}});
  const toolUse = first.content?.find((item) => item.type === "tool_use" && item.name === "search_wikidata");
  if (!toolUse) throw new Error("RESEARCHER_DID_NOT_CALL_TOOL");
  const toolResult = await toolExecutor(toolUse.input);
  const second = await request({model,max_tokens:4500,temperature:0.2,system:agent.system,messages:[{role:"user",content:JSON.stringify({briefing,instruction:"Use search_wikidata now, then analyse its returned evidence."})},{role:"assistant",content:first.content},{role:"user",content:[{type:"tool_result",tool_use_id:toolUse.id,content:JSON.stringify(toolResult)}]}],output_config:{format:{type:"json_schema",schema:agent.schema}}});
  const text = textOf(second); if (!text) throw new Error("RESEARCHER_EMPTY_OUTPUT");
  const output=JSON.parse(text);
  const used=new Set(output.evidence_items.map(item=>item.entity_id));
  for(const item of toolResult.results){if(output.evidence_items.length>=3)break;if(!used.has(item.entity_id)){output.evidence_items.push({entity_id:item.entity_id,label:item.label,fact:item.description,source_url:item.source_url,relevance:"Additional source returned by the mandatory Wikidata query for Designer review."});used.add(item.entity_id)}}
  return { output, tool_call:{name:"search_wikidata",input:toolUse.input,result:toolResult}, usage:{first:first.usage,second:second.usage}, model };
}
