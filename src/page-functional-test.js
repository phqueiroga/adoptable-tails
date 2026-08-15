import { JSDOM, VirtualConsole } from "jsdom";
import { injectHeroMedia, injectRewardBadge, makeSrcdoc } from "./code-validator.js";

const NEXT = /^\s*next\s*$/i;
const PREVIOUS = /^\s*previous\s*$/i;

function controlsOf(document) {
  return [...document.querySelectorAll("button, [role='button']")];
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

  const clicked = new Set();
  let mutations = 0;
  let snapshot = window.document.body.innerHTML;
  for (let pass = 0; pass < 5; pass++) {
    const pending = controlsOf(window.document).filter((el) => !clicked.has(el) && !el.disabled);
    if (!pending.length) break;
    for (const control of pending) {
      clicked.add(control);
      try {
        control.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      } catch (error) {
        runtimeErrors.push(`Clicking "${(control.textContent || "").trim().slice(0, 40)}" threw: ${error instanceof Error ? error.message : "unknown error"}`);
      }
      const next = window.document.body.innerHTML;
      if (next !== snapshot) mutations++;
      snapshot = next;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  if (runtimeErrors.length) errors.push(...new Set(runtimeErrors.map((message) => `Runtime error: ${message}`)));
  if (clicked.size === 0) errors.push("No functional buttons or controls were found on the generated page");
  if (clicked.size > 0 && mutations === 0) errors.push("Clicking controls produced no visible change — interactions appear non-functional");

  if (productType === "interactive_timeline") {
    const hasNext = [...clicked].some((el) => NEXT.test(el.textContent || ""));
    if (!hasNext) {
      errors.push('Timeline is missing a functional control labelled "Next"');
    } else {
      let previousSnapshot = window.document.body.innerHTML;
      let progressed = 0;
      for (let step = 0; step < 3; step++) {
        const nextButton = controlsOf(window.document).find((el) => NEXT.test(el.textContent || "") && !el.disabled);
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
      }
      if (progressed === 0) errors.push('Clicking "Next" repeatedly did not advance the timeline content');
    }
    const hasPrevious = controlsOf(window.document).some((el) => PREVIOUS.test(el.textContent || ""));
    if (!hasPrevious) errors.push('Timeline is missing a functional control labelled "Previous"');
  }

  dom.window.close();
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
