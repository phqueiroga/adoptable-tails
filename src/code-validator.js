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

// Every colour and face below reads a custom property the Designer's visual_identity supplies
// (see injectIdentity), so the injected block adopts the page's identity instead of overriding
// it. The literal fallbacks only apply when no identity was declared.
const platformStyles=`.ec-badge{grid-column:1/-1;display:block!important;margin:0 auto 28px;padding:28px 24px;max-width:340px;text-align:center;border:3px solid #b8860b;border-radius:50% 50% 42% 42%;background:linear-gradient(160deg,#fdf6e3,#f3d77a 65%,#e8c158);color:#3d2b00;box-shadow:0 16px 36px #b8860b66}.ec-badge span{font-size:38px}.ec-badge p{margin:8px 0 2px;text-transform:uppercase;letter-spacing:.12em;font:700 11px var(--ec-body,system-ui);color:#7a5a00}.ec-badge h3{margin:6px 0;font:700 26px var(--ec-display,Georgia,serif);color:#3d2b00}.ec-badge small{display:block;line-height:1.35;color:#5c4300}.ec-badge-note{grid-column:1/-1;display:block!important;margin-top:14px}.ec-locked-notice{margin:16px 0;padding:14px 16px;border:1px dashed var(--ec-accent,#d4a72c);border-radius:10px;color:var(--ec-ink,#17211b);background:var(--ec-surface,transparent);font:600 14px var(--ec-body,system-ui)}.ec-missions{margin:20px 0;display:grid!important;gap:16px}.ec-progress{font:700 13px var(--ec-body,system-ui);letter-spacing:.06em;text-transform:uppercase;opacity:.75}.ec-mission{display:block!important;list-style:none;padding:18px;border:1px solid var(--ec-accent,currentColor);border-radius:14px;background:var(--ec-surface,transparent);color:var(--ec-ink,inherit)}.ec-mission.ec-done{opacity:.72}.ec-mission-title{margin:0 0 4px;font-size:1.1em;font-family:var(--ec-display,inherit)}.ec-mission-teaser{margin:0 0 10px;font-style:italic;opacity:.8}.ec-mission-question{margin:0 0 12px}.ec-answer{width:100%;box-sizing:border-box;padding:11px;margin-bottom:10px;border:1px solid var(--ec-accent,currentColor);border-radius:8px;font:inherit;background:#fff;color:#17211b}.ec-mission-actions{display:flex;flex-wrap:wrap;gap:8px}.ec-mission-actions button{padding:10px 14px;border:1px solid var(--ec-accent,currentColor);border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer}.ec-submit-btn{font-weight:700;background:var(--ec-accent,transparent);color:var(--ec-surface,inherit)}.ec-mission-actions button:focus-visible{outline:3px solid var(--ec-accent,#d4a72c);outline-offset:2px}.ec-feedback{min-height:1.4em;margin:10px 0 0;font-weight:700}.ec-feedback.ec-ok{color:#176b3a}.ec-complete{margin:18px 0 0;padding:16px;border-radius:12px;text-align:center;font:700 17px var(--ec-display,system-ui);background:var(--ec-accent,#176b3a);color:var(--ec-surface,#fff)}[data-ec-reward].ec-locked{display:none!important}.ec-confetti{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden}.ec-confetti i{position:absolute;top:-12px;width:9px;height:14px;opacity:.9;animation:ec-fall linear forwards}@keyframes ec-fall{to{transform:translateY(102vh) rotate(720deg);opacity:.15}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.ec-confetti{display:none!important}}`;

const missionEngine=`try{(function(){var rewards=[].slice.call(document.querySelectorAll('[data-ec-reward]'));var badge=document.querySelector('.ec-badge');var badgeNote=document.querySelector('.ec-badge-note');if(badge){var container=rewards.filter(function(r){return r!==badge&&r!==badgeNote})[0];if(container){if(container.firstChild!==badge)container.insertBefore(badge,container.firstChild);if(badgeNote){var anchor=badge,sib=badge.nextElementSibling;while(sib){if(/^H[1-6]$/.test(sib.tagName)){anchor=sib;break}sib=sib.nextElementSibling}container.insertBefore(badgeNote,anchor.nextSibling)}}}rewards.forEach(function(r){r.classList.add('ec-locked')});var lockNotice=null;if(rewards.length){lockNotice=document.createElement('p');lockNotice.className='ec-locked-notice';lockNotice.setAttribute('role','status');lockNotice.textContent='Complete all missions in Experience to unlock your reward.';rewards[0].parentNode.insertBefore(lockNotice,rewards[0])}var root=document.querySelector('[data-ec-missions]');if(!root)return;var items=[].slice.call(root.querySelectorAll('.ec-mission'));if(!items.length)return;var progress=root.querySelector('[data-ec-progress]');var complete=root.querySelector('[data-ec-complete]');var done={};var count=0;var norm=function(v){return String(v==null?'':v).trim().toLowerCase().replace(/\\s+/g,' ')};function celebrate(){try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var read=function(name,fallback){var v=getComputedStyle(document.documentElement).getPropertyValue(name);return(v&&v.trim())||fallback};var colours=[read('--ec-accent','#d4a72c'),read('--ec-ink','#17211b'),read('--ec-surface','#fff9d8')];var layer=document.createElement('div');layer.className='ec-confetti';layer.setAttribute('aria-hidden','true');for(var i=0;i<70;i++){var piece=document.createElement('i');piece.style.left=(Math.random()*100)+'vw';piece.style.background=colours[i%colours.length];piece.style.animationDuration=(2.4+Math.random()*1.8)+'s';piece.style.animationDelay=(Math.random()*.5)+'s';piece.style.transform='rotate('+(Math.random()*360)+'deg)';layer.appendChild(piece)}document.body.appendChild(layer);setTimeout(function(){layer.remove()},5200)}catch(error){console.error('Celebration failed',error)}}
function refresh(){if(progress)progress.textContent=count+' of '+items.length+' missions complete';if(count===items.length){if(complete)complete.hidden=false;rewards.forEach(function(r){r.classList.remove('ec-locked')});if(lockNotice)lockNotice.hidden=true;if(!root.dataset.ecCelebrated){root.dataset.ecCelebrated='1';celebrate()}}}items.forEach(function(item,index){var input=item.querySelector('.ec-answer');var feedback=item.querySelector('.ec-feedback');var answer=item.getAttribute('data-ec-answer')||'';var hint=item.getAttribute('data-ec-hint')||'';var hintBtn=item.querySelector('.ec-hint-btn');var revealBtn=item.querySelector('.ec-reveal-btn');var submitBtn=item.querySelector('.ec-submit-btn');if(hintBtn)hintBtn.addEventListener('click',function(){feedback.className='ec-feedback';feedback.textContent='Hint: '+hint});if(revealBtn)revealBtn.addEventListener('click',function(){input.value=answer;feedback.className='ec-feedback';feedback.textContent='Answer revealed — submit it to complete this mission.'});if(submitBtn)submitBtn.addEventListener('click',function(){var given=norm(input.value);var expected=norm(answer);if(!given){feedback.className='ec-feedback';feedback.textContent='Type your answer first, or use the hint.';return}if(given===expected||given.indexOf(expected)>-1){if(!done[index]){done[index]=true;count++}item.classList.add('ec-done');feedback.className='ec-feedback ec-ok';feedback.textContent='Correct — mission complete.';refresh()}else{feedback.className='ec-feedback';feedback.textContent='Not quite. Try the hint, or reveal the answer to continue.'}})});refresh()})()}catch(error){console.error('Mission engine failed',error)}`;

// Turns the Designer's declared identity into custom properties the Maker's CSS and the
// platform's own injected blocks both read, so one palette governs the whole page.
const safeColour=(value,fallback)=>/^#[0-9a-f]{3,8}$/i.test(String(value||"").trim())?String(value).trim():fallback;
const safeFontStack=(value,fallback)=>{const stack=String(value||"").trim();return stack&&!/[{}<>;@]|url\s*\(/i.test(stack)?stack:fallback};
export function injectIdentity(files={},identity){
  const palette=identity?.palette;
  if(!palette)return files;
  const vars=[
    `--ec-bg:${safeColour(palette.background,"#f5f1ed")}`,
    `--ec-surface:${safeColour(palette.surface,"#ffffff")}`,
    `--ec-ink:${safeColour(palette.ink,"#17211b")}`,
    `--ec-accent:${safeColour(palette.accent,"#d4a72c")}`,
    `--ec-display:${safeFontStack(identity.display_font,"Georgia,serif")}`,
    `--ec-body:${safeFontStack(identity.body_font,"system-ui,sans-serif")}`,
  ].join(";");
  return {...files,css:`:root{${vars}}\n${String(files.css??"")}`};
}

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
export function injectRewardBadge(files={},productType="",presentableInPerson=false){
  const html=String(files.html??"");
  const heading=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const attraction=escapeHtml((heading?.[1]??"").replace(/<[^>]+>/g,"").trim()||"Experience Compass");
  // Carries its own data-ec-reward so the lock applies wherever the Maker places the
  // {{REWARD_BADGE}} token — a Maker that drops it outside its own reward container must not
  // be able to leave the badge visible before the visitor has actually earned it.
  const badge=`<div class="ec-badge" data-ec-reward role="status" aria-label="Completion badge"><span aria-hidden="true">${badgeIcon[productType]||"✦"}</span><p>${badgeKicker[productType]||"Achievement Unlocked"}</p><h3>${attraction}</h3><small>Collector's badge — earned by completing the experience</small></div>`;
  // A sibling, not a child: nested inside .ec-badge it collided with the badge's own `small`
  // colour rule (higher specificity than a single class) and read as dark text on a dark card.
  // Kept as its own data-ec-reward element and moved alongside the badge by the mission engine
  // whenever the badge itself is repositioned, so the two never separate.
  const inPersonNote=presentableInPerson?`<p class="ec-badge-note" data-ec-reward>🎁 Show this during your visit — ask the team about a small surprise, subject to availability.</p>`:"";
  const block=`${badge}${inPersonNote}`;
  const injected=html.includes("{{REWARD_BADGE}}")?html.replaceAll("{{REWARD_BADGE}}",block):html.replace(/<\/main>/i,`${block}</main>`);
  return {...files,html:injected===html&&!html.includes("{{REWARD_BADGE}}")?html+block:injected};
}

const escapeHtml=(value="")=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
export function injectHeroMedia(files={},imageDataUrl="",attribution={label:"Photo from Google Maps",url:""}){
  const safeImage=/^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(imageDataUrl)?imageDataUrl:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23113b34'/%3E%3C/svg%3E";
  const label=escapeHtml(attribution?.label||"Photo from Google Maps"),url=/^https:\/\//i.test(attribution?.url||"")?escapeHtml(attribution.url):"";
  const credit=url?`<a href="${url}" target="_blank" rel="noopener">${label}</a>`:label;
  return{...files,html:String(files.html??"").replaceAll("{{HERO_IMAGE}}",safeImage).replaceAll("{{HERO_ATTRIBUTION}}",credit)};
}
