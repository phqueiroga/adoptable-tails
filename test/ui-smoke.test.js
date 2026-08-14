import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {JSDOM} from "jsdom";

test("a complete form submits, advances and renders the returned run", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const dom = new JSDOM(html, {url:"https://phqueiroga.github.io/experience-compass/", pretendToBeVisual:true});
  const {window} = dom;
  Object.assign(globalThis, {
    window,
    document:window.document,
    sessionStorage:window.sessionStorage,
    history:window.history,
    location:window.location,
    FormData:window.FormData,
  });
  window.APP_CONFIG = {apiBase:"https://mock.example/api/runs"};
  const runId = "00000000-0000-0000-0000-000000000001";
  let creates = 0, advances = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === "POST") {
      const payload = JSON.parse(options.body);
      if (payload.action === "advance") {
        advances++;
        return new Response(JSON.stringify({run_id:runId,status:"failed"}), {status:500,headers:{"content-type":"application/json"}});
      }
      creates++;
      assert.equal(payload.briefing.organisation_name, "Irish Whiskey Museum");
      assert.equal(payload.briefing.desired_duration_minutes, 60);
      return new Response(JSON.stringify({run_id:runId,status:"queued"}), {status:202,headers:{"content-type":"application/json"}});
    }
    const status = advances ? "failed" : "queued";
    return new Response(JSON.stringify({id:runId,status,error:status==="failed"?"UI_SMOKE_TEST":undefined,outputs:{},usage:{calls:0}}), {status:200,headers:{"content-type":"application/json"}});
  };
  await import(`../app.js?smoke=${Date.now()}`);
  const values = {
    organisation_name:"Irish Whiskey Museum", attraction_type:"museum", destination:"Dublin",
    engagement_problem:"Families do not engage with the full story.", target_audience:"Families with children",
    existing_content:"History of Irish whiskey and production objects", visitor_outcome:"Understand production and historical differences",
    resources_and_constraints:"Mobile-first", desired_duration_hours:"1", desired_tone:"Curious and funny",
  };
  for (const [name,value] of Object.entries(values)) window.document.querySelector(`[name="${name}"]`).value=value;
  window.document.querySelector("#brief-form").dispatchEvent(new window.SubmitEvent("submit",{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal(creates,1);
  assert.equal(advances,1);
  assert.equal(window.document.querySelector("#briefing").hidden,true);
  assert.equal(window.document.querySelector("#result").hidden,false);
  assert.match(window.document.querySelector("#result").textContent,/Run 00000000-0000-0000-0000-000000000001/);
  dom.window.close();
});
