import {loadRun} from "./lib/storage.js";

const allowed=new Set(["https://phqueiroga.github.io","http://localhost:4173","http://127.0.0.1:4173"]);
const cors=request=>{const origin=request.headers.get("origin")||"";return{"Access-Control-Allow-Origin":allowed.has(origin)?origin:"https://phqueiroga.github.io","Vary":"Origin","Cache-Control":"no-store"}};
const json=(request,body,status)=>new Response(JSON.stringify(body),{status,headers:{...cors(request),"Content-Type":"application/json"}});

export default {async fetch(request){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...cors(request),"Access-Control-Allow-Methods":"GET"}});
  if(request.method!=="GET")return json(request,{error:"METHOD_NOT_ALLOWED"},405);
  const origin=request.headers.get("origin");if(origin&&!allowed.has(origin))return json(request,{error:"ORIGIN_NOT_ALLOWED"},403);
  const id=new URL(request.url).searchParams.get("run_id")?.toLowerCase();if(!/^[0-9a-f-]{36}$/i.test(id||""))return json(request,{error:"INVALID_RUN_ID"},400);
  const run=await loadRun(id);if(!run||run.status!=="approved")return json(request,{error:"PHOTO_NOT_AVAILABLE"},404);
  const name=run.media?.hero_photo?.name;if(!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name||"")||!process.env.GOOGLE_MAPS_API_KEY)return json(request,{error:"PHOTO_NOT_AVAILABLE"},404);
  const url=`https://places.googleapis.com/v1/${name}/media?maxWidthPx=1600&key=${encodeURIComponent(process.env.GOOGLE_MAPS_API_KEY)}`;
  const photo=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(18000)});if(!photo.ok)return json(request,{error:"PHOTO_PROVIDER_FAILED"},502);
  return new Response(photo.body,{status:200,headers:{...cors(request),"Content-Type":photo.headers.get("content-type")||"image/jpeg"}});
}};
