import {makeSrcdoc} from "./src/code-validator.js";

const API=window.APP_CONFIG?.apiBase||"http://localhost:3000/api/runs";
const root=document.querySelector("#visitor-product");
const runId=new URLSearchParams(location.search).get("run_id");
const validId=/^[0-9a-f-]{36}$/i.test(runId||"");

function fail(message){root.innerHTML=`<section class="visitor-error"><p class="mark">EC</p><h1>Experience unavailable</h1><p>${message}</p><a href="./">Return to Experience Compass</a></section>`}

async function openExperience(){
  if(!validId)return fail("This link does not contain a valid experience ID.");
  try{
    const response=await fetch(`${API}?run_id=${encodeURIComponent(runId)}`),run=await response.json();
    if(!response.ok)throw new Error("The experience could not be found.");
    if(run.status!=="approved"||!run.outputs?.maker?.files)throw new Error("This experience has not been approved for visitors.");
    document.title=`${run.outputs.maker.product_title} · Experience Compass`;
    root.innerHTML='<iframe title="Visitor experience" sandbox="allow-scripts"></iframe>';
    root.querySelector("iframe").srcdoc=makeSrcdoc(run.outputs.maker.files);
  }catch(error){fail(error.message||"The experience could not be opened.")}
}
openExperience();
