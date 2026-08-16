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

test("the platform's own .ec-missions rule does not carry a margin, so it cannot silently override the Maker's own centering", async () => {
  // A real run set .ec-missions{max-width:800px;margin:0 auto} for a centered layout; the
  // platform's own .ec-missions rule loads after the Maker's in the same stylesheet, so an
  // unscoped margin there would win the cascade tie and strip that centering everywhere.
  const { injectMissions, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const files = injectMissions(
    { html: '<main><h1>x</h1><section>{{MISSIONS}}</section></main>', css: ".ec-missions{max-width:800px;margin:0 auto}", javascript: "" },
    [{ title: "M1", teaser: "t", question: "Q1?", answer: "86", hint: "look up", evidence_id: "e1" }],
  );
  const dom = new JSDOM(makeSrcdoc(files), { pretendToBeVisual: true });
  const wrapper = dom.window.document.querySelector("[data-ec-missions]");
  assert.equal(dom.window.getComputedStyle(wrapper).marginLeft, "auto", "the Maker's own centering margin must survive");
  dom.window.close();
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

test("the badge is repositioned above the Maker's reward cards regardless of where the token was placed", async () => {
  const { injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  // The token sits after the Maker's own reward cards, mirroring the real Berghain run where
  // the badge escaped the lock because it was a sibling, not a child, of data-ec-reward.
  const files = {
    ...MAKER_WITHOUT_ANY_MECHANIC,
    html: '<main><header><h1>Park Quest</h1></header><nav><button id="nav-x">Experience</button><button id="nav-r">Reward</button></nav><section><h2>Discover</h2><p>Some grounded context about the attraction goes here.</p></section><section><h2>Experience</h2><p>Framing copy written by the Maker.</p>{{MISSIONS}}</section><section><div data-ec-reward><p class="card">Card one</p><p class="card">Card two</p></div>{{REWARD_BADGE}}</section></main>',
  };
  const built = injectRewardBadge(injectMissions(files, PLATFORM_MISSIONS), "treasure_hunt");
  const dom = new JSDOM(makeSrcdoc(built), { runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const container = window.document.querySelector("[data-ec-reward]:not(.ec-badge)");
  assert.equal(container.firstElementChild.className, "ec-badge ec-locked", "the badge must be moved to be the first child of the Maker's reward container");
  assert.equal(window.getComputedStyle(window.document.querySelector(".ec-badge")).display, "none", "a badge placed outside data-ec-reward must still start locked");
  dom.window.close();
});

test("a not-yet-available notice is shown for the reward before completion and hides once earned", async () => {
  const { injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const files = injectRewardBadge(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS), "treasure_hunt");
  const dom = new JSDOM(makeSrcdoc(files), { runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const notice = window.document.querySelector(".ec-locked-notice");
  assert.ok(notice, "a locked notice must be inserted before the reward container");
  assert.equal(notice.hidden, false);
  const missions = [...window.document.querySelectorAll(".ec-mission")];
  for (const mission of missions) {
    mission.querySelector(".ec-reveal-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    mission.querySelector(".ec-submit-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  }
  assert.equal(notice.hidden, true, "the notice must hide once the reward unlocks");
  dom.window.close();
});

test("a Maker who writes 'Congratulations, you have unlocked...' outside the locked container fails the functional test", async () => {
  // Reproduces the real Pacha Ibiza run: a reward-intro paragraph sat as a sibling of
  // data-ec-reward, so it read as already-earned from the very first page load.
  const files = {
    ...MAKER_WITHOUT_ANY_MECHANIC,
    html: '<main><header><h1>Park Quest</h1></header><nav><button id="nav-x">Experience</button><button id="nav-r">Reward</button></nav><section><h2>Discover</h2><p>Some grounded context about the attraction goes here.</p></section><section><h2>Experience</h2><p>Framing copy written by the Maker.</p>{{MISSIONS}}</section><section><div class="content-block"><h2>Your Guide</h2><p class="reward-intro">Congratulations. You have unlocked a curated guide.</p></div><div data-ec-reward><p class="card">Card one</p></div>{{REWARD_BADGE}}</section></main>',
  };
  const result = await testGeneratedPage(files, "treasure_hunt", PLATFORM_MISSIONS);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => /announces completion before it happens/i.test(message)));
});

test("a neutral, forward-looking reward teaser outside the container still passes", async () => {
  const files = {
    ...MAKER_WITHOUT_ANY_MECHANIC,
    html: '<main><header><h1>Park Quest</h1></header><nav><button id="nav-x">Experience</button><button id="nav-r">Reward</button></nav><section><h2>Discover</h2><p>Some grounded context about the attraction goes here.</p></section><section><h2>Experience</h2><p>Framing copy written by the Maker.</p>{{MISSIONS}}</section><section><div class="content-block"><h2>Your Guide</h2><p class="reward-intro">Complete all four moments to unlock your guide.</p></div><div data-ec-reward><p class="card">Card one</p></div>{{REWARD_BADGE}}</section></main>',
  };
  const result = await testGeneratedPage(files, "treasure_hunt", PLATFORM_MISSIONS);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("badge_presentable_in_person adds an honestly hedged in-person line, styled as plain body text and still locked alongside the badge", async () => {
  const { injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const off = injectRewardBadge(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS), "treasure_hunt", false);
  assert.doesNotMatch(off.html, /ec-badge-note/);
  const on = injectRewardBadge(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS), "treasure_hunt", true);
  assert.match(on.html, /ec-badge-note/);
  assert.doesNotMatch(on.html, /redeem|guarantee/i, "the in-person note must stay hedged, never promise a gift outright");
  // A sibling of .ec-badge, not nested inside it: nesting collided with .ec-badge small's own
  // colour rule (higher specificity than a single class) and rendered as unreadable dark-on-dark.
  const dom = new JSDOM(makeSrcdoc(on), { runScripts: "dangerously", pretendToBeVisual: true });
  const note = dom.window.document.querySelector(".ec-badge-note");
  assert.ok(note);
  assert.equal(note.closest(".ec-badge"), null, "the note must not be nested inside .ec-badge, or it inherits badge-internal colour rules");
  // Styled to read as an ordinary paragraph, matching whatever text follows it, not as a
  // highlighted callout: no forced colour, weight or centering of its own.
  const style = dom.window.getComputedStyle(note);
  assert.notEqual(style.fontWeight, "800", "the note must not be forced bold");
  assert.notEqual(style.textAlign, "center", "the note must not be centered against the rest of the page's own alignment");
  assert.equal(note.getAttribute("data-ec-reward"), "", "the note carries its own data-ec-reward so it locks even though it lives outside the badge");
  assert.equal(dom.window.getComputedStyle(note).display, "none", "the in-person note starts locked, same as the badge");
  dom.window.close();
});

test("the in-person note lands after the Maker's own reward heading, not between the badge and it", async () => {
  const { injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const files = {
    ...MAKER_WITHOUT_ANY_MECHANIC,
    html: '<main><header><h1>Park Quest</h1></header><nav><button id="nav-x">Experience</button><button id="nav-r">Reward</button></nav><section><h2>Discover</h2><p>Some grounded context about the attraction goes here.</p></section><section><h2>Experience</h2><p>Framing copy written by the Maker.</p>{{MISSIONS}}</section><section data-ec-reward><h3>Congratulations — you did it</h3><p>The prize content written by the Maker.</p>{{REWARD_BADGE}}</section></main>',
  };
  const built = injectRewardBadge(injectMissions(files, PLATFORM_MISSIONS), "treasure_hunt", true);
  const dom = new JSDOM(makeSrcdoc(built), { runScripts: "dangerously", pretendToBeVisual: true });
  const container = dom.window.document.querySelector("[data-ec-reward]:not(.ec-badge):not(.ec-badge-note)");
  const order = [...container.children].map((el) => el.className || el.tagName);
  assert.deepEqual(order.slice(0, 3), ["ec-badge ec-locked", "H3", "ec-badge-note ec-locked"], "expected badge, then the Maker's own heading, then the in-person note");
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

const IDENTITY = {
  palette: { background: "#0B1A2B", surface: "#132C45", ink: "#EAF2FA", accent: "#E5B769" },
  display_font: "Didot, 'Bodoni MT', Georgia, serif",
  body_font: "Optima, Candara, sans-serif",
  display_treatment: "Large tightly-tracked italic serif",
  mood: "Nocturnal and maritime",
};

test("the Designer's identity reaches both the page and the injected block", async () => {
  const { injectIdentity, injectMissions, injectRewardBadge, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const files = injectIdentity(injectRewardBadge(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS), "treasure_hunt"), IDENTITY);
  const dom = new JSDOM(makeSrcdoc(files), { pretendToBeVisual: true });
  const styles = dom.window.getComputedStyle(dom.window.document.documentElement);
  assert.equal(styles.getPropertyValue("--ec-accent").trim(), "#E5B769");
  assert.equal(styles.getPropertyValue("--ec-display").trim(), "Didot, 'Bodoni MT', Georgia, serif");
  // The platform block must read those variables rather than hardcoding its own colours.
  assert.match(makeSrcdoc(files), /\.ec-mission\{[^}]*var\(--ec-accent/);
  dom.window.close();
});

test("a malformed identity is ignored rather than injected into the stylesheet", async () => {
  const { injectIdentity } = await import("../src/code-validator.js");
  const hostile = { palette: { background: "}</style><script>x()</script>", surface: "#fff", ink: "#000", accent: "url(evil)" }, display_font: "x;@import 'evil'", body_font: "Georgia, serif" };
  const { css } = injectIdentity({ html: "", css: "body{}", javascript: "" }, hostile);
  assert.doesNotMatch(css, /<script>|@import|url\(/);
  assert.match(css, /--ec-bg:#f5f1ed/);
  assert.match(css, /--ec-display:Georgia,serif/);
});

test("completing every mission fires the celebration once", async () => {
  const { injectMissions, makeSrcdoc } = await import("../src/code-validator.js");
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(makeSrcdoc(injectMissions(MAKER_WITHOUT_ANY_MECHANIC, PLATFORM_MISSIONS)), { runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  const play = (card) => {
    card.querySelector(".ec-reveal-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    card.querySelector(".ec-submit-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  };
  const cards = [...window.document.querySelectorAll(".ec-mission")];
  cards.slice(0, 3).forEach(play);
  assert.equal(window.document.querySelectorAll(".ec-confetti").length, 0, "must not fire before the last mission");
  play(cards[3]);
  assert.equal(window.document.querySelectorAll(".ec-confetti").length, 1);
  // Re-submitting an already-completed mission must not stack a second layer.
  play(cards[3]);
  assert.equal(window.document.querySelectorAll(".ec-confetti").length, 1);
  dom.window.close();
});
