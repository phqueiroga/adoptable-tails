import { randomUUID } from "node:crypto";
import { validateBriefing, normaliseBriefing } from "../src/briefing.js";
import { executeNextStage } from "./lib/pipeline.js";
import { consumeRateLimit, loadRun, saveRun } from "./lib/storage.js";

const allowed = new Set(["https://phqueiroga.github.io", "http://localhost:4173", "http://127.0.0.1:4173"]);
const originAllowed=(request)=>{const origin=request.headers.get("origin");return !origin||allowed.has(origin)};
function headers(request) { const origin=request.headers.get("origin")||"";return {"Access-Control-Allow-Origin":allowed.has(origin)?origin:"https://phqueiroga.github.io","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store"}; }
const response=(request,body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers(request),"Content-Type":"application/json"}});

export const maxDuration = 300;
export default { async fetch(request) {
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(request)});
  if(!originAllowed(request))return response(request,{error:"ORIGIN_NOT_ALLOWED"},403);
  if(request.method==="GET") { const id=new URL(request.url).searchParams.get("run_id");if(!/^[0-9a-f-]{36}$/i.test(id||""))return response(request,{error:"INVALID_RUN_ID"},400);const run=await loadRun(id);if(!run)return response(request,{error:"RUN_NOT_FOUND"},404);return response(request,run); }
  if(request.method!=="POST")return response(request,{error:"METHOD_NOT_ALLOWED"},405);
  let payload;try{payload=await request.json();}catch{return response(request,{error:"INVALID_JSON"},400);}
  if(payload.action==="advance") { const run=await loadRun(payload.run_id);if(!run)return response(request,{error:"RUN_NOT_FOUND"},404);if(run.status==="failed"&&payload.retry===true){run.status=run.outputs.communicator?"reviewing":run.outputs.maker?"communicating":run.outputs.designer?"building":run.outputs.researcher?"designing":"queued";delete run.error;delete run.completed_at;await saveRun(run)}const updated=await executeNextStage(run);return response(request,{run_id:updated.id,status:updated.status},updated.status==="failed"?500:200); }
  const clientId=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const runLimit=process.env.VERCEL_ENV==="preview"?30:15;
  if(!await consumeRateLimit(clientId,runLimit))return response(request,{error:"RATE_LIMITED",message:`Maximum ${runLimit} new experiences per hour.`},429);
  const validation=validateBriefing(payload.briefing);if(!validation.valid)return response(request,{error:"INVALID_BRIEFING",details:validation.errors},400);
  const run={id:randomUUID(),status:"queued",created_at:new Date().toISOString(),updated_at:new Date().toISOString(),briefing:normaliseBriefing(payload.briefing),prompt_version:"attractions-v9-visit-now",outputs:{},tool_calls:[],handoffs:[],validations:{},usage:{calls:0,input_tokens:0,output_tokens:0,estimated_cost_usd:0,agents:{}}};
  await saveRun(run);return response(request,{run_id:run.id,status:run.status},202);
} };
