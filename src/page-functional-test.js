import { JSDOM, VirtualConsole } from "jsdom";
import { injectHeroMedia, injectMissions, injectRewardBadge, makeSrcdoc } from "./code-validator.js";

const NEXT = /\bnext\b/i;
const PREVIOUS = /\bprevious\b/i;
const REVEAL = /\breveal\b|show\s*(the\s*)?answer|skip\s*(this\s*)?(question|mission)/i;
const SUBMIT = /\bsubmit\b|\bcheck\b|\bconfirm\b/i;

function controlsOf(document) {
  return [...document.querySelectorAll("button, [role='button']")];
}

function labelOf(el) {
  return `${el.textContent || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`;
}

function isVisible(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    if (node.hidden) return false;
    const style = node.ownerDocument.defaultView.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    node = node.parentElement;
  }
  return true;
}

// jsdom has no layout engine, so overlapping boxes cannot be measured. This catches the
// structural cause behind the most common overlap: an absolutely positioned overlay that
// sits outside the container it was meant to overlay, so it anchors to the whole page or
// section instead and lands on top of unrelated content.
function unanchoredOverlays(window) {
  const offenders = [];
  for (const el of window.document.body.querySelectorAll("*")) {
    if (window.getComputedStyle(el).position !== "absolute") continue;
    let ancestor = el.parentElement;
    let anchored = false;
    while (ancestor && ancestor !== window.document.body) {
      if (["relative", "absolute", "fixed", "sticky"].includes(window.getComputedStyle(ancestor).position)) { anchored = true; break; }
      ancestor = ancestor.parentElement;
    }
    if (!anchored) offenders.push(el.getAttribute("class") || el.tagName.toLowerCase());
  }
  return [...new Set(offenders)];
}

function setInputValue(window, input, value) {
  const proto = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (nativeSetter) nativeSetter.call(input, value); else input.value = value;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
}

function answerInputsOf(window) {
  return [...window.document.querySelectorAll("input, textarea")].filter((el) => ["text", "search", ""].includes((el.getAttribute("type") || "text").toLowerCase()));
}

function hasInputAndSubmit(node) {
  const input = [...node.querySelectorAll("input, textarea")].some((el) => ["text", "search", ""].includes((el.getAttribute("type") || "text").toLowerCase()));
  const submit = [...node.querySelectorAll("button, [role='button']")].some((el) => SUBMIT.test(labelOf(el)));
  return input && submit;
}

function missionScopeOf(control) {
  let node = control.parentElement;
  while (node && node.tagName !== "BODY") {
    if (hasInputAndSubmit(node)) return node;
    node = node.parentElement;
  }
  return control.ownerDocument.body;
}

export async function testGeneratedPage(files, productType, missions = []) {
  const errors = [];
  const previewFiles = injectRewardBadge(injectMissions(injectHeroMedia(files, "", { label: "Preview photo", url: "" }), missions), productType);
  const srcdoc = makeSrcdoc(previewFiles);

  let dom;
  try {
    dom = new JSDOM(srcdoc, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://experience.invalid/", virtualConsole: new VirtualConsole() });
  } catch (error) {
    return { valid: false, errors: [`Generated page failed to load: ${error instanceof Error ? error.message : "unknown error"}`] };
  }

  const { window } = dom;
  const runtimeErrors = [];
  window.addEventListener("error", (event) => runtimeErrors.push(event.error?.message || event.message || "Unhandled error"));
  window.addEventListener("unhandledrejection", (event) => runtimeErrors.push(String(event.reason)));
  await new Promise((resolve) => setTimeout(resolve, 30));

  const contentSections = [...window.document.querySelectorAll("section")].filter((el) => (el.textContent || "").trim().length > 20);
  const everVisibleSections = new Set();
  const rewardSection = window.document.querySelector("[data-ec-reward]") || window.document.querySelector(".ec-badge")?.closest("section");
  const missionBlock = window.document.querySelector("[data-ec-missions]");
  const completeMessage = window.document.querySelector("[data-ec-complete]");
  let rewardEverVisible = false;
  let missionsEverVisible = false;
  let completeEverVisible = false;
  // Tracked over time rather than checked at the end: with tabbed navigation the completion
  // message (in Experience) and the reward (in Reward) can never be on screen simultaneously.
  const snapshotSections = () => {
    for (const el of contentSections) if (isVisible(el)) everVisibleSections.add(el);
    if (rewardSection && isVisible(rewardSection)) rewardEverVisible = true;
    if (missionBlock && isVisible(missionBlock)) missionsEverVisible = true;
    if (completeMessage && !completeMessage.hidden && isVisible(completeMessage)) completeEverVisible = true;
  };
  snapshotSections();

  const hasAnswerMechanic = answerInputsOf(window).length > 0;
  let successfulSubmissions = 0;

  const clicked = new Set();
  let mutations = 0;
  let snapshot = window.document.body.innerHTML;
  for (let pass = 0; pass < 10; pass++) {
    const pending = controlsOf(window.document).filter((el) => !clicked.has(el) && !el.disabled && !SUBMIT.test(labelOf(el)));
    if (!pending.length) break;
    for (const control of pending) {
      clicked.add(control);
      const isReveal = REVEAL.test(labelOf(control));
      try {
        control.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      } catch (error) {
        runtimeErrors.push(`Clicking "${(control.textContent || "").trim().slice(0, 40)}" threw: ${error instanceof Error ? error.message : "unknown error"}`);
      }
      void isReveal;
      const next = window.document.body.innerHTML;
      if (next !== snapshot) mutations++;
      snapshot = next;
      snapshotSections();
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  // Play every mission the way a visitor would: reveal the answer, then submit it. This runs
  // after the click sweep so the Maker's own navigation has already opened the Experience view;
  // visibility is asserted separately below rather than gating the play itself.
  const missionCards = [...window.document.querySelectorAll(".ec-mission")];
  for (const card of missionCards) {
    const input = card.querySelector(".ec-answer");
    const revealBtn = card.querySelector(".ec-reveal-btn");
    const submitBtn = card.querySelector(".ec-submit-btn");
    if (!input || !revealBtn || !submitBtn) continue;
    try {
      revealBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      if (input.value) setInputValue(window, input, input.value);
      submitBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      if (card.classList.contains("ec-done")) successfulSubmissions++;
    } catch (error) {
      runtimeErrors.push(`Playing a mission threw: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    snapshotSections();
  }

  // Navigation clicked before the reward unlocked may have left the reward view hidden behind
  // the Maker's own tab logic, so revisit every navigation-style control once more.
  for (const control of controlsOf(window.document)) {
    if (SUBMIT.test(labelOf(control)) || REVEAL.test(labelOf(control)) || /hint/i.test(labelOf(control))) continue;
    try {
      control.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    } catch { /* already reported in the main loop */ }
    snapshotSections();
  }

  if (runtimeErrors.length) errors.push(...new Set(runtimeErrors.map((message) => `Runtime error: ${message}`)));
  if (clicked.size === 0) errors.push("No functional buttons or controls were found on the generated page");
  if (clicked.size > 0 && mutations === 0) errors.push("Clicking controls produced no visible change — interactions appear non-functional");
  if (contentSections.length && everVisibleSections.size === 0) errors.push("No content section is ever visible on screen (checked via computed display/visibility) — likely a CSS class the script never toggles, or a visibility mechanism the CSS doesn't match");
  const unanchored = unanchoredOverlays(window);
  if (unanchored.length) errors.push(`These absolutely positioned elements have no positioned ancestor, so they anchor to the page instead of the box they are meant to overlay and will land on top of unrelated content: ${unanchored.join(", ")}. Nest each one inside its container and give that container position:relative.`);

  if (missionCards.length) {
    // The platform owns the mechanic, so these verify the Maker did not hide or break the block.
    if (!missionsEverVisible) errors.push("The injected mission block is never visible on screen — the Maker's CSS or view logic is hiding it, so the visitor can never play the experience");
    if (successfulSubmissions < missionCards.length) errors.push(`Only ${successfulSubmissions} of ${missionCards.length} missions could be completed by revealing and submitting the answer`);
    if (rewardSection && !rewardEverVisible) errors.push("The reward section never becomes visible even after completing every mission");
    if (!completeEverVisible) errors.push("The completion message never becomes visible after finishing every mission — the Maker's CSS or view logic is hiding it");
  } else if (hasAnswerMechanic) {
    const hasReveal = controlsOf(window.document).some((el) => REVEAL.test(labelOf(el)));
    if (!hasReveal) errors.push('A mission asks visitors to type a specific answer but has no "Reveal answer" control — visitors without on-site knowledge (or a hint that is not enough) can get permanently stuck and never reach the reward');
  }

  dom.window.close();
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
