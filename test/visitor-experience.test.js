import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {JSDOM} from "jsdom";

const runId="00000000-0000-0000-0000-000000000002";
const files={html:"<main><h1>History in Three Steps</h1><button id='next'>Continue</button></main>",css:"body{font-family:sans-serif}",javascript:"document.querySelector('#next').addEventListener('click',()=>document.body.dataset.done='true')"};

test("standalone visitor URL renders only an approved Maker product",async()=>{
  const html=await readFile(new URL("../experience.html",import.meta.url),"utf8");
  const dom=new JSDOM(html,{url:`https://phqueiroga.github.io/experience-compass/experience.html?run_id=${runId}`});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location});
  window.APP_CONFIG={apiBase:"https://mock.example/api/runs"};
  let requests=0;
  globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify({id:runId,status:"approved",outputs:{maker:{product_title:"History in Three Steps",files}}}),{status:200,headers:{"content-type":"application/json"}})};
  await import(`../experience.js?visitor=${Date.now()}`);
  await new Promise(resolve=>setTimeout(resolve,20));
  const frame=document.querySelector("iframe");
  assert.equal(requests,1);
  assert.ok(frame);
  assert.match(frame.srcdoc,/History in Three Steps/);
  assert.equal(document.querySelector("header"),null);
  dom.window.close();
});

test("standalone visitor URL refuses an unapproved product",async()=>{
  const html=await readFile(new URL("../experience.html",import.meta.url),"utf8");
  const dom=new JSDOM(html,{url:`https://phqueiroga.github.io/experience-compass/experience.html?run_id=${runId}`});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location});
  window.APP_CONFIG={apiBase:"https://mock.example/api/runs"};
  globalThis.fetch=async()=>new Response(JSON.stringify({id:runId,status:"revision_required",outputs:{maker:{files}}}),{status:200,headers:{"content-type":"application/json"}});
  await import(`../experience.js?blocked=${Date.now()}`);
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(document.querySelector("iframe"),null);
  assert.match(document.body.textContent,/has not been approved/i);
  dom.window.close();
});
