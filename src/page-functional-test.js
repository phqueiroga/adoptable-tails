import { JSDOM, VirtualConsole } from "jsdom";
import { injectHeroMedia, injectRewardBadge, makeSrcdoc } from "./code-validator.js";

const NEXT = /\bnext\b/i;
const PREVIOUS = /\bprevious\b/i;
const REVEAL = /\breveal\b|show\s*(the\s*)?answer|skip\s*(this\s*)?(question|mission)/i;
const SUBMIT = /\bsubmit\b|\bcheck\b|\bconfirm\b/i;
const CELEBRATION = /congratulat|well done|all\s*done|you\s*(did|completed|finished)|mission(s)?\s*complete|all\s*missions|great\s*job|nicely\s*done/i;

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

function visibleText(window) {
  return [...window.document.body.querySelectorAll("*")]
    .filter((el) => el.children.length === 0 && (el.textContent || "").trim())
    .filter((el) => isVisible(el))
    .map((el) => el.textContent.trim())
    .join(" ");
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

export async function testGeneratedPage(files, productType) {
  const errors = [];
  const previewFiles = injectRewardBadge(injectHeroMedia(files, "", { label: "Preview photo", url: "" }), productType);
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
  const rewardSection = window.document.querySelector(".ec-badge")?.closest("section");
  let rewardEverVisible = false;
  const snapshotSections = () => {
    for (const el of contentSections) if (isVisible(el)) everVisibleSections.add(el);
    if (rewardSection && isVisible(rewardSection)) rewardEverVisible = true;
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
      if (isReveal) {
        const scope = missionScopeOf(control);
        const input = [...scope.querySelectorAll("input, textarea")].filter((el) => answerInputsOf(window).includes(el) && isVisible(el))[0];
        if (input && input.value) setInputValue(window, input, input.value);
        const submitBtn = [...scope.querySelectorAll("button, [role='button']")].find((el) => !el.disabled && isVisible(el) && !clicked.has(el) && SUBMIT.test(labelOf(el)));
        if (submitBtn) {
          clicked.add(submitBtn);
          try {
            submitBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
            successfulSubmissions++;
          } catch (error) {
            runtimeErrors.push(`Submit after reveal threw: ${error instanceof Error ? error.message : "unknown error"}`);
          }
        }
      }
      const next = window.document.body.innerHTML;
      if (next !== snapshot) mutations++;
      snapshot = next;
      snapshotSections();
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  if (runtimeErrors.length) errors.push(...new Set(runtimeErrors.map((message) => `Runtime error: ${message}`)));
  if (clicked.size === 0) errors.push("No functional buttons or controls were found on the generated page");
  if (clicked.size > 0 && mutations === 0) errors.push("Clicking controls produced no visible change — interactions appear non-functional");
  if (contentSections.length && everVisibleSections.size === 0) errors.push("No content section is ever visible on screen (checked via computed display/visibility) — likely a CSS class the script never toggles, or a visibility mechanism the CSS doesn't match");

  if (hasAnswerMechanic) {
    const hasReveal = controlsOf(window.document).some((el) => REVEAL.test(labelOf(el)));
    if (!hasReveal) errors.push('A mission asks visitors to type a specific answer but has no "Reveal answer" control — visitors without on-site knowledge (or a hint that is not enough) can get permanently stuck and never reach the reward');
    else if (successfulSubmissions === 0) errors.push('An answer input and a "Reveal answer" control both exist, but revealing and submitting an answer never registered as a successful submission — check that the input value change is picked up (a real "input" event) and that the submit control is wired up');
    if (rewardSection && !rewardEverVisible) errors.push("The reward section never becomes visible even after revealing and submitting answers for every mission — a common cause is the last mission not being counted towards completion (an off-by-one in the completion check)");
    if (!CELEBRATION.test(visibleText(window))) errors.push('No congratulations or completion message is ever shown to the visitor after finishing all missions (looked for wording like "congratulations", "well done", "all missions complete")');
  }

  if (productType === "interactive_timeline") {
    const hasNext = [...clicked].some((el) => NEXT.test(labelOf(el)));
    if (!hasNext) {
      errors.push('Timeline is missing a functional "Next" control');
    } else {
      let previousSnapshot = window.document.body.innerHTML;
      let progressed = 0;
      for (let step = 0; step < 3; step++) {
        const nextButton = controlsOf(window.document).find((el) => NEXT.test(labelOf(el)) && !el.disabled);
        if (!nextButton) break;
        try {
          nextButton.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
        } catch (error) {
          errors.push(`"Next" control threw on step ${step + 1}: ${error instanceof Error ? error.message : "unknown error"}`);
          break;
        }
        const after = window.document.body.innerHTML;
        if (after !== previousSnapshot) progressed++;
        previousSnapshot = after;
        snapshotSections();
      }
      if (progressed === 0) errors.push('Clicking "Next" repeatedly did not advance the timeline content');
    }
    const hasPrevious = [...clicked].some((el) => PREVIOUS.test(labelOf(el)));
    if (!hasPrevious) errors.push('Timeline is missing a functional "Previous" control');
  }

  dom.window.close();
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
