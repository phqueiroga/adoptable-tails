const ENDPOINT = "https://wwkonnsvrwrcshzyazwa.supabase.co/functions/v1/match-agents";
const PUBLISHABLE_KEY = "sb_publishable_yA-F94kVfZuqkggSElECag_dGuxqDdc";

const choices = {
  species: [["dog","Dog 🐕"],["cat","Cat 🐈"],["either","Either"]],
  preferredAge: [["baby","Baby"],["young","Young"],["adult","Adult"],["senior","Senior"],["any","Any age"]],
  preferredSize: [["small","Small"],["medium","Medium"],["large","Large"],["any","Any size"]],
  homeType: [["apartment","Apartment"],["house","House"]],
  hasGarden: [["true","Yes"],["false","No"]],
  childrenAge: [["none","No children"],["under_8","Under 8"],["8_to_12","8–12"],["over_12","Over 12"]],
  hasDogs: [["true","Yes"],["false","No"]],
  hasCats: [["true","Yes"],["false","No"]],
  openToSpecialNeeds: [["true","Yes, I’m open"],["false","Not currently"]],
  experienceLevel: [["first_time","First-time"],["some","Some experience"],["experienced","Experienced"]],
  activityLevel: [["low","Relaxed"],["medium","Balanced"],["high","Very active"]]
};

const profile = {};
const steps = [...document.querySelectorAll(".form-step")];
const form = document.querySelector("#match-form");
let step = 0;
let progressTimer;

document.querySelectorAll("[data-field]").forEach((container) => {
  const field = container.dataset.field;
  choices[field].forEach(([value,label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.textContent = label;
    button.dataset.value = value;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      container.querySelectorAll(".option").forEach((item) => { item.classList.remove("selected"); item.setAttribute("aria-pressed", "false"); });
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
      profile[field] = ["hasGarden","hasDogs","hasCats","openToSpecialNeeds"].includes(field) ? value === "true" : value;
      document.querySelector("#form-error").hidden = true;
    });
    container.append(button);
  });
});

const fieldsByStep = [["species","preferredAge","preferredSize"],["homeType","hasGarden","childrenAge"],["hasDogs","hasCats","openToSpecialNeeds"],["experienceLevel","activityLevel"]];
function showStep(index) {
  step = index;
  steps.forEach((item,i) => item.classList.toggle("active", i === step));
  document.querySelector("#step-label").textContent = `Step ${step + 1} of 4`;
  document.querySelector("#completion-label").textContent = `${step * 25}% complete`;
  document.querySelector("#form-progress-bar").style.width = `${(step + 1) * 25}%`;
  document.querySelector("#back-button").hidden = step === 0;
  document.querySelector("#next-button").hidden = step === 3;
  document.querySelector("#submit-button").hidden = step !== 3;
  document.querySelector("#form-error").hidden = true;
}
function validStep() { return fieldsByStep[step].every((field) => field in profile); }
document.querySelector("#next-button").addEventListener("click", () => {
  if (!validStep()) return void (document.querySelector("#form-error").hidden = false);
  showStep(step + 1); form.scrollIntoView({behavior:"smooth",block:"center"});
});
document.querySelector("#back-button").addEventListener("click", () => showStep(step - 1));
const range = document.querySelector("#maxAloneHours");
range.addEventListener("input", () => {
  const label = `${range.value} ${range.value === "1" ? "hour" : "hours"}`;
  document.querySelector("#hours-output").textContent = label;
  range.setAttribute("aria-valuetext", label);
});

const agents = [
  ["Scout","Researching live records"],["Harmony","Designing the approach"],["PawBuilder","Building the shortlist"],["TailTalk","Writing clear guidance"],["ShelterLead","Checking every claim"]
];
function renderPipeline() {
  document.querySelector("#pipeline").innerHTML = agents.map(([name,role],i) => `<li class="${i===0?"working":""}"><span class="pipeline-dot">${i+1}</span><strong>${name}</strong><span>${role}</span></li>`).join("");
}
function startProgress() {
  renderPipeline(); let current = 0;
  progressTimer = setInterval(() => {
    current = Math.min(current + 1, 4);
    document.querySelectorAll("#pipeline li").forEach((li,i) => { li.className = i < current ? "done" : i === current ? "working" : ""; });
    document.querySelector("#processing-message").textContent = `${agents[current][0]} is ${agents[current][1].toLowerCase()}.`;
  }, 16000);
}
function esc(value="") { const node=document.createElement("span"); node.textContent=String(value); return node.innerHTML; }
function list(items=[], empty="No concerns identified") { return items.length ? `<ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${esc(empty)}</p>`; }

function renderResults(data) {
  const scores = new Map((data.maker?.shortlist || []).map(item => [item.animal_id,item]));
  const cards = (data.communicator?.cards || []).map((card,i) => {
    const score = scores.get(card.animal_id);
    return `<article class="recommendation"><span class="rank">Recommendation ${i+1}</span><h3>${esc(card.title)}</h3><span class="score">${esc(score?.score ?? "—")} / 100 evidence score</span><p>${esc(card.summary)}</p><h4>Why consider</h4>${list(card.why_consider,"No supported strengths listed")}<h4>Confirm with the shelter</h4>${list(card.confirm_with_shelter,"No open questions listed")}<p class="card-cta">${esc(card.call_to_action)}</p></article>`;
  }).join("");
  const queried = new Date(data.live_query?.queried_at).toLocaleString("en-IE",{dateStyle:"medium",timeStyle:"short"});
  const handoffs = [
    ["Scout",data.researcher?.live_data_summary],["Harmony",data.designer?.design_goal],["PawBuilder",`${data.maker?.shortlist?.length || 0} evidence-backed recommendations built.`],["TailTalk",data.communicator?.headline],["ShelterLead",data.manager?.executive_summary]
  ];
  const approved = data.manager?.decision === "approved";
  const count = data.communicator?.cards?.length || 0;
  const html = `<div class="results-hero"><p class="eyebrow">Your considered shortlist</p><h2>${count ? `${count} ${count === 1 ? "animal" : "animals"} worth getting to know` : "No safe shortlist this time"}</h2><p>${esc(data.communicator?.introduction || "Explore these recommendations and speak with the shelter before deciding.")}</p><span class="evidence-pill"><span class="live-dot"></span>${esc(data.live_query?.record_count)} live records checked · ${esc(queried)}</span></div>
  <div class="recommendations">${cards || "<p>No safe recommendations were found for this profile. A shelter can help you explore other options.</p>"}</div>
  <div class="governance"><div class="notice"><h3>Before you decide</h3><p>${esc(data.communicator?.transparency_notice || data.manager?.customer_disclaimer)}</p></div><div class="manager-card"><span class="decision">Manager review · ${approved?"Approved":"Held for review"}</span><h3>${approved?"Evidence checked":"Please try again"}</h3><p>${esc(data.manager?.executive_summary)}</p></div></div>
  <details class="agent-details"><summary>See how the five agents collaborated</summary><div class="handoffs">${handoffs.map(([name,summary],i)=>`<div class="handoff"><strong>${i+1}. ${esc(name)}</strong>${esc(summary || "Stage completed.")}</div>`).join("")}</div></details>
  <div class="restart"><button class="button secondary" id="restart-button">Start a new search</button></div>`;
  const results = document.querySelector("#results"); results.innerHTML = html; results.hidden = false; results.scrollIntoView({behavior:"smooth"});
  document.querySelector("#restart-button").addEventListener("click", reset);
}
function renderError(status, code) {
  const daily = status === 429 || code === "DAILY_LIMIT_REACHED";
  const config = status === 503 || code === "ANTHROPIC_NOT_CONFIGURED";
  const title = daily ? "Today’s search limit has been reached" : config ? "The AI service is being configured" : "We couldn’t complete the search";
  const message = daily ? "To control costs, this prototype accepts a limited number of searches each day. Please return tomorrow." : config ? "The protected Claude connection isn’t available yet. Please try again later." : "No recommendations were shown because the full five-agent review did not finish safely. Please try again.";
  const results=document.querySelector("#results"); results.innerHTML=`<div class="error-state"><p class="eyebrow">Search not completed</p><h2>${title}</h2><p>${message}</p><button class="button primary" id="restart-button">Try again</button></div>`;results.hidden=false;results.scrollIntoView({behavior:"smooth"});document.querySelector("#restart-button").addEventListener("click",reset);
}
function reset(){ clearInterval(progressTimer); document.querySelector("#processing").hidden=true; document.querySelector("#results").hidden=true; document.querySelector("#matcher").hidden=false; showStep(0); document.querySelector("#matcher").scrollIntoView({behavior:"smooth"}); }

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validStep()) return void (document.querySelector("#form-error").hidden = false);
  profile.maxAloneHours = Number(range.value);
  document.querySelector("#matcher").hidden = true; document.querySelector("#results").hidden = true; document.querySelector("#processing").hidden = false;
  document.querySelector("#processing").scrollIntoView({behavior:"smooth"}); startProgress();
  try {
    const response = await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":PUBLISHABLE_KEY,"Authorization":`Bearer ${PUBLISHABLE_KEY}`},body:JSON.stringify({profile})});
    const data = await response.json().catch(()=>({error:"INVALID_RESPONSE"}));
    if (!response.ok) throw Object.assign(new Error(data.error || "REQUEST_FAILED"),{status:response.status});
    clearInterval(progressTimer); document.querySelectorAll("#pipeline li").forEach(li=>li.className="done");
    document.querySelector("#processing").hidden=true; renderResults(data);
  } catch (error) { clearInterval(progressTimer); document.querySelector("#processing").hidden=true; renderError(error.status,error.message); }
});
