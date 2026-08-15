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

test("a timeline with stylised but working Next/Previous labels still passes", async () => {
  const files = {
    html: '<main><header><h1>Timeline Demo</h1></header><nav>Explore</nav><section id="step" data-index="0">Step 1</section><section><button id="prev">← Previous</button><button id="next" aria-label="Go to next moment">Next <span aria-hidden="true">→</span></button></section><section>{{REWARD_BADGE}}</section></main>',
    css: "",
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

// Replaced by the platform-engine tests below: the Maker can no longer build its own
// mission mechanic (contracts.js requires the {{MISSIONS}} token), so scenarios where the
// Maker's own scoring is broken are unreachable. What can still break is the Maker hiding
// or overriding the injected block with its own CSS, covered directly below.

const PLATFORM_MISSIONS = [
  { title: "Columns", teaser: "Count them", question: "How many columns?", answer: "86", hint: "Look up", evidence_id: "e1" },
  { title: "Bench", teaser: "Look closely", question: "Dominant colour?", answer: "blue", hint: "Sea-like", evidence_id: "e2" },
  { title: "Viaduct", teaser: "Find the gaps", question: "What lets light in?", answer: "arches", hint: "Curved openings", evidence_id: "e3" },
  { title: "Terrace", teaser: "Step back", question: "What pattern?", answer: "spiral", hint: "It turns", evidence_id: "e4" },
];

// The Maker supplies only layout and content: no inputs, no hint/reveal/submit buttons,
// no scoring and no unlock logic. Everything interactive comes from the platform.
const MAKER_WITHOUT_ANY_MECHANIC = {
  html: '<main><header><h1>Park Quest</h1></header><nav><button id="nav-x">Experience</button><button id="nav-r">Reward</button></nav><section><h2>Discover</h2><p>Some grounded context about the attraction goes here.</p></section><section><h2>Experience</h2><p>Framing copy written by the Maker.</p>{{MISSIONS}}</section><section data-ec-reward><h2>Reward</h2><p>The prize content written by the Maker.</p>{{REWARD_BADGE}}</section></main>',
  css: "body{font-family:Georgia,serif}",
  javascript: "document.querySelector('#nav-x').addEventListener('click',()=>{document.body.dataset.view='x'});document.querySelector('#nav-r').addEventListener('click',()=>{document.body.dataset.view='r'});",
};

test("the platform mission engine makes a mechanic-free Maker page fully playable", async () => {
  const result = await testGeneratedPage(MAKER_WITHOUT_ANY_MECHANIC, "treasure_hunt", PLATFORM_MISSIONS);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("a same-specificity Maker override cannot hide the mission block", async () => {
  const files = { ...MAKER_WITHOUT_ANY_MECHANIC, css: `${MAKER_WITHOUT_ANY_MECHANIC.css}.ec-missions{display:none}` };
  const result = await testGeneratedPage(files, "treasure_hunt", PLATFORM_MISSIONS);
  assert.deepEqual(result.errors, [], "platform CSS is emitted after the Maker's, so an equal-specificity rule loses");
});

// jsdom resolves the cascade by source order alone and ignores both specificity and
// !important (verified directly against this jsdom version), so a Maker rule that would
// out-specify the platform in a real browser cannot be reproduced in the functional test.
// The defence is therefore structural rather than observed: the platform marks the two
// rules that decide whether the experience is playable at all as !important, which real
// browsers honour. The runtime visibility check still catches JS-driven hiding, which is
// how the invisible-content bug in real-run-regression.test.js actually occurred.
test("the platform protects playability with !important on the decisive rules", async () => {
  const { makeSrcdoc } = await import("../src/code-validator.js");
  const srcdoc = makeSrcdoc({ html: "<main><h1>x</h1></main>", css: "", javascript: "" });
  assert.match(srcdoc, /\.ec-missions\{[^}]*display:grid!important/);
  assert.match(srcdoc, /\[data-ec-reward\]\.ec-locked\{display:none!important\}/);
});

test("the reward stays locked until every mission is submitted", async () => {
  const { injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const files = injectRewardBadge(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS), "treasure_hunt");
  const dom = new JSDOM(makeSrcdoc(files), { runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const reward = window.document.querySelector("[data-ec-reward]");
  const missions = [...window.document.querySelectorAll(".ec-mission")];
  assert.equal(missions.length, 4);
  assert.equal(window.getComputedStyle(reward).display, "none", "reward must start locked");

  const play = (mission) => {
    mission.querySelector(".ec-reveal-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    mission.querySelector(".ec-submit-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  };
  missions.slice(0, 3).forEach(play);
  assert.equal(window.getComputedStyle(reward).display, "none", "reward must stay locked after only three missions");

  play(missions[3]);
  assert.notEqual(window.getComputedStyle(reward).display, "none", "the fourth mission must unlock the reward");
  assert.equal(window.document.querySelector("[data-ec-complete]").hidden, false);
  assert.match(window.document.querySelector("[data-ec-progress]").textContent, /4 of 4/);
  dom.window.close();
});

test("a wrong answer is rejected and the hint does not complete the mission", async () => {
  const { injectMissions, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(makeSrcdoc(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS)), { runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const mission = window.document.querySelector(".ec-mission");
  mission.querySelector(".ec-hint-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.match(mission.querySelector(".ec-feedback").textContent, /Hint: Look up/);
  assert.equal(mission.classList.contains("ec-done"), false);

  mission.querySelector(".ec-answer").value = "12";
  mission.querySelector(".ec-submit-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.match(mission.querySelector(".ec-feedback").textContent, /Not quite/);
  assert.equal(mission.classList.contains("ec-done"), false);

  mission.querySelector(".ec-answer").value = "86";
  mission.querySelector(".ec-submit-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(mission.classList.contains("ec-done"), true);
  dom.window.close();
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
