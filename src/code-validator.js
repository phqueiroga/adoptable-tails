const forbidden = [
  [/\beval\s*\(/i, "eval is forbidden"], [/\b(?:new\s+)?Function\s*\(/, "Function constructor is forbidden"],
  [/\bfetch\s*\(/i, "network requests are forbidden"], [/XMLHttpRequest|WebSocket|EventSource/i, "network APIs are forbidden"],
  [/document\.cookie|localStorage|sessionStorage|indexedDB/i, "browser storage is forbidden"],
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
  if (/@import|url\s*\(\s*['\"]?https?:/i.test(css)) errors.push("External CSS resources are forbidden");
  for (const [pattern, message] of forbidden) if (pattern.test(javascript)) errors.push(message);
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${files.css}</style></head><body>${files.html}<script>${files.javascript}<\/script></body></html>`;
}
