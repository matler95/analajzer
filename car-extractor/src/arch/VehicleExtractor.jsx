import { useState, useEffect, useCallback } from "react";

/* ─── STYLES ─────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0b0f;--card:#16161f;--card2:#1a1a26;
  --border:#1e1e2a;--border2:#2a2a3a;
  --amber:#f0a500;--amber-bg:#f0a50012;--amber-glow:#f0a50030;
  --red:#e04545;--green:#3db87a;--blue:#4a9eff;
  --text:#dddde8;--sub:#7a7a96;--muted:#3e3e54;
  --ff-d:'Bebas Neue',sans-serif;
  --ff-u:'Outfit',sans-serif;
  --ff-m:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--text);font-family:var(--ff-u);-webkit-font-smoothing:antialiased}
.app{
  min-height:100vh;
  background-color:var(--bg);
  background-image:
    radial-gradient(circle at 18% 8%, #f0a50009 0%, transparent 45%),
    linear-gradient(var(--border) 1px,transparent 1px),
    linear-gradient(90deg,var(--border) 1px,transparent 1px);
  background-size:100%,44px 44px,44px 44px;
}
.hdr{
  position:sticky;top:0;z-index:99;display:flex;align-items:center;gap:14px;
  padding:14px 36px;border-bottom:1px solid var(--border2);
  background:rgba(11,11,15,.88);backdrop-filter:blur(14px);
}
.hdr-hex{
  width:34px;height:34px;flex-shrink:0;background:var(--amber);
  clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--ff-d);font-size:12px;color:#000;letter-spacing:1px;
}
.hdr-title{font-family:var(--ff-d);font-size:24px;letter-spacing:3px}
.hdr-sub{font-family:var(--ff-m);font-size:10px;color:var(--sub);letter-spacing:1px;margin-top:2px}
.hdr-pill{
  margin-left:auto;font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;
  padding:4px 12px;border:1px solid var(--border2);border-radius:20px;color:var(--sub);
}
.main{max-width:860px;margin:0 auto;padding:44px 24px 80px}
.section-label{
  font-family:var(--ff-m);font-size:10px;color:var(--amber);
  letter-spacing:2.5px;text-transform:uppercase;
  display:flex;align-items:center;gap:8px;margin-bottom:10px;
}
.section-label::before{content:'';display:block;width:10px;height:2px;background:var(--amber)}
.input-wrap{
  display:flex;gap:0;border:1px solid var(--border2);border-radius:4px;
  overflow:hidden;background:var(--card);transition:border-color .2s,box-shadow .2s;
}
.input-wrap:focus-within{border-color:var(--amber);box-shadow:0 0 0 3px var(--amber-glow)}
.url-in{
  flex:1;background:transparent;border:none;outline:none;
  padding:15px 18px;font-family:var(--ff-m);font-size:13px;color:var(--text);min-width:0;
}
.url-in::placeholder{color:var(--muted)}
.portal-chip{
  display:flex;align-items:center;padding:0 14px;
  font-family:var(--ff-m);font-size:10px;letter-spacing:1px;
  border-left:1px solid var(--border2);
}
.portal-chip.otomoto{color:#ff6b35}
.portal-chip.olx{color:var(--green)}
.go-btn{
  padding:0 28px;background:var(--amber);border:none;cursor:pointer;
  font-family:var(--ff-d);font-size:17px;letter-spacing:2px;color:#000;
  transition:background .15s,transform .1s;flex-shrink:0;
}
.go-btn:hover{background:#ffc22a}
.go-btn:active{transform:scale(.97)}
.go-btn:disabled{background:var(--muted);color:var(--sub);cursor:not-allowed}
.hint{margin-top:9px;font-family:var(--ff-m);font-size:10px;color:var(--sub);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hint-dot{color:var(--muted)}
.loader{
  margin-top:32px;border:1px solid var(--border2);border-radius:4px;
  background:var(--card);padding:44px;text-align:center;animation:fadeUp .3s ease;
}
.spin{
  width:44px;height:44px;border:2px solid var(--border2);border-top-color:var(--amber);
  border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 24px;
}
.load-steps{display:flex;flex-direction:column;gap:8px;align-items:center}
.load-step{
  font-family:var(--ff-m);font-size:11px;letter-spacing:1px;
  padding:5px 14px;border-radius:2px;transition:all .3s;
}
.load-step.active{color:var(--amber);background:var(--amber-bg)}
.load-step.done{color:var(--green)}
.load-step.wait{color:var(--muted)}
.err{
  margin-top:24px;border:1px solid var(--red);background:#e0454510;border-radius:4px;
  padding:18px 22px;font-family:var(--ff-m);font-size:12px;color:var(--red);
  animation:fadeUp .3s ease;display:flex;gap:12px;align-items:flex-start;line-height:1.6;
}
.err-ico{font-size:16px;flex-shrink:0}
.result{margin-top:32px;animation:fadeUp .4s ease}
.car-hero{
  position:relative;overflow:hidden;border:1px solid var(--border2);border-radius:4px 4px 0 0;
  background:var(--card);padding:30px 32px;
  display:flex;justify-content:space-between;align-items:flex-start;gap:20px;
}
.car-hero::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,var(--amber),var(--amber) 40%,transparent);
}
.ch-src{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.ch-brand{font-family:var(--ff-d);font-size:13px;letter-spacing:4px;color:var(--amber)}
.ch-model{font-family:var(--ff-d);font-size:52px;line-height:1;letter-spacing:1px}
.ch-variant{font-size:13px;color:var(--sub);margin-top:5px;font-weight:300}
.ch-price{text-align:right;flex-shrink:0}
.price-val{font-family:var(--ff-d);font-size:46px;line-height:1;color:var(--amber)}
.price-cur{font-size:22px;margin-right:3px}
.price-note{font-family:var(--ff-m);font-size:9px;color:var(--sub);margin-top:4px;letter-spacing:1px}
.specs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-top:1px}
.spec{background:var(--card);padding:16px 18px;transition:background .15s;cursor:default}
.spec:hover{background:var(--card2)}
.spec-lbl{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px}
.spec-val{font-family:var(--ff-m);font-size:14px;font-weight:600;color:var(--text)}
.spec-val .u{font-size:10px;color:var(--sub);font-weight:400;margin-left:3px}
.spec-val.nil{color:var(--muted);font-weight:400;font-size:12px}
.identity{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);margin-top:1px}
.id-card{background:var(--card);padding:18px 22px;display:flex;align-items:center;gap:16px}
.id-ico{font-size:22px;opacity:.45;flex-shrink:0}
.id-lbl{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.id-val{font-family:var(--ff-m);font-size:15px;font-weight:600;letter-spacing:2px}
.id-val.found{color:var(--green)}
.id-val.nil{color:var(--muted);font-weight:400;font-size:12px;letter-spacing:.5px}
.id-input{
  width:100%;
  background:transparent;
  border:1px solid var(--border2);
  border-radius:4px;
  color:var(--text);
  font-family:var(--ff-m);
  font-size:14px;
  letter-spacing:1px;
  padding:8px 10px;
  outline:none;
}
.id-input:focus{
  border-color:var(--amber);
  box-shadow:0 0 0 2px var(--amber-glow);
}
.desc-box{
  margin-top:1px;
  background:var(--card);
  border:1px solid var(--border2);
  padding:16px 18px;
}
.desc-lbl{
  font-family:var(--ff-m);
  font-size:9px;
  color:var(--sub);
  letter-spacing:2px;
  text-transform:uppercase;
  margin-bottom:8px;
}
.desc-txt{
  color:var(--text);
  font-size:13px;
  line-height:1.6;
  white-space:pre-wrap;
}
.gallery{
  margin-top:1px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:1px;
  background:var(--border);
}
.gallery-item{
  position:relative;
  display:block;
  background:var(--card);
  aspect-ratio:4/3;
  overflow:hidden;
}
.gallery-item img{
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .2s;
}
.gallery-item:hover img{transform:scale(1.03)}
.actions{display:flex;gap:1px;background:var(--border);margin-top:1px}
.act-btn{
  flex:1;background:var(--card);border:none;cursor:pointer;
  padding:13px 16px;font-family:var(--ff-d);font-size:15px;letter-spacing:1.5px;
  color:var(--sub);display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;
}
.act-btn:hover{background:var(--card2);color:var(--text)}
.act-btn.primary{background:var(--amber-bg);color:var(--amber)}
.act-btn.primary:hover{background:var(--amber);color:#000}
.src-bar{
  background:var(--card);border-top:1px solid var(--border);
  padding:10px 18px;font-family:var(--ff-m);font-size:10px;color:var(--sub);
  display:flex;justify-content:space-between;align-items:center;gap:12px;
}
.src-bar a{color:var(--sub);text-decoration:none;word-break:break-all}
.src-bar a:hover{color:var(--amber)}
.note{
  margin-top:18px;padding:13px 16px;
  border:1px solid var(--border2);border-left:3px solid var(--amber);
  background:var(--card);font-family:var(--ff-m);font-size:11px;color:var(--sub);line-height:1.6;
}
.note strong{color:var(--amber)}
.info-note{
  margin-top:14px;padding:12px 16px;
  border:1px solid #4a9eff22;border-left:3px solid var(--blue);
  background:#4a9eff08;font-family:var(--ff-m);font-size:11px;color:var(--sub);line-height:1.7;
}
.info-note strong{color:var(--blue)}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:680px){
  .specs{grid-template-columns:repeat(2,1fr)}
  .identity{grid-template-columns:1fr}
  .gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
  .car-hero{flex-direction:column}
  .ch-price{text-align:left}
  .ch-model{font-size:38px}
  .price-val{font-size:34px}
  .actions{flex-direction:column}
  .hdr{padding:12px 16px}
  .main{padding:28px 16px 60px}
}
@media print{
  .hdr,.input-area,.actions,.note,.info-note{display:none!important}
  .app{background:white!important;background-image:none!important}
  body{color:#000!important}
  .car-hero,.spec,.id-card,.src-bar{background:white!important;border-color:#ddd!important}
  .ch-model,.spec-val,.id-val{color:#000!important}
  .ch-brand,.price-val{color:#c47a00!important}
  .id-val.found{color:#2a8a56!important}
  .spec-lbl,.id-lbl,.ch-src,.price-note{color:#888!important}
  .specs,.identity,.actions{background:#ddd!important}
}
`;

/* ─── CORS PROXIES ───────────────────────────────────────── */
const PROXIES = [
  u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function fetchProxy(url) {
  let lastErr;
  for (const mk of PROXIES) {
    try {
      const r = await fetch(mk(url), { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      const raw = await r.text();
      let text = raw;
      try {
        const j = JSON.parse(raw);
        text = j?.contents ?? (typeof j === "string" ? j : raw);
      } catch {}
      if (text && text.length > 200) return text;
    } catch (e) { lastErr = e; }
  }
  throw new Error("Nie udało się pobrać strony przez CORS proxy. " + (lastErr?.message ?? ""));
}

/* ─── HELPERS ────────────────────────────────────────────── */
const toNum = v => {
  if (v == null) return null;
  const s = String(v).replace(/\s/g, "").replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};
const clean = v => { if (!v) return null; const s = String(v).trim(); return s.length ? s : null; };
const cleanEnum = v => { if (!v) return null; return String(v).trim().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || null; };
const cleanDate = v => { if (!v) return null; const s = String(v).trim(); if (/^\d{4}$/.test(s)) return s; const m = s.match(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/); return m ? m[0] : s || null; };
const grabMeta = (doc, n) => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content ?? null;
const normText = s => (s ?? "").replace(/\s+/g, " ").trim();
const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PLACEHOLDER_VALUES = new Set(["make","model","value","unknown","null","undefined","n/a","-","—",",",".",";",""]);
const isPlaceholderValue = v => {
  if (v == null) return true;
  return PLACEHOLDER_VALUES.has(String(v).trim().toLowerCase());
};
const cleanReal = v => {
  const c = clean(v);
  return isPlaceholderValue(c) ? null : c;
};
const cleanEnumReal = v => {
  const c = cleanReal(v);
  if (!c) return null;
  if (c.length > 60 || /[.!?]/.test(c)) return null;
  return cleanEnum(c);
};
const safeJsonParse = s => { try { return JSON.parse(s); } catch { return null; } };
const getTitleFromDoc = doc =>
  clean(doc.querySelector("h1")?.textContent?.trim() ?? grabMeta(doc, "og:title") ?? doc.title);

/* ─── JSON EXTRACTORS ────────────────────────────────────── */
function extractScriptJsonById(html, id) {
  if (!html) return null;
  const re = new RegExp(`<script[^>]*id=["']?${escRe(id)}["']?[^>]*>([\\s\\S]*?)<\\/script>`, "i");
  const m = html.match(re);
  return safeJsonParse(m?.[1] ?? "");
}

function extractWindowJson(html, key) {
  if (!html) return null;
  // Quoted string variant
  const quoted = html.match(new RegExp(`window\\.${escRe(key)}\\s*=\\s*'([\\s\\S]+?)'\\s*;`, "i"));
  if (quoted?.[1]) {
    const unescaped = quoted[1].replace(/\\\\/g, "\\").replace(/\\"/g, '"').replace(/\\'/g, "'");
    const parsed = safeJsonParse(unescaped);
    if (parsed) return parsed;
  }
  // Plain object variant
  const plain = html.match(new RegExp(`window\\.${escRe(key)}\\s*=\\s*(\\{[\\s\\S]+?\\})\\s*;`, "i"));
  return safeJsonParse(plain?.[1] ?? "");
}

/**
 * Extract ALL inline JSON blobs from <script> tags (no type or type=text/javascript).
 * Returns array of parsed objects. Useful when data is in an anonymous script.
 */
function extractAllInlineJsonBlobs(html) {
  const results = [];
  const re = /<script(?![^>]*type=["'](?:application\/ld\+json|module)["'])[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const txt = m[1].trim();
    if (!txt || txt.length < 20) continue;
    // Try direct JSON
    const direct = safeJsonParse(txt);
    if (direct && typeof direct === "object") { results.push(direct); continue; }
    // Try assignments: var/const/let X = {...} or window.X = {...}
    const assign = txt.match(/(?:var|const|let|window\.[a-zA-Z_$][\w$]*)\s*=\s*(\{[\s\S]+\}|\[[\s\S]+\])\s*;?\s*$/);
    if (assign?.[1]) {
      const p = safeJsonParse(assign[1]);
      if (p) results.push(p);
    }
  }
  return results;
}

/**
 * Deeply search all inline JSON blobs for a specific key path or key.
 */
function deepFind(obj, key, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 12) return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const r = deepFind(v, key, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

function deepFindAny(obj, keys, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 12) return null;
  for (const k of keys) {
    if (k in obj) {
      const val = unwrapValue(obj[k]);
      if (val != null && val !== "") return val;
    }
  }
  for (const v of Object.values(obj)) {
    const found = deepFindAny(v, keys, depth + 1);
    if (found != null && found !== "") return found;
  }
  return null;
}

function unwrapValue(v) {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "object") {
    return v.label ?? v.name ?? v.value ?? v.key ?? null;
  }
  return null;
}

/* ─── PARAMS FLATTENER ───────────────────────────────────── */
function flattenParams(raw) {
  const p = {};
  if (!raw) return p;
  const normalizeParamValue = (item, val) => {
    if (val == null) return null;
    const str = String(val).trim();
    if (!str) return null;
    const key = String(item?.key ?? "").trim().toLowerCase();
    const low = str.toLowerCase();
    if (key && low === key) return null;
    // Keep if it has digits or is longer than 2 chars with non-ascii
    if (/^[a-z_]+$/.test(low) && low.length <= 18 && !/[0-9]/.test(low)) return null;
    return str;
  };
  if (Array.isArray(raw)) {
    raw.forEach(item => {
      if (!item?.key) return;
      const v =
        normalizeParamValue(item, item.value?.label) ??
        normalizeParamValue(item, item.normalizedValue) ??
        normalizeParamValue(item, item.value?.value) ??
        normalizeParamValue(item, item.value?.name) ??
        normalizeParamValue(item, item.value?.key) ??
        normalizeParamValue(item, item.value);
      if (v != null) p[item.key] = v;
    });
  } else if (typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      const norm = normalizeParamValue({ key: k }, unwrapValue(v) ?? v);
      if (norm != null) p[k] = norm;
    });
  }
  return p;
}

const getParam = (params, ...keys) => {
  for (const k of keys) {
    const v = params?.[k];
    if (v != null && v !== "") return Array.isArray(v) ? v[0] : v;
  }
  return null;
};

/* ─── DOM HELPERS ────────────────────────────────────────── */
function parseLd(doc) {
  let ld = null;
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    try {
      const j = JSON.parse(s.textContent);
      const find = o => {
        if (!o) return;
        if (["Car", "Vehicle", "Product"].includes(o["@type"])) { ld = o; return; }
        if (Array.isArray(o["@graph"])) o["@graph"].forEach(find);
      };
      find(j);
    } catch {}
  });
  return ld;
}

function parseNextData(doc) {
  const script = doc.querySelector("script#__NEXT_DATA__");
  if (!script?.textContent) return null;
  try { return JSON.parse(script.textContent); } catch { return null; }
}

function normalizeImageList(raw) {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw : Object.values(raw);
  return source
    .map(p => {
      if (typeof p === "string" && /^https?:\/\//i.test(p)) return p;
      const url = p?.url ?? p?.large ?? p?.medium ?? p?.small ?? p?.image ?? p?.src;
      return typeof url === "string" ? url : null;
    })
    .filter(v => v && /^https?:\/\//i.test(v));
}

/**
 * Try to find value after a label in DOM (dt/dd, th/td, li, etc.)
 */
function valueAfterLabelInDom(doc, labels) {
  const all = Array.from(doc.querySelectorAll("dt,th,li,div,span,p,h2,h3,strong,label"));
  for (const label of labels) {
    const hit = all.find(el => {
      const txt = normText(el.textContent).toLowerCase().replace(/:$/, "");
      const wanted = label.toLowerCase();
      return txt === wanted || txt.startsWith(`${wanted} `) || txt.startsWith(`${wanted}:`);
    });
    if (!hit) continue;
    const dd = hit.nextElementSibling;
    const ddText = clean(normText(dd?.textContent));
    if (ddText && ddText.length <= 80 && ddText.toLowerCase() !== label.toLowerCase()) return ddText;
    const parent = hit.parentElement;
    if (parent) {
      const children = Array.from(parent.children);
      const idx = children.indexOf(hit);
      if (idx >= 0 && children[idx + 1]) {
        const sibText = clean(normText(children[idx + 1].textContent));
        if (sibText && sibText.length <= 80 && sibText.toLowerCase() !== label.toLowerCase()) return sibText;
      }
    }
  }
  return null;
}

/* ─── REGEX HELPERS ──────────────────────────────────────── */
const pickMatch = (text, patterns) => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return clean(m[1]);
  }
  return null;
};

/**
 * Extract structured label→value map from raw text lines.
 * Handles both "Label\nValue" and "Label: Value" formats.
 */
function extractLabelMapFromText(rawText) {
  const lines = String(rawText ?? "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length <= 160);

  const KNOWN_LABELS = [
    "Marka pojazdu", "Model pojazdu", "Rok produkcji", "Przebieg",
    "Data pierwszej rejestracji w historii pojazdu", "Pojemność skokowa",
    "Moc", "Rodzaj paliwa", "Skrzynia biegów", "Typ nadwozia",
    "Liczba drzwi", "Liczba miejsc", "Napęd", "Lokalizacja", "Stan",
    "Wersja", "Kolor", "VIN", "Numer rejestracyjny",
  ];
  const labelSet = new Set(KNOWN_LABELS.map(l => l.toLowerCase()));
  const out = {};

  for (let i = 0; i < lines.length; i++) {
    const curr = lines[i];

    // "Label: Value" on same line
    const inlineMatch = curr.match(/^([^:]{3,60}):\s+(.{1,80})$/);
    if (inlineMatch) {
      const lbl = KNOWN_LABELS.find(l => l.toLowerCase() === inlineMatch[1].trim().toLowerCase());
      if (lbl && !isPlaceholderValue(inlineMatch[2])) {
        out[lbl] = inlineMatch[2].trim();
        continue;
      }
    }

    // Label on its own line, value on next
    const key = KNOWN_LABELS.find(l => l.toLowerCase() === curr.replace(/:$/, "").toLowerCase());
    if (!key) continue;

    for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
      const candidate = lines[j].replace(/:$/, "").trim();
      if (labelSet.has(candidate.toLowerCase())) break;
      if (/^(Podstawowe|Szczegóły|Najważniejsze|Opis|Wyposażenie|Finansowanie|Historia pojazdu|Bezpieczeństwo)$/i.test(candidate)) continue;
      if (!isPlaceholderValue(candidate)) {
        out[key] = candidate;
        break;
      }
    }
  }
  return out;
}

function guessBrandModelFromUrl(url) {
  const m = String(url ?? "").match(/\/oferta\/([^/?#]+?)-ID[0-9A-Za-z]+/i);
  if (!m?.[1]) return { brand: null, model: null };
  const slug = m[1].replace(/-/g, " ").trim();
  const tokens = slug.split(/\s+/).map(t => t.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  return { brand: cleanReal(tokens[0]), model: cleanReal(tokens[1]) };
}

function guessBrandModelFromTitle(title) {
  const cleanTitle = normText(String(title ?? "").split("|")[0].split(" - ")[0]);
  const tokens = cleanTitle.split(" ").filter(Boolean);
  const stop = new Set(["uzywany", "używany", "nowy", "sprzedam", "kupię", "zamienię"]);
  const filtered = tokens.filter(t => !stop.has(t.toLowerCase()));
  const base = filtered.length ? filtered : tokens;
  const yearIdx = base.findIndex(t => /^[12][0-9]{3}$/.test(t));
  const core = yearIdx > 0 ? base.slice(0, yearIdx) : base;
  const finalTokens = core.map(t => t.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  if (!finalTokens.length) return { brand: null, model: null, variant: null };
  const brand = cleanReal(finalTokens[0]);
  const model = cleanReal(finalTokens[1]);
  const variant = clean(finalTokens.slice(2).join(" "));
  return { brand, model, variant: variant?.length ? variant : null };
}

/* ══════════════════════════════════════════════════════════
   OTOMOTO PARSER — wielowarstwowe wydobywanie danych
   Strategia:
   1. __NEXT_DATA__ (klasyczny)
   2. window.__PRERENDERED_STATE__ / window.__INITIAL_STATE__
   3. Szukanie obiektu "advert"/"ad" we WSZYSTKICH skryptach inline
   4. JSON-LD (ld+json)
   5. DOM (data-*, atrybuty, struktury label→value)
   6. Regex na surowym tekście (fallback)
══════════════════════════════════════════════════════════ */
function getOtomotoAdvertFromNextData(nd) {
  if (!nd) return {};
  const pageProps = nd?.props?.pageProps ?? nd?.pageProps ?? {};
  const advert =
    pageProps?.advert ??
    pageProps?.ad ??
    pageProps?.listing ??
    deepFind(pageProps, "advert") ??
    deepFind(pageProps, "ad") ??
    deepFind(nd, "advert") ??
    {};
  const params = flattenParams(
    advert?.params ??
    pageProps?.params ??
    deepFind(advert, "params") ??
    deepFind(pageProps, "params")
  );
  return { advert, params, pageProps };
}

/**
 * Wyszukuje obiekt z danymi auta we wszystkich blob-ach JSON inline.
 * Kryteria rozpoznawcze: ma klucze make/brand + year/mileage lub price.
 */
function findAdvertBlobInAllScripts(html) {
  // Also try explicit window variable names used by otomoto
  const windowKeys = [
    "__PRERENDERED_STATE__", "__INITIAL_STATE__", "__STATE__",
    "__APP_STATE__", "initialState", "serverState",
  ];
  for (const k of windowKeys) {
    const blob = extractWindowJson(html, k);
    if (blob) {
      const ad = deepFind(blob, "advert") ?? deepFind(blob, "ad") ?? deepFind(blob, "listing");
      if (ad && (ad.make || ad.brand || ad.year || ad.price)) return { advert: ad, source: `window.${k}` };
    }
  }

  // Scan all inline scripts for JSON blobs containing car data
  const blobs = extractAllInlineJsonBlobs(html);
  for (const blob of blobs) {
    const ad = deepFind(blob, "advert") ?? deepFind(blob, "ad");
    if (ad && typeof ad === "object" && (ad.make || ad.brand || ad.year || ad.price)) {
      return { advert: ad, source: "inline-script" };
    }
    // Maybe the blob itself IS the advert (some SPAs embed it at root)
    if (blob.make && (blob.year || blob.price || blob.mileage)) {
      return { advert: blob, source: "inline-root" };
    }
  }
  return null;
}

/**
 * Extract images aggressively — from advert object, from JSON blobs,
 * from og:image meta tags, and from <img> tags with data-src patterns.
 */
function extractImages(html, doc, advert, pageProps) {
  // 1. From advert object
  let imgs = normalizeImageList(
    advert?.photos ?? advert?.images ?? advert?.gallery ??
    pageProps?.photos ?? pageProps?.images ??
    deepFind(advert, "photos") ?? deepFind(advert, "images")
  );
  if (imgs.length) return imgs;

  // 2. From all JSON blobs
  const blobs = extractAllInlineJsonBlobs(html);
  for (const blob of blobs) {
    const found = deepFind(blob, "photos") ?? deepFind(blob, "images") ?? deepFind(blob, "gallery");
    if (found) {
      imgs = normalizeImageList(found);
      if (imgs.length) return imgs;
    }
  }

  // 3. From og:image meta
  const ogImgs = Array.from(doc.querySelectorAll('meta[property="og:image"]'))
    .map(el => el.content).filter(Boolean);
  if (ogImgs.length) return ogImgs;

  // 4. From <img> tags (filter out tiny icons)
  imgs = Array.from(doc.querySelectorAll("img[src]"))
    .map(el => el.src || el.getAttribute("src"))
    .filter(s => s && /^https?:\/\//i.test(s) && !/icon|logo|sprite|avatar|pixel/i.test(s));
  return [...new Set(imgs)].slice(0, 20);
}

/**
 * Pobiera tekstowe opisy z listy "Parametry" renderowane jako
 * <li data-testid="..."><p>Label</p><p>Value</p></li>
 * lub podobnych struktur data-testid.
 */
function extractParamsFromDataTestId(doc) {
  const out = {};
  // Pattern: elements with data-testid containing "item" or "param"
  const items = doc.querySelectorAll("[data-testid]");
  items.forEach(el => {
    const tid = el.getAttribute("data-testid") ?? "";
    if (!tid) return;
    const children = Array.from(el.children);
    if (children.length >= 2) {
      const lbl = normText(children[0].textContent);
      const val = normText(children[1].textContent);
      if (lbl && val && val !== lbl && val.length <= 100) out[lbl] = val;
    }
  });
  return out;
}

/**
 * Szuka wartości w strukturze "details-item" lub podobnych klasach CSS
 * używanych przez Otomoto do renderowania specyfikacji.
 */
function extractParamsFromDetailItems(doc) {
  const out = {};
  // Common otomoto class patterns
  const selectors = [
    ".offer-params__item",
    "[class*='OfferParam']",
    "[class*='offer-param']",
    "[class*='param-item']",
    "[class*='details-item']",
    "[class*='spec-item']",
    "[class*='feature-item']",
  ];
  for (const sel of selectors) {
    doc.querySelectorAll(sel).forEach(el => {
      const spans = el.querySelectorAll("span,p,div,dt,dd");
      if (spans.length >= 2) {
        const lbl = normText(spans[0].textContent);
        const val = normText(spans[1].textContent);
        if (lbl && val && val !== lbl && val.length <= 100 && !isPlaceholderValue(val)) {
          out[lbl] = val;
        }
      }
    });
  }
  return out;
}

/**
 * Główny ekstraktor regex dla surowego HTML/tekstu Otomoto.
 * Używa szerokiej listy wzorców dla każdego pola.
 */
function regexExtractOtomoto(html, text) {
  const extract = (patterns) => {
    for (const p of patterns) {
      const m = (typeof p.source !== "undefined" ? html : text).match(p);
      if (m?.[1]) return clean(m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
    }
    return null;
  };

  // JSON string patterns (from embedded JS)
  const mkJSON = key => new RegExp(`["']${escRe(key)}["']\\s*:\\s*["']([^"']{1,80})["']`, "i");
  const mkJSONNum = key => new RegExp(`["']${escRe(key)}["']\\s*:\\s*([0-9]+(?:[.,][0-9]+)?)`, "i");
  const mkJSONLabel = key => new RegExp(`["']${escRe(key)}["'][\\s\\S]{0,60}?["']label["']\\s*:\\s*["']([^"']{1,80})["']`, "i");
  const mkJSONLabelAlt = key => new RegExp(`["']label["']\\s*:\\s*["']([^"']{1,80})["'][\\s\\S]{0,60}?["']${escRe(key)}["']`, "i");

  return {
    mileage: extract([
      mkJSONNum("mileage"),
      /["']mileage["']\s*:\s*\{[^}]*"value"\s*:\s*([0-9]+)/i,
      /\bPrzebieg\b[^0-9]{0,30}([0-9][\d\s]*)\s*km/i,
      /\bodometer["']?\s*:\s*["']?([0-9]+)/i,
    ]),
    year: extract([
      mkJSONNum("year"),
      /["']production_year["']\s*:\s*([12][0-9]{3})/i,
      /["']model_year["']\s*:\s*([12][0-9]{3})/i,
      /\bRok\s+produkcji\b[^0-9]{0,20}([12][0-9]{3})/i,
      /["']vehicleModelDate["']\s*:\s*["']([12][0-9]{3})/i,
    ]),
    engineDisplacement: extract([
      mkJSONNum("engine_capacity"),
      mkJSONNum("engineDisplacement"),
      /["']engine_capacity["']\s*:\s*\{[^}]*"value"\s*:\s*([0-9]+)/i,
      /\bPojemno[sś][cć]\b[^0-9]{0,30}([0-9][\d\s]*)\s*cm/i,
    ]),
    enginePower: extract([
      mkJSONNum("engine_power"),
      /["']engine_power["']\s*:\s*\{[^}]*"value"\s*:\s*([0-9]+)/i,
      mkJSONNum("power"),
      /\bMoc\b[^0-9]{0,30}([0-9][\d\s]*)\s*(?:KM|HP|kW)/i,
    ]),
    fuelType: extract([
      mkJSONLabel("fuel_type"),
      mkJSONLabelAlt("fuel_type"),
      mkJSON("fuel_type"),
      mkJSON("fuelType"),
      /\bRodzaj\s+paliwa\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,30})/i,
    ]),
    transmission: extract([
      mkJSONLabel("gearbox"),
      mkJSONLabelAlt("gearbox"),
      mkJSON("gearbox"),
      mkJSON("transmission"),
      /\bSkrzynia\s+bieg[oó]w\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,40})/i,
    ]),
    drivetrain: extract([
      mkJSONLabel("drive"),
      mkJSONLabelAlt("drive"),
      mkJSON("drive"),
      /\bNap[ęe]d\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9 \-]{2,40})/i,
    ]),
    bodyType: extract([
      mkJSONLabel("body_type"),
      mkJSONLabelAlt("body_type"),
      mkJSON("body_type"),
      mkJSON("bodyStyle"),
      mkJSON("car_type"),
      /\bTyp\s+nadwozia\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,40})/i,
    ]),
    doors: extract([
      mkJSONNum("doors_count"),
      mkJSONNum("doors"),
      /["']doors_count["']\s*:\s*\{[^}]*"value"\s*:\s*([0-9]+)/i,
      /\bLiczba\s+drzwi\b[^0-9]{0,20}([2-6])/i,
    ]),
    color: extract([
      mkJSONLabel("color"),
      mkJSON("color"),
      /\bKolor\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,30})/i,
    ]),
    firstRegistration: extract([
      /["']first_registration_year["']\s*:\s*["']?([12][0-9]{3}[-\/][0-9]{2}[-\/][0-9]{2}|[12][0-9]{3})/i,
      /["']firstRegistrationDate["']\s*:\s*["']([^"']{4,20})["']/i,
      /["']registration_date["']\s*:\s*["']([^"']{4,20})["']/i,
      /\bData\s+pierwszej\s+rejestracji\b[^0-9]{0,40}([0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4}|[0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2}|[12][0-9]{3})/i,
    ]),
    location: extract([
      /["'](?:cityName|city_name)["']\s*:\s*["']([^"']{2,60})["']/i,
      /["']city["']\s*:\s*\{[^}]*"name"\s*:\s*["']([^"']{2,60})["']/i,
      /\bLokalizacja\b[^A-Za-z]{0,20}([A-ZŁŚŻŹĆÓ][^,\n]{1,50})/,
    ]),
    seller: extract([
      /["'](?:sellerName|seller_name|advertiserName)["']\s*:\s*["']([^"']{2,80})["']/i,
      /["'](?:name)["']\s*:\s*["']([^"']{2,80})["'][^}]{0,200}["'](?:dealer|seller|advertiser)["']/i,
    ]),
    description: null, // handled separately
  };
}

function parseOtomoto(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);
  const rawText = doc.body?.textContent ?? "";
  const text = normText(rawText);

  // === LAYER 1: __NEXT_DATA__ ===
  const nd = parseNextData(doc) ?? extractScriptJsonById(html, "__NEXT_DATA__");
  const { advert: ndAdvert, params: ndParams, pageProps: ndPageProps } = getOtomotoAdvertFromNextData(nd);

  // === LAYER 2: Window variables + all inline script blobs ===
  const blobResult = findAdvertBlobInAllScripts(html);
  const blobAdvert = blobResult?.advert ?? {};
  const blobParams = flattenParams(blobAdvert?.params ?? deepFind(blobAdvert, "params"));

  // Merge: prefer ndAdvert (richer) but fill gaps from blobAdvert
  const advert = Object.assign({}, blobAdvert, ndAdvert);
  const params = { ...blobParams, ...ndParams };
  const pageProps = ndPageProps ?? {};

  // === LAYER 3: DOM-based param extraction ===
  const domParams = {
    ...extractParamsFromDetailItems(doc),
    ...extractParamsFromDataTestId(doc),
  };

  // === LAYER 4: Regex on raw HTML/text ===
  const rx = regexExtractOtomoto(html, text);

  // === LAYER 5: Label-map from text ===
  const labels = extractLabelMapFromText(rawText);

  // === Compose helpers ===
  const title = getTitleFromDoc(doc);
  const titleGuess = guessBrandModelFromTitle(title);
  const urlGuess = guessBrandModelFromUrl(url);

  const first = (...vals) => {
    for (const v of vals) {
      const c = cleanReal(v);
      if (c) return c;
    }
    return null;
  };
  const firstNum = (...vals) => {
    for (const v of vals) {
      const n = toNum(v);
      if (n != null && n > 0) return n;
    }
    return null;
  };
  const firstEnum = (...vals) => {
    for (const v of vals) {
      const c = cleanEnumReal(v);
      if (c) return c;
    }
    return null;
  };

  // === Brand & Model ===
  const brand = first(
    advert?.make?.label, advert?.make,
    getParam(params, "make", "brand", "car_brand"),
    deepFindAny(advert, ["make", "brand"]),
    ld?.brand?.name,
    domParams["Marka pojazdu"], domParams["Marka"],
    labels["Marka pojazdu"],
    valueAfterLabelInDom(doc, ["Marka pojazdu", "Marka"]),
    titleGuess.brand, urlGuess.brand
  );
  const model = first(
    advert?.model?.label, advert?.model,
    getParam(params, "model", "car_model"),
    deepFindAny(advert, ["model", "car_model"]),
    ld?.model,
    domParams["Model pojazdu"], domParams["Model"],
    labels["Model pojazdu"],
    valueAfterLabelInDom(doc, ["Model pojazdu", "Model"]),
    titleGuess.model, urlGuess.model
  );

  let variant = null;
  if (title && brand && model) {
    const v = title
      .replace(new RegExp(escRe(brand), "gi"), "")
      .replace(new RegExp(escRe(model), "gi"), "")
      .replace(/\|.*$/, "")
      .replace(/\s+/g, " ").trim();
    if (v.length > 1 && v.length < 80) variant = v;
  }
  variant = variant || titleGuess.variant;

  // === Price ===
  const price = firstNum(
    advert?.price?.amount?.units,
    advert?.price?.value,
    advert?.price?.regularPrice?.value,
    pageProps?.price?.value,
    getParam(params, "price", "price_amount"),
    ld?.offers?.price,
    grabMeta(doc, "product:price:amount")
  );
  const currency = first(
    advert?.price?.currency,
    getParam(params, "currency"),
    ld?.offers?.priceCurrency
  ) ?? "PLN";

  // === Year ===
  const year = firstNum(
    advert?.year,
    getParam(params, "year", "production_year", "model_year"),
    domParams["Rok produkcji"],
    labels["Rok produkcji"],
    rx.year,
    ld?.vehicleModelDate
  );

  // === Mileage ===
  const mileage = firstNum(
    advert?.mileage,
    getParam(params, "mileage", "odometer", "mileage_from_odometer"),
    deepFindAny(advert, ["mileage", "odometer"]),
    domParams["Przebieg"],
    labels["Przebieg"],
    rx.mileage,
    ld?.mileageFromOdometer?.value
  );

  // === Engine ===
  const engineDisplacement = firstNum(
    getParam(params, "engine_capacity", "engineDisplacement", "engine_displacement"),
    deepFindAny(advert, ["engine_capacity", "engineDisplacement"]),
    domParams["Pojemność skokowa"],
    labels["Pojemność skokowa"],
    rx.engineDisplacement,
    ld?.engineDisplacement?.value
  );
  const enginePower = firstNum(
    getParam(params, "engine_power", "power"),
    deepFindAny(advert, ["engine_power", "power", "horsepower"]),
    domParams["Moc"],
    labels["Moc"],
    rx.enginePower,
    ld?.vehicleEngine?.enginePower?.value
  );

  // === Fuel, transmission etc. ===
  const fuelType = firstEnum(
    getParam(params, "fuel_type", "fuelType", "fuel"),
    ld?.fuelType,
    domParams["Rodzaj paliwa"],
    labels["Rodzaj paliwa"],
    rx.fuelType
  );
  const transmission = firstEnum(
    getParam(params, "gearbox", "transmission"),
    ld?.vehicleTransmission,
    domParams["Skrzynia biegów"],
    labels["Skrzynia biegów"],
    rx.transmission
  );
  const drivetrain = firstEnum(
    getParam(params, "drive", "driveWheels"),
    domParams["Napęd"],
    labels["Napęd"],
    rx.drivetrain
  );
  const bodyType = firstEnum(
    getParam(params, "body_type", "bodyStyle", "car_type"),
    ld?.bodyType,
    domParams["Typ nadwozia"],
    labels["Typ nadwozia"],
    rx.bodyType
  );
  const color = firstEnum(
    getParam(params, "color", "colour"),
    domParams["Kolor"],
    labels["Kolor"],
    rx.color
  );
  const doors = firstNum(
    getParam(params, "doors_count", "doors"),
    domParams["Liczba drzwi"],
    labels["Liczba drzwi"],
    rx.doors
  );
  const seats = firstNum(
    getParam(params, "nr_seats", "seats"),
    domParams["Liczba miejsc"],
    labels["Liczba miejsc"]
  );

  // === VIN & plates ===
  const vin = first(
    getParam(params, "vin"),
    domParams["VIN"], labels["VIN"],
    advert?.vin
  );
  const licensePlate = first(
    getParam(params, "plate_number"),
    domParams["Numer rejestracyjny"],
    labels["Numer rejestracyjny"]
  );

  // === First registration ===
  const firstRegistration = cleanDate(
    advert?.firstRegistrationDate ??
    getParam(params, "first_registration", "registration_date", "first_registration_year") ??
    domParams["Data pierwszej rejestracji w historii pojazdu"] ??
    labels["Data pierwszej rejestracji w historii pojazdu"] ??
    rx.firstRegistration
  );

  // === Location & seller ===
  const location = first(
    advert?.location?.city?.name,
    advert?.location?.name,
    pageProps?.location?.city?.name,
    deepFind(advert, "cityName"),
    deepFind(pageProps, "cityName"),
    domParams["Lokalizacja"],
    rx.location
  );
  const seller = first(
    advert?.advertiser?.name,
    advert?.seller?.name,
    pageProps?.seller?.name,
    deepFind(advert, "sellerName"),
    rx.seller
  );

  // === Description ===
  const description = clean(
    advert?.description ??
    pageProps?.description ??
    deepFind(advert, "description") ??
    (() => {
      // Try to extract from DOM
      const descEl = doc.querySelector("[data-testid='content-wrapper']") ??
        doc.querySelector("[class*='description']") ??
        doc.querySelector("[class*='Description']");
      return descEl ? normText(descEl.textContent) : null;
    })()
  );

  // === Images ===
  const images = extractImages(html, doc, advert, pageProps);

  const idMatch = url.match(/ID([A-Za-z0-9]+)(?:\.html)?$/i);

  return {
    brand, model, variant, year, price, currency, mileage,
    engineDisplacement, enginePower, enginePowerUnit: "KM",
    fuelType, transmission, drivetrain, bodyType, color,
    doors, seats, vin, firstRegistration, licensePlate,
    condition: firstEnum(
      getParam(params, "condition", "stan"),
      domParams["Stan"], labels["Stan"]
    ),
    location, seller, description, images,
    portal: "otomoto.pl",
    _adId: clean(idMatch?.[1] ?? advert?.id ?? advert?.uuid ?? deepFind(advert, "id")),
  };
}

/* ─── OLX PARSER (unchanged, solid) ─────────────────────── */
function parseOlx(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);
  const rawText = doc.body?.textContent ?? "";
  const text = normText(rawText);

  const state = extractWindowJson(html, "__PRERENDERED_STATE__") ??
    extractWindowJson(html, "__INITIAL_STATE__") ??
    parseNextData(doc) ??
    extractScriptJsonById(html, "__NEXT_DATA__");

  const ad = state?.ad?.ad ?? state?.ad ?? state?.advert ?? {};
  const params = flattenParams(ad?.params ?? deepFind(state, "params"));

  const title = ad?.title ?? getTitleFromDoc(doc);
  const titleGuess = guessBrandModelFromTitle(title);
  const urlGuess = guessBrandModelFromUrl(url);

  const brand = clean(
    getParam(params, "car_brand", "brand", "make") ??
    deepFindAny(ad, ["car_brand", "brand", "make", "manufacturer"]) ??
    deepFindAny(state, ["car_brand", "brand", "make", "manufacturer"]) ??
    valueAfterLabelInDom(doc, ["Marka", "Marka pojazdu"]) ??
    titleGuess.brand
  );
  const model = clean(
    getParam(params, "car_model", "model") ??
    deepFindAny(ad, ["car_model", "model", "modelName"]) ??
    deepFindAny(state, ["car_model", "model", "modelName"]) ??
    valueAfterLabelInDom(doc, ["Model", "Model pojazdu"]) ??
    titleGuess.model
  );

  return {
    brand: brand ?? urlGuess.brand, model: model ?? urlGuess.model,
    variant: titleGuess.variant,
    year: toNum(
      getParam(params, "year", "model_year", "production_year") ??
      ld?.vehicleModelDate ??
      pickMatch(text, [/\bRok produkcji\b[^0-9]{0,20}([12][0-9]{3})/i])
    ),
    price: toNum(ad?.price?.regularPrice?.value ?? ad?.price?.value ?? ld?.offers?.price),
    currency: clean(ad?.price?.regularPrice?.currency ?? ad?.price?.currency) ?? "PLN",
    mileage: toNum(
      getParam(params, "mileage", "kilometer_mileage", "odometer") ??
      ld?.mileageFromOdometer?.value ??
      pickMatch(text, [/\bPrzebieg\b[^0-9]{0,20}([0-9][\d\s]*)\s*km/i])
    ),
    engineDisplacement: toNum(
      getParam(params, "engine_capacity", "engine_displacement") ??
      ld?.engineDisplacement?.value ??
      pickMatch(text, [/\bPojemno[sś][cć]\b[^0-9]{0,20}([0-9][\d\s]*)\s*cm/i])
    ),
    enginePower: toNum(
      getParam(params, "engine_power", "power") ??
      ld?.vehicleEngine?.enginePower?.value ??
      pickMatch(text, [/\bMoc\b[^0-9]{0,20}([0-9][\d\s]*)\s*(?:KM|HP|kW)/i])
    ),
    enginePowerUnit: "KM",
    fuelType: cleanEnum(getParam(params, "fuel_type", "petrol", "fuel")),
    transmission: cleanEnum(getParam(params, "gearbox", "transmission")),
    drivetrain: cleanEnum(getParam(params, "drive", "drivetrain")),
    bodyType: cleanEnum(getParam(params, "car_type", "body_type", "bodyStyle")),
    color: cleanEnum(getParam(params, "color", "colour")),
    doors: toNum(getParam(params, "doors_count", "doors")),
    seats: null, vin: null,
    firstRegistration: cleanDate(getParam(params, "first_registration_year", "registration_date")),
    licensePlate: clean(getParam(params, "plate_number")),
    condition: null,
    location: clean(ad?.location?.cityName ?? ad?.location?.city ?? deepFind(state, "cityName")),
    seller: clean(ad?.contact?.name ?? ad?.user?.name ?? deepFind(state, "sellerName")),
    description: clean(ad?.description ?? deepFind(state, "description")),
    images: normalizeImageList(ad?.photos ?? ad?.images ?? deepFind(state, "photos") ?? deepFind(state, "images")),
    portal: "olx.pl",
    _adId: null,
  };
}

/* ─── FIELDS CONFIG ──────────────────────────────────────── */
const FIELDS = [
  { key: "year", lbl: "Rok" },
  { key: "mileage", lbl: "Przebieg", u: "km", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "firstRegistration", lbl: "Pierwsza rej." },
  { key: "engineDisplacement", lbl: "Pojemność", u: "cm³", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "enginePower", lbl: "Moc", uFn: d => d.enginePowerUnit || "KM" },
  { key: "fuelType", lbl: "Paliwo" },
  { key: "transmission", lbl: "Skrzynia" },
  { key: "drivetrain", lbl: "Napęd" },
  { key: "bodyType", lbl: "Nadwozie" },
  { key: "color", lbl: "Kolor" },
  { key: "doors", lbl: "Drzwi" },
  { key: "seats", lbl: "Miejsca" },
];

const STEPS = ["Pobieranie przez CORS proxy", "Parsowanie HTML", "Ekstrakcja danych", "Gotowe"];

function detectPortal(url) {
  if (/otomoto\.pl/i.test(url)) return "otomoto";
  if (/olx\.pl/i.test(url)) return "olx";
  return "unknown";
}

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const portal = detectPortal(url);

  const run = useCallback(async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true); setError(null); setData(null);
    const isOtomoto = /otomoto\.pl/i.test(u);
    const isOlx = /olx\.pl/i.test(u);
    setSteps(STEPS); setActive(0);

    try {
      setActive(0);
      const html = await fetchProxy(u);
      setActive(1);
      await new Promise(r => setTimeout(r, 80));
      setActive(2);
      let car;
      if (isOtomoto) car = parseOtomoto(html, u);
      else if (isOlx) car = parseOlx(html, u);
      else throw new Error("Nieobsługiwany portal. Wspierane portale: otomoto.pl i olx.pl");

      setActive(STEPS.length - 1);
      await new Promise(r => setTimeout(r, 250));
      car.listingUrl = u;
      delete car._adId;
      setData(car);
    } catch (e) {
      setError(e.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const dlJSON = () => {
    if (!data) return;
    const name = [data.brand, data.model, data.year].filter(Boolean).join("-");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `raport-${name || "pojazd"}-${Date.now()}.json`; a.click();
  };

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-hex">VX</div>
        <div>
          <div className="hdr-title">VEHICLE EXTRACTOR</div>
          <div className="hdr-sub">OTOMOTO · OLX · BEZPOŚREDNI PARSER</div>
        </div>
        <div className="hdr-pill">BEZ AI · BEZ API KEY</div>
      </header>

      <div className="main">
        <div className="input-area">
          <div className="section-label">URL ogłoszenia</div>
          <div className="input-wrap">
            <input
              className="url-in"
              placeholder="https://www.otomoto.pl/osobowe/oferta/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && run()}
            />
            {portal !== "unknown" && (
              <div className={`portal-chip ${portal}`}>{portal.toUpperCase()}.PL</div>
            )}
            <button className="go-btn" onClick={run} disabled={loading || !url.trim()}>
              {loading ? "···" : "ANALIZUJ"}
            </button>
          </div>
          <div className="hint">
            Obsługiwane: otomoto.pl <span className="hint-dot">·</span> olx.pl
            <span className="hint-dot">·</span> Parser HTML — bez AI, bez klucza
          </div>
        </div>

        {loading && (
          <div className="loader">
            <div className="spin" />
            <div className="load-steps">
              {steps.map((s, i) => (
                <div key={i} className={`load-step ${i === active ? "active" : i < active ? "done" : "wait"}`}>
                  {i < active ? "✓ " : i === active ? "▶ " : "○ "}{s}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="err">
            <span className="err-ico">⚠</span>
            <div>
              <strong>Błąd</strong> — {error}<br /><br />
              Upewnij się że URL jest publiczny. Portale mogą blokować CORS proxy.
              Spróbuj ponownie lub użyj innego proxy.
            </div>
          </div>
        )}

        {data && (
          <div className="result">
            <div className="car-hero">
              <div>
                {data.portal && <div className="ch-src">ŹRÓDŁO: {data.portal}</div>}
                <div className="ch-brand">{data.brand ?? "NIEZNANA MARKA"}</div>
                <div className="ch-model">{data.model ?? "NIEZNANY MODEL"}</div>
                {data.variant && <div className="ch-variant">{data.variant}</div>}
              </div>
              {data.price && (
                <div className="ch-price">
                  <div className="price-val">
                    <span className="price-cur">{data.currency ?? "PLN"}</span>
                    {data.price.toLocaleString("pl-PL")}
                  </div>
                  <div className="price-note">CENA BRUTTO</div>
                </div>
              )}
            </div>

            <div className="specs">
              {FIELDS.map(f => {
                const raw = data[f.key];
                const val = f.fmt ? f.fmt(raw) : raw;
                const unit = f.uFn ? f.uFn(data) : f.u;
                const nil = val == null || val === "";
                return (
                  <div className="spec" key={f.key}>
                    <div className="spec-lbl">{f.lbl}</div>
                    <div className={`spec-val${nil ? " nil" : ""}`}>
                      {nil ? "—" : <>{val}{unit && <span className="u">{unit}</span>}</>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="identity">
              {[
                { ico: "🎨", lbl: "Kolor (szczegóły)", val: data.color },
                { ico: "🪪", lbl: "Nr rejestracyjny", val: data.licensePlate },
                { ico: "👤", lbl: "Sprzedający", val: data.seller },
                { ico: "📍", lbl: "Lokalizacja", val: data.location },
              ].map(({ ico, lbl, val }) => (
                <div className="id-card" key={lbl}>
                  <div className="id-ico">{ico}</div>
                  <div>
                    <div className="id-lbl">{lbl}</div>
                    <div className={`id-val${!val ? " nil" : ""}`}>
                      {val ?? "Niedostępne"}
                    </div>
                  </div>
                </div>
              ))}
              <div className="id-card">
                <div className="id-ico">🔑</div>
                <div style={{ width: "100%" }}>
                  <div className="id-lbl">Numer VIN {data.vin ? "(znaleziony)" : "(ręcznie)"}</div>
                  <input
                    className="id-input"
                    placeholder="Wpisz VIN ręcznie"
                    value={data.vin ?? ""}
                    onChange={e => setData(prev => ({ ...prev, vin: e.target.value.toUpperCase().trim() || null }))}
                    maxLength={17}
                  />
                </div>
              </div>
            </div>

            {!!data.description && (
              <div className="desc-box">
                <div className="desc-lbl">Opis ogłoszenia</div>
                <div className="desc-txt">{data.description}</div>
              </div>
            )}

            {Array.isArray(data.images) && data.images.length > 0 && (
              <div className="gallery">
                {data.images.slice(0, 12).map((img, i) => (
                  <a
                    className="gallery-item"
                    key={`${img}-${i}`}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    title={`Zdjęcie ${i + 1}`}
                  >
                    <img src={img} alt={`Zdjęcie pojazdu ${i + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            )}

            <div className="actions">
              <button className="act-btn primary" onClick={() => window.print()}>🖨 DRUKUJ / PDF</button>
              <button className="act-btn" onClick={dlJSON}>⬇ EKSPORTUJ JSON</button>
              <button className="act-btn" onClick={() => window.open(data.listingUrl, "_blank")}>↗ OGŁOSZENIE</button>
            </div>

            <div className="src-bar">
              <span>Źródło</span>
              <a href={data.listingUrl} target="_blank" rel="noreferrer">{data.listingUrl}</a>
            </div>

            <div className="note">
              <strong>ℹ VIN</strong> — Otomoto nie ujawnia VIN w HTML strony ogłoszenia.
              Uzupełnij go ręcznie powyżej, jeśli chcesz mieć go w eksporcie JSON.
            </div>

            <div className="info-note">
              <strong>ℹ Jak działa parser</strong> — Strona pobierana jest przez publiczne CORS proxy
              (allorigins.win → corsproxy.io → codetabs.com) i parsowana lokalnie w 4 warstwach:
              __NEXT_DATA__, window variables, skanowanie skryptów inline, regex fallback.
              Żadne dane nie trafiają do zewnętrznych serwerów.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
