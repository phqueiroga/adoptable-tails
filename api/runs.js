import { randomUUID } from "node:crypto";
import { validateBriefing, normaliseBriefing } from "../src/briefing.js";
import { executeNextStage } from "./lib/pipeline.js";
import { consumeRateLimit, loadRun, saveRun } from "./lib/storage.js";

// Maps the Manager's own issues (responsible_agent, at most two) back to the stage that must
// redo its work — restarting from the most upstream one, since regenerating an earlier stage
// naturally regenerates everything downstream of it anyway.
const STAGES = ["researching", "designing", "building", "communicating", "reviewing"];
const OUTPUT_KEY = { researching: "researcher", designing: "designer", building: "maker", communicating: "communicator", reviewing: "manager" };
export const stageForAgent = (name = "") => { const n = name.toLowerCase(); if (n.includes("research")) return "researching"; if (n.includes("design")) return "designing"; if (n.includes("maker") || n.includes("build")) return "building"; if (n.includes("communicat")) return "communicating"; return null; };
export function reviseTarget(issues) {
  const stages = [...new Set(issues.map((issue) => stageForAgent(issue.responsible_agent)).filter(Boolean))];
  if (!stages.length) return null;
  const stage = stages.reduce((earliest, s) => (STAGES.indexOf(s) < STAGES.indexOf(earliest) ? s : earliest), stages[0]);
  const index = STAGES.indexOf(stage);
  return { stage, index, clearOutputs: STAGES.slice(index).map((s) => OUTPUT_KEY[s]) };
}

const allowed = new Set(["https://phqueiroga.github.io", "http://localhost:4173", "http://127.0.0.1:4173"]);
const originAllowed=(request)=>{const origin=request.headers.get("origin");return !origin||allowed.has(origin)};
function headers(request) { const origin=request.headers.get("origin")||"";return {"Access-Control-Allow-Origin":allowed.has(origin)?origin:"https://phqueiroga.github.io","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin","Cache-Control":"no-store"}; }
const response=(request,body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers(request),"Content-Type":"application/json"}});

export const maxDuration = 300;
export default { async fetch(request) {
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(request)});
  if(!originAllowed(request))return response(request,{error:"ORIGIN_NOT_ALLOWED"},403);
  if(request.method==="GET") { const id=new URL(request.url).searchParams.get("run_id")?.toLowerCase();if(!/^[0-9a-f-]{36}$/i.test(id||""))return response(request,{error:"INVALID_RUN_ID"},400);const run=await loadRun(id);if(!run)return response(request,{error:"RUN_NOT_FOUND"},404);return response(request,run); }
  if(request.method!=="POST")return response(request,{error:"METHOD_NOT_ALLOWED"},405);
  let payload;try{payload=await request.json();}catch{return response(request,{error:"INVALID_JSON"},400);}
  const clientId=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  // Advancing costs a Claude call, so it needs its own ceiling. Without one, only run
  // *creation* was limited and a caller could keep retrying a failed run indefinitely: the
  // per-run budget caps each run's spend, but nothing capped how many runs could be driven.
  if(payload.action==="advance") { const stepLimit=process.env.VERCEL_ENV==="preview"?300:120;if(!await consumeRateLimit(`advance:${clientId}`,stepLimit))return response(request,{error:"RATE_LIMITED",message:`Maximum ${stepLimit} pipeline steps per hour.`},429);const run=await loadRun(payload.run_id?.toLowerCase());if(!run)return response(request,{error:"RUN_NOT_FOUND"},404);if(run.status==="failed"&&payload.retry===true){run.status=run.outputs.communicator?"reviewing":run.outputs.maker?"communicating":run.outputs.designer?"building":run.outputs.researcher?"designing":"queued";delete run.error;delete run.completed_at;await saveRun(run)}const updated=await executeNextStage(run);return response(request,{run_id:updated.id,status:updated.status},updated.status==="failed"?500:200); }
  // revision_required is a Manager verdict, not a failure: every earlier stage produced a
  // valid handoff, but the Manager found something specific to fix. Rather than restarting
  // the whole run and throwing away everything that was already right, jump back to the
  // stage the Manager actually named and hand that agent its own feedback to act on.
  if(payload.action==="revise") { const stepLimit=process.env.VERCEL_ENV==="preview"?300:120;if(!await consumeRateLimit(`advance:${clientId}`,stepLimit))return response(request,{error:"RATE_LIMITED",message:`Maximum ${stepLimit} pipeline steps per hour.`},429);const run=await loadRun(payload.run_id?.toLowerCase());if(!run)return response(request,{error:"RUN_NOT_FOUND"},404);if(run.status!=="revision_required")return response(request,{error:"NOT_REVISABLE",message:"Only a run with status revision_required can be revised."},409);const issues=run.outputs.manager?.issues??[];if(!issues.length)return response(request,{error:"NO_ISSUES_RECORDED"},422);const target=reviseTarget(issues);if(!target)return response(request,{error:"UNRECOGNISED_RESPONSIBLE_AGENT",message:`Could not map the Manager's issues to a stage. responsible_agent values: ${issues.map(i=>i.responsible_agent).join(", ")}`},422);run.revision_feedback=issues;run.handoffs=run.handoffs.slice(0,target.index);for(const key of target.clearOutputs)delete run.outputs[key];if(target.stage==="researching"){run.tool_calls=[];delete run.media}if(target.index<=2)run.validations={};run.status=target.stage;delete run.error;delete run.completed_at;await saveRun(run);const updated=await executeNextStage(run);return response(request,{run_id:updated.id,status:updated.status,revising:target.stage},updated.status==="failed"?500:200); }
  const runLimit=process.env.VERCEL_ENV==="preview"?30:15;
  if(!await consumeRateLimit(clientId,runLimit))return response(request,{error:"RATE_LIMITED",message:`Maximum ${runLimit} new experiences per hour.`},429);
  const validation=validateBriefing(payload.briefing);if(!validation.valid)return response(request,{error:"INVALID_BRIEFING",details:validation.errors},400);
  const run={id:randomUUID(),status:"queued",created_at:new Date().toISOString(),updated_at:new Date().toISOString(),briefing:normaliseBriefing(payload.briefing),prompt_version:"attractions-v10-cost-controlled",outputs:{},tool_calls:[],handoffs:[],validations:{},usage:{calls:0,input_tokens:0,output_tokens:0,estimated_cost_usd:0,agents:{}}};
  await saveRun(run);return response(request,{run_id:run.id,status:run.status},202);
} };
