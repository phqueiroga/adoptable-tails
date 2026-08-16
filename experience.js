import {injectHeroMedia,injectIdentity,injectMissions,injectRewardBadge,makeSrcdoc} from "./src/code-validator.js";

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
    const photo=run.media?.hero_photo,author=photo?.author_attributions?.[0];let data="";
    if(photo){try{const photoResponse=await fetch(`${API.replace(/\/runs$/,"/photo")}?run_id=${encodeURIComponent(runId)}`);if(photoResponse.ok){const blob=await photoResponse.blob();data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}}catch{}}
    const files=injectIdentity(injectRewardBadge(injectMissions(injectHeroMedia(run.outputs.maker.files,data,{label:author?.display_name?`Photo by ${author.display_name} on Google Maps`:`Photo of ${photo?.place_name||"the attraction"} from Google Maps`,url:author?.uri||photo?.google_maps_uri||""}),run.outputs.designer?.missions),run.outputs.maker.product_type,run.outputs.designer?.reward_strategy?.badge_presentable_in_person),run.outputs.designer?.visual_identity);
    document.title=`${run.outputs.maker.product_title} · Experience Compass`;
    root.innerHTML='<iframe title="Visitor experience" sandbox="allow-scripts allow-modals allow-popups"></iframe>';
    root.querySelector("iframe").srcdoc=makeSrcdoc(files);
  }catch(error){fail(error.message||"The experience could not be opened.")}
}
openExperience();
