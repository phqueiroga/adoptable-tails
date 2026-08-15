const forbidden = [
  [/\beval\s*\(/i, "eval is forbidden"], [/\b(?:new\s+)?Function\s*\(/, "Function constructor is forbidden"],
  [/\bfetch\s*\(/i, "network requests are forbidden"], [/XMLHttpRequest|WebSocket|EventSource/i, "network APIs are forbidden"],
  [/document\.cookie|localStorage|sessionStorage|indexedDB/i, "browser storage is forbidden"],
  [/window\.open\s*\(/i, "opening arbitrary windows is forbidden"],
  [/\b(?:window\s*\.\s*)?(?:parent|top|opener)\s*\.\s*(?:location|document|postMessage|frames|eval)\b/i, "parent-page access is forbidden"], [/navigator\.(geolocation|mediaDevices)/i, "device permissions are forbidden"],
  [/window\.location|location\s*=/i, "navigation is forbidden"], [/import\s*\(|\bimport\s.+from/i, "dynamic or external imports are forbidden"]
];

export function validateMakerFiles(files = {}) {
  const errors = [];
  const html = String(files.html ?? ""), css = String(files.css ?? ""), javascript = String(files.javascript ?? "");
  if (!/<main[\s>]/i.test(html)) errors.push("HTML requires a main landmark");
  if (!/<h1[\s>]/i.test(html)) errors.push("HTML requires one primary heading");
  if (/<script[^>]+src=/i.test(html) || /<iframe|<object|<embed/i.test(html)) errors.push("External or nested content is forbidden");
  if (/\son[a-z]+\s*=/i.test(html)) errors.push("Inline event handlers are forbidden");
  if (/<form[^>]+action=/i.test(html)) errors.push("External form actions are forbidden");
  if (/<link[^>]+href=/i.test(html)) errors.push("External stylesheets are forbidden");
  if (/<a[^>]+href\s*=\s*["']https?:/i.test(html)) errors.push("External links are forbidden");
  if (/@import|url\s*\(\s*['\"]?https?:/i.test(css)) errors.push("External CSS resources are forbidden");
  for (const [pattern, message] of forbidden) if (pattern.test(javascript)) errors.push(message);
  if(javascript){try{Function(javascript)}catch(error){errors.push(`JavaScript syntax error: ${error instanceof Error?error.message:"invalid syntax"}`)}}
  if (html.length > 30000 || css.length > 30000 || javascript.length > 40000) errors.push("Generated files exceed size limits");
  return { valid: errors.length === 0, errors };
}

export function sanitiseMakerFiles(files = {}) {
  let html=String(files.html??"");
  html=html.replace(/<link\b[^>]*>/gi,"").replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/script>/gi,"").replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi,"").replace(/<embed\b[^>]*>/gi,"").replace(/\son[a-z]+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi,"");
  return{html,css:String(files.css??"").replace(/@import[^;]+;?/gi,"").replace(/url\s*\(\s*["']?https?:[^)]+\)/gi,"none"),javascript:String(files.javascript??"")};
}

export function makeSrcdoc(files) {
  const csp = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${files.css}${platformStyles}<\/style></head><body>${files.html}<script>${files.javascript}\n${missionEngine}<\/script></body></html>`;
}

const platformStyles=`.ec-badge{margin:20px auto;padding:24px;max-width:320px;text-align:center;border:2px solid #d4a72c;border-radius:50% 50% 42% 42%;background:radial-gradient(circle at 30% 20%,#fff9d8,#d4a72c);color:#17211b;box-shadow:0 12px 28px #0004}.ec-badge span{font-size:34px}.ec-badge p{margin:8px 0 2px;text-transform:uppercase;letter-spacing:.12em;font:700 11px system-ui}.ec-badge h3{margin:6px 0;font:700 25px Georgia,serif}.ec-badge small{display:block;line-height:1.35}.ec-missions{margin:20px 0;display:grid!important;gap:16px}.ec-progress{font:700 13px system-ui;letter-spacing:.06em;text-transform:uppercase;opacity:.75}.ec-mission{list-style:none;padding:18px;border:1px solid currentColor;border-radius:14px}.ec-mission.ec-done{opacity:.72}.ec-mission-title{margin:0 0 4px;font-size:1.1em}.ec-mission-teaser{margin:0 0 10px;font-style:italic;opacity:.8}.ec-mission-question{margin:0 0 12px}.ec-answer{width:100%;box-sizing:border-box;padding:11px;margin-bottom:10px;border:1px solid currentColor;border-radius:8px;font:inherit;background:#fff;color:#17211b}.ec-mission-actions{display:flex;flex-wrap:wrap;gap:8px}.ec-mission-actions button{padding:10px 14px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer}.ec-submit-btn{font-weight:700}.ec-mission-actions button:focus-visible{outline:3px solid #d4a72c;outline-offset:2px}.ec-feedback{min-height:1.4em;margin:10px 0 0;font-weight:700}.ec-feedback.ec-ok{color:#176b3a}.ec-complete{margin:18px 0 0;padding:16px;border-radius:12px;text-align:center;font:700 17px system-ui;background:#176b3a;color:#fff}[data-ec-reward].ec-locked{display:none!important}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const missionEngine=`try{(function(){var root=document.querySelector('[data-ec-missions]');if(!root)return;var items=[].slice.call(root.querySelectorAll('.ec-mission'));if(!items.length)return;var progress=root.querySelector('[data-ec-progress]');var complete=root.querySelector('[data-ec-complete]');var reward=document.querySelector('[data-ec-reward]');var done={};var count=0;var norm=function(v){return String(v==null?'':v).trim().toLowerCase().replace(/\\s+/g,' ')};if(reward)reward.classList.add('ec-locked');function refresh(){if(progress)progress.textContent=count+' of '+items.length+' missions complete';if(count===items.length){if(complete)complete.hidden=false;if(reward)reward.classList.remove('ec-locked')}}items.forEach(function(item,index){var input=item.querySelector('.ec-answer');var feedback=item.querySelector('.ec-feedback');var answer=item.getAttribute('data-ec-answer')||'';var hint=item.getAttribute('data-ec-hint')||'';var hintBtn=item.querySelector('.ec-hint-btn');var revealBtn=item.querySelector('.ec-reveal-btn');var submitBtn=item.querySelector('.ec-submit-btn');if(hintBtn)hintBtn.addEventListener('click',function(){feedback.className='ec-feedback';feedback.textContent='Hint: '+hint});if(revealBtn)revealBtn.addEventListener('click',function(){input.value=answer;feedback.className='ec-feedback';feedback.textContent='Answer revealed — submit it to complete this mission.'});if(submitBtn)submitBtn.addEventListener('click',function(){var given=norm(input.value);var expected=norm(answer);if(!given){feedback.className='ec-feedback';feedback.textContent='Type your answer first, or use the hint.';return}if(given===expected||given.indexOf(expected)>-1){if(!done[index]){done[index]=true;count++}item.classList.add('ec-done');feedback.className='ec-feedback ec-ok';feedback.textContent='Correct — mission complete.';refresh()}else{feedback.className='ec-feedback';feedback.textContent='Not quite. Try the hint, or reveal the answer to continue.'}})});refresh()})()}catch(error){console.error('Mission engine failed',error)}`;

export function injectMissions(files={},missions=[]){
  const html=String(files.html??"");
  const list=(Array.isArray(missions)?missions:[]).filter(mission=>mission&&mission.question&&mission.answer);
  if(!list.length)return {...files,html:html.replaceAll("{{MISSIONS}}","")};
  const cards=list.map((mission,index)=>`<li class="ec-mission" data-ec-answer="${escapeHtml(mission.answer)}" data-ec-hint="${escapeHtml(mission.hint||"Look closely at the details described above.")}"><h3 class="ec-mission-title">${index+1}. ${escapeHtml(mission.title||`Mission ${index+1}`)}</h3><p class="ec-mission-teaser">${escapeHtml(mission.teaser||"")}</p><p class="ec-mission-question">${escapeHtml(mission.question)}</p><input type="text" class="ec-answer" aria-label="Your answer for mission ${index+1}" placeholder="Type your answer"><div class="ec-mission-actions"><button type="button" class="ec-hint-btn">Need a hint?</button><button type="button" class="ec-reveal-btn">Reveal answer</button><button type="button" class="ec-submit-btn">Submit</button></div><p class="ec-feedback" role="status"></p></li>`).join("");
  const block=`<div class="ec-missions" data-ec-missions><p class="ec-progress" data-ec-progress>0 of ${list.length} missions complete</p><ol class="ec-mission-list">${cards}</ol><p class="ec-complete" data-ec-complete hidden>Congratulations — you completed all ${list.length} missions. Your reward is unlocked below.</p></div>`;
  const injected=html.includes("{{MISSIONS}}")?html.replaceAll("{{MISSIONS}}",block):html.replace(/<\/main>/i,`${block}</main>`);
  return {...files,html:injected===html?html+block:injected};
}

const badgeIcon={treasure_hunt:"🧭",interactive_timeline:"⏳"};
const badgeKicker={treasure_hunt:"Treasure Hunt Completed",interactive_timeline:"Timeline Explored"};
export function injectRewardBadge(files={},productType=""){
  const html=String(files.html??"");
  const heading=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const attraction=escapeHtml((heading?.[1]??"").replace(/<[^>]+>/g,"").trim()||"Experience Compass");
  const badge=`<div class="ec-badge" role="status" aria-label="Completion badge"><span aria-hidden="true">${badgeIcon[productType]||"✦"}</span><p>${badgeKicker[productType]||"Achievement Unlocked"}</p><h3>${attraction}</h3><small>Collector's badge — earned by completing the experience</small></div>`;
  const injected=html.includes("{{REWARD_BADGE}}")?html.replaceAll("{{REWARD_BADGE}}",badge):html.replace(/<\/main>/i,`${badge}</main>`);
  return {...files,html:injected===html&&!html.includes("{{REWARD_BADGE}}")?html+badge:injected};
}

const escapeHtml=(value="")=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
export function injectHeroMedia(files={},imageDataUrl="",attribution={label:"Photo from Google Maps",url:""}){
  const safeImage=/^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(imageDataUrl)?imageDataUrl:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23113b34'/%3E%3C/svg%3E";
  const label=escapeHtml(attribution?.label||"Photo from Google Maps"),url=/^https:\/\//i.test(attribution?.url||"")?escapeHtml(attribution.url):"";
  const credit=url?`<a href="${url}" target="_blank" rel="noopener">${label}</a>`:label;
  return{...files,html:String(files.html??"").replaceAll("{{HERO_IMAGE}}",safeImage).replaceAll("{{HERO_ATTRIBUTION}}",credit)};
}
