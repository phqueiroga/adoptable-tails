import test from "node:test";
import assert from "node:assert/strict";
import { injectRewardBadge } from "../src/code-validator.js";
import { testGeneratedPage } from "../src/page-functional-test.js";

test("injectRewardBadge replaces the token with a product-aware badge", () => {
  const files = { html: '<main><h1>Dublin Quest</h1><section id="reward">Done. {{REWARD_BADGE}}</section></main>', css: "", javascript: "" };
  const result = injectRewardBadge(files, "treasure_hunt");
  assert.match(result.html, /class="ec-badge"/);
  assert.match(result.html, /Dublin Quest/);
  assert.match(result.html, /Treasure Hunt Completed/);
  assert.doesNotMatch(result.html, /\{\{REWARD_BADGE\}\}/);
});

test("injectRewardBadge still guarantees a badge when the Maker forgot the token", () => {
  const files = { html: "<main><h1>History in Three Steps</h1><section>No token here</section></main>", css: "", javascript: "" };
  const result = injectRewardBadge(files, "interactive_timeline");
  assert.match(result.html, /class="ec-badge"/);
  assert.match(result.html, /Timeline Explored/);
});

test("a working interactive timeline passes the generated-page functional test", async () => {
  const files = {
    html: '<main><header><h1>Timeline Demo</h1></header><nav>Explore</nav><section id="step" data-index="0">Step 1</section><section><button id="prev">Previous</button><button id="next">Next</button></section><section>{{REWARD_BADGE}}</section></main>',
    css: "body{font-family:sans-serif}",
    javascript: "let step=0;const steps=['Step 1','Step 2','Step 3','Step 4'];const el=document.querySelector('#step');document.querySelector('#next').addEventListener('click',()=>{step=Math.min(step+1,steps.length-1);el.textContent=steps[step]});document.querySelector('#prev').addEventListener('click',()=>{step=Math.max(step-1,0);el.textContent=steps[step]});",
  };
  const result = await testGeneratedPage(files, "interactive_timeline");
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("a timeline whose Next button does nothing fails the functional test", async () => {
  const files = {
    html: '<main><h1>Broken Timeline</h1><section><button id="prev">Previous</button><button id="next">Next</button></section></main>',
    css: "",
    javascript: "",
  };
  const result = await testGeneratedPage(files, "interactive_timeline");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => /did not advance|no visible change/i.test(message)));
});

test("a page whose button throws a runtime error fails the functional test", async () => {
  const files = {
    html: "<main><h1>Crashy Page</h1><button id='go'>Start</button></main>",
    css: "",
    javascript: "document.querySelector('#go').addEventListener('click',()=>{throw new Error('boom')});",
  };
  const result = await testGeneratedPage(files, "treasure_hunt");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => /boom/.test(message)));
});
