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
  const bootstrap=`try{if(typeof initExperience==='function'){const originalInit=initExperience;const bindVisiblePuzzleCards=()=>{if(typeof missions==='undefined'||typeof completedMissions==='undefined')return;document.querySelectorAll('#missions-container .mission-card').forEach((card,index)=>{const cleanCard=card.cloneNode(true);card.replaceWith(cleanCard);cleanCard.style.cursor='pointer';cleanCard.addEventListener('click',()=>openVisiblePuzzle(missions[index]));cleanCard.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openVisiblePuzzle(missions[index])}})})};initExperience=()=>{originalInit();bindVisiblePuzzleCards()};const openVisiblePuzzle=mission=>{const previous=document.querySelector('.ec-puzzle');if(previous)previous.remove();const panel=document.createElement('section');panel.className='ec-puzzle';const title=document.createElement('h3');title.textContent=mission.title;const question=document.createElement('p');question.textContent=mission.question;const feedback=document.createElement('p');feedback.className='ec-feedback';panel.append(title,question);mission.options.forEach((option,index)=>{const choice=document.createElement('button');choice.type='button';choice.className='ec-choice';choice.textContent=option;choice.addEventListener('click',()=>{if(index===mission.correct){completedMissions.add(mission.id);feedback.textContent='Correct — clue unlocked.';feedback.className='ec-feedback success';setTimeout(()=>{panel.remove();initExperience();if(completedMissions.size===missions.length&&typeof unlockReward==='function')unlockReward()},350)}else{feedback.textContent='Not quite. Try another answer.';feedback.className='ec-feedback'}});panel.append(choice)});const close=document.createElement('button');close.type='button';close.className='ec-close';close.textContent='Close';close.addEventListener('click',()=>panel.remove());panel.append(feedback,close);document.body.append(panel)};const style=document.createElement('style');style.textContent='.ec-puzzle{position:fixed;z-index:99;inset:auto 16px 16px;background:#fffaf0;color:#17211b;border:2px solid #d4a72c;border-radius:18px;padding:20px;box-shadow:0 18px 50px #0008}.ec-puzzle h3{margin:0 0 8px}.ec-puzzle p{line-height:1.45}.ec-choice,.ec-close{display:block;width:100%;text-align:left;padding:12px;margin:8px 0;border-radius:10px;border:1px solid #b58b1b;background:#fff;color:#17211b;font:inherit}.ec-choice:focus,.ec-choice:hover{outline:3px solid #d4a72c}.ec-close{background:#17211b;color:#fff;text-align:center}.ec-feedback{min-height:1.4em;font-weight:700}.ec-feedback.success{color:#176b3a}';document.head.append(style);initExperience()}}catch(error){console.error('Experience initialisation failed',error)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${files.css}</style></head><body>${files.html}<script>${files.javascript}\n${bootstrap}<\/script></body></html>`;
}

const escapeHtml=(value="")=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
export function injectHeroMedia(files={},imageDataUrl="",attribution={label:"Photo from Google Maps",url:""}){
  const safeImage=/^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(imageDataUrl)?imageDataUrl:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23113b34'/%3E%3C/svg%3E";
  const label=escapeHtml(attribution?.label||"Photo from Google Maps"),url=/^https:\/\//i.test(attribution?.url||"")?escapeHtml(attribution.url):"";
  const credit=url?`<a href="${url}" target="_blank" rel="noopener">${label}</a>`:label;
  return{...files,html:String(files.html??"").replaceAll("{{HERO_IMAGE}}",safeImage).replaceAll("{{HERO_ATTRIBUTION}}",credit)};
}
