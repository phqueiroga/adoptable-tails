import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec=promisify(execFile),deployment=process.env.VERCEL_DEPLOYMENT,ids=(process.env.RUN_IDS??"").split(",").filter(Boolean),terminal=new Set(["approved","revision_required","rejected"]);
if(!deployment||!ids.length)throw new Error("VERCEL_DEPLOYMENT and RUN_IDS are required");

async function call(path,{method="GET",body}={}){const args=["curl",path,"--deployment",deployment,"--yes","--","--silent","--show-error","--header","Origin: https://phqueiroga.github.io"];if(method==="POST")args.push("--request","POST","--header","Content-Type: application/json","--data",JSON.stringify(body));const{stdout}=await exec("vercel",args,{maxBuffer:4_000_000,timeout:320000});return JSON.parse(stdout)}
async function read(id){return call(`/api/runs?run_id=${id}`)}

for(const id of ids){let run=await read(id),retry=run.status==="failed";for(let step=0;step<7&&!terminal.has(run.status);step++){await call("/api/runs",{method:"POST",body:{action:"advance",run_id:id,retry}});retry=false;run=await read(id)}console.log(JSON.stringify({run_id:id,status:run.status,error:run.error??null,handoffs:run.handoffs?.length??0,code_valid:run.validations?.code?.valid??false,manager:run.outputs?.manager?.decision??null}))}
