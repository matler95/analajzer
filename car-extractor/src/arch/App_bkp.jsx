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

const JINA_PREFIX = "https://r.jina.ai/http://";

function scoreListingContent(text, url) {
  const t = String(text ?? "");
  if (t.length < 200) return -10;
  const low = t.toLowerCase();

  if (/request blocked|403 error|access denied|captcha|cloudfront/i.test(low)) return -50;

  let score = 0;
  if (/otomoto\.pl|olx\.pl/i.test(low)) score += 1;
  if (/__next_data__|application\/ld\+json|window\.__/i.test(t)) score += 4;
  if (/najważniejsze|szczegóły|marka pojazdu|model pojazdu|przebieg|moc|skrzynia biegów/i.test(low)) score += 4;
  if (/rodzaj paliwa|typ nadwozia|pojemność skokowa/i.test(low)) score += 3;
  if (/informacje o sprzedającym|znajdź na mapie|sprzedający/i.test(low)) score += 2;
  if (/napęd|rodzaj napędu|numer rejestracyjny|pierwszej rejestracji/i.test(low)) score += 2;
  if (url.includes("otomoto.pl") && /otomoto\.pl/.test(low)) score += 2;
  if (url.includes("olx.pl") && /olx\.pl/.test(low)) score += 2;

  return score;
}

async function fetchJina(url) {
  const cleanUrl = String(url).replace(/^https?:\/\//i, "");
  const r = await fetch(`${JINA_PREFIX}${cleanUrl}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Jina fallback HTTP ${r.status}`);
  return await r.text();
}

async function fetchProxy(url) {
  let lastErr = null;
  try {
    const jinaText = await fetchJina(url);
    const s = scoreListingContent(jinaText, url);
    if (s > -20 && jinaText.length > 200) return jinaText;
    throw new Error("Jina zwróciła niepełną treść strony");
  } catch (e) {
    lastErr = e;
  }
  throw new Error("Nie udało się pobrać strony przez Jina Reader. " + (lastErr?.message ?? ""));
}

/* ─── HELPERS ────────────────────────────────────────────── */
const toNum = v => {
  if (v == null) return null;
  const s = String(v)
    .toLowerCase()
    .replace(/cm\s*3|cm3|cm³/gi, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};
const clean = v => { if (!v) return null; const s = String(v).trim(); return s.length ? s : null; };
const cleanEnum = v => { if (!v) return null; return String(v).trim().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || null; };
const cleanDate = v => { if (!v) return null; const s = String(v).trim(); if (/^\d{4}$/.test(s)) return s; const m = s.match(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/); return m ? m[0] : s || null; };
const grabMeta = (doc, n) => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content ?? null;
const normText = s => (s ?? "").replace(/\s+/g, " ").trim();
const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isPlaceholderValue = v => {
  if (v == null) return true;
  const s = String(v).trim().toLowerCase();
  if (!s) return true;
  return ["make", "model", "value", "unknown", "null", "undefined", "n/a", "-", "—", ",", ".", ";"].includes(s);
};
const cleanReal = v => {
  const c = clean(v);
  return isPlaceholderValue(c) ? null : c;
};
const cleanEnumReal = v => {
  const c = cleanReal(v);
  if (!c) return null;
  // Defensive: ignore sentence-like blobs from descriptions
  if (c.length > 40 || /[.!?]/.test(c)) return null;
  return cleanEnum(c);
};
const pickMatch = (text, patterns) => {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return clean(m[1]);
  }
  return null;
};
function pickLabeledValue(text, label, nextLabels = []) {
  const next = nextLabels.map(escRe).join("|");
  const re = next
    ? new RegExp(`${escRe(label)}\\s*([\\s\\S]{1,80}?)(?=\\s*(?:${next})\\b)`, "i")
    : new RegExp(`${escRe(label)}\\s*([\\s\\S]{1,80})`, "i");
  const m = text.match(re);
  return clean(m?.[1]?.replace(/\s+/g, " "));
}
function extractLabelMapFromText(rawText) {
  const normalizeLabelLine = s =>
    String(s ?? "")
      .replace(/^[#>*\-\s]+/, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/:$/, "")
      .trim();
  const lines = String(rawText ?? "")
    .split(/\r?\n/)
    .map(normalizeLabelLine)
    .filter(Boolean)
    .filter(s => s.length <= 120);

  const labels = [
    "Marka pojazdu", "Model pojazdu", "Rok produkcji", "Przebieg",
    "Data pierwszej rejestracji w historii pojazdu", "Pojemność skokowa",
    "Moc", "Rodzaj paliwa", "Skrzynia biegów", "Typ nadwozia",
    "Liczba drzwi", "Napęd", "Rodzaj napędu", "Lokalizacja", "Stan", "Wersja",
    "Numer rejestracyjny pojazdu", "Numer rejestracyjny",
    "Sprzedający", "Informacje o sprzedającym", "Data pierwszej rejestracji",
  ];
  const labelSet = new Set(labels.map(l => l.toLowerCase()));
  const out = {};

  for (let i = 0; i < lines.length; i++) {
    const curr = normalizeLabelLine(lines[i]);
    const key = labels.find(l => l.toLowerCase() === curr.toLowerCase());
    if (!key) continue;

    let val = null;
    for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
      const candidate = normalizeLabelLine(lines[j]);
      if (labelSet.has(candidate.toLowerCase())) break;
      // Skip obvious section headings
      if (/^(Podstawowe|Szczegóły|Najważniejsze|Opis|Wyposażenie|Finansowanie|Historia pojazdu)$/i.test(candidate)) continue;
      val = candidate;
      break;
    }
    if (val && !isPlaceholderValue(val)) out[key] = val;
  }
  return out;
}
function valueAfterHeadingInText(rawText, heading, lookahead = 5) {
  const normalize = s =>
    String(s ?? "")
      .replace(/^[#>*\-\s]+/, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/:$/, "")
      .trim();
  const lines = String(rawText ?? "")
    .split(/\r?\n/)
    .map(normalize)
    .filter(Boolean);
  const idx = lines.findIndex(l => l.toLowerCase() === heading.toLowerCase());
  if (idx < 0) return null;
  for (let i = idx + 1; i < lines.length && i <= idx + lookahead; i++) {
    const v = lines[i].trim();
    if (!v || isPlaceholderValue(v)) continue;
    if (/^(osoba prywatna|bardzo sprawnie odpowiada|sprzedający na otomoto)/i.test(v)) continue;
    if (/^(napisz|wyświetl numer|znajdź na mapie)$/i.test(v)) continue;
    return v;
  }
  return null;
}
const safeJsonParse = s => { try { return JSON.parse(s); } catch { return null; } };
const getTitleFromDoc = doc =>
  clean(
    doc.querySelector("h1")?.textContent?.trim() ??
    grabMeta(doc, "og:title") ??
    doc.title
  );
function extractScriptJsonById(html, id) {
  if (!html) return null;
  const patterns = [
    new RegExp(`<script[^>]*id=["']${escRe(id)}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"),
    new RegExp(`<script[^>]*id=${escRe(id)}[^>]*>([\\s\\S]*?)<\\/script>`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    const parsed = safeJsonParse(m?.[1] ?? "");
    if (parsed) return parsed;
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
function extractWindowJson(html, key) {
  if (!html) return null;
  const quoted = html.match(new RegExp(`window\\.${escRe(key)}\\s*=\\s*'([\\s\\S]+?)'\\s*;`, "i"));
  if (quoted?.[1]) {
    const unescaped = quoted[1]
      .replace(/\\\\/g, "\\")
      .replace(/\\"/g, "\"")
      .replace(/\\'/g, "'");
    const parsed = safeJsonParse(unescaped);
    if (parsed) return parsed;
  }
  const plain = html.match(new RegExp(`window\\.${escRe(key)}\\s*=\\s*(\\{[\\s\\S]+?\\})\\s*;`, "i"));
  return safeJsonParse(plain?.[1] ?? "");
}
const getParam = (params, ...keys) => {
  for (const k of keys) {
    const v = params?.[k];
    if (v != null && v !== "") return Array.isArray(v) ? v[0] : v;
  }
  return null;
};
function guessBrandModelFromUrl(url) {
  const m = String(url ?? "").match(/\/oferta\/([^/?#]+?)-ID[0-9A-Za-z]+/i);
  if (!m?.[1]) return { brand: null, model: null };
  const slug = m[1].replace(/-/g, " ").trim();
  const tokens = slug
    .split(/\s+/)
    .map(t => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  return { brand: cleanReal(tokens[0]), model: cleanReal(tokens[1]) };
}
function parseKeyFactsFromText(text) {
  const t = normText(text);
  return {
    mileage: pickMatch(t, [/\b([0-9][0-9 .,\u00A0]{2,})\s*km\b/i]),
    engineDisplacement: pickMatch(t, [/\b([0-9][0-9 .,\u00A0]{2,})\s*cm3\b/i, /\b([0-9][0-9 .,\u00A0]{2,})\s*cm³\b/i]),
    enginePower: pickMatch(t, [/\b([0-9][0-9 .,\u00A0]{1,})\s*KM\b/i]),
  };
}
function guessBrandModelFromTitle(title) {
  const cleanTitle = normText(String(title ?? "").split("|")[0].split(" - ")[0]);
  const tokens = cleanTitle.split(" ").filter(Boolean);
  const stop = new Set(["uzywany", "używany", "nowy", "sprzedam"]);
  const filtered = tokens.filter(t => !stop.has(t.toLowerCase()));
  const base = filtered.length ? filtered : tokens;
  const yearIdx = base.findIndex(t => /^[12][0-9]{3}$/.test(t));
  const core = yearIdx > 0 ? base.slice(0, yearIdx) : base;
  const finalTokens = core
    .map(t => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (!finalTokens.length) return { brand: null, model: null, variant: null };
  const brand = cleanReal(finalTokens[0]);
  const model = cleanReal(finalTokens[1]);
  const variant = clean(finalTokens.slice(2).join(" "));
  return { brand, model, variant: variant?.length ? variant : null };
}

/* ─── DEEP SEARCH ────────────────────────────────────────── */
function deepFind(obj, key, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 10) return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const r = deepFind(v, key, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

function flattenParams(raw) {
  const p = {};
  if (!raw) return p;
  const normalizeParamValue = (item, val) => {
    if (val == null) return null;
    const str = String(val).trim();
    if (!str) return null;
    const key = String(item?.key ?? "").trim().toLowerCase();
    const low = str.toLowerCase();
    // Ignore values that are just internal enum keys ("make", "model", etc.)
    if (key && low === key) return null;
    if (["make", "model", "value", "unknown", "undefined", "null"].includes(low)) return null;
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
      p[item.key] = v;
    });
  } else if (typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      const norm = normalizeParamValue({ key: k }, unwrapValue(v) ?? v);
      p[k] = norm;
    });
  }
  return p;
}

/* ─── PARSERS ────────────────────────────────────────────── */
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

function normalizeImageList(raw) {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw : Object.values(raw);
  return source
    .map(p => p?.url ?? p?.large ?? p?.medium ?? p?.image ?? p)
    .filter(v => typeof v === "string" && /^https?:\/\//i.test(v));
}

function valueAfterLabelInDom(doc, labels) {
  const all = Array.from(doc.querySelectorAll("dt,th,li,div,span,p,h2,h3,strong"));
  for (const label of labels) {
    const hit = all.find(el => {
      const txt = normText(el.textContent).toLowerCase().replace(/:$/, "");
      const wanted = label.toLowerCase();
      return txt === wanted || txt.startsWith(`${wanted} `);
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

function extractAllInlineJsonBlobs(html) {
  const results = [];
  const re = /<script(?![^>]*type=["'](?:application\/ld\+json|module)["'])[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const txt = m[1].trim();
    if (!txt || txt.length < 20) continue;
    const direct = safeJsonParse(txt);
    if (direct && typeof direct === "object") { results.push(direct); continue; }
    const assign = txt.match(/(?:var|const|let|window\.[a-zA-Z_$][\w$]*)\s*=\s*(\{[\s\S]+\}|\[[\s\S]+\])\s*;?\s*$/);
    if (assign?.[1]) {
      const p = safeJsonParse(assign[1]);
      if (p) results.push(p);
    }
  }
  return results;
}

function findAdvertBlobInAllScripts(html) {
  const windowKeys = ["__PRERENDERED_STATE__", "__INITIAL_STATE__", "__STATE__", "__APP_STATE__", "initialState", "serverState"];
  for (const k of windowKeys) {
    const blob = extractWindowJson(html, k);
    if (blob) {
      const ad = deepFind(blob, "advert") ?? deepFind(blob, "ad") ?? deepFind(blob, "listing");
      if (ad && (ad.make || ad.brand || ad.year || ad.price)) return { advert: ad, source: `window.${k}` };
    }
  }
  const blobs = extractAllInlineJsonBlobs(html);
  for (const blob of blobs) {
    const ad = deepFind(blob, "advert") ?? deepFind(blob, "ad");
    if (ad && typeof ad === "object" && (ad.make || ad.brand || ad.year || ad.price)) return { advert: ad, source: "inline-script" };
    if (blob.make && (blob.year || blob.price || blob.mileage)) return { advert: blob, source: "inline-root" };
  }
  return null;
}

function extractParamsFromDataTestId(doc) {
  const out = {};
  const items = doc.querySelectorAll("[data-testid]");
  items.forEach(el => {
    const children = Array.from(el.children);
    if (children.length >= 2) {
      const lbl = normText(children[0].textContent);
      const val = normText(children[1].textContent);
      if (lbl && val && val !== lbl && val.length <= 100 && !isPlaceholderValue(val)) out[lbl] = val;
    }
  });
  return out;
}

function extractParamsFromDetailItems(doc) {
  const out = {};
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
        if (lbl && val && val !== lbl && val.length <= 100 && !isPlaceholderValue(val)) out[lbl] = val;
      }
    });
  }
  return out;
}

function regexExtractOtomoto(html, text) {
  const pick = patterns => {
    for (const p of patterns) {
      const src = p.__fromText ? text : html;
      const m = src.match(p);
      if (m?.[1]) return clean(m[1]);
    }
    return null;
  };
  const fromText = re => Object.assign(re, { __fromText: true });
  const mkJSON = key => new RegExp(`["']${escRe(key)}["']\\s*:\\s*["']([^"']{1,80})["']`, "i");
  const mkJSONNum = key => new RegExp(`["']${escRe(key)}["']\\s*:\\s*([0-9]+(?:[.,][0-9]+)?)`, "i");
  const mkJSONLabel = key => new RegExp(`["']${escRe(key)}["'][\\s\\S]{0,60}?["']label["']\\s*:\\s*["']([^"']{1,80})["']`, "i");
  return {
    mileage: pick([mkJSONNum("mileage"), fromText(/\bPrzebieg\b[^0-9]{0,30}([0-9][\d\s]*)\s*km/i)]),
    engineDisplacement: pick([mkJSONNum("engine_capacity"), mkJSONNum("engineDisplacement"), fromText(/\bPojemno[sś][cć]\b[^0-9]{0,30}([0-9][\d\s]*)\s*cm/i)]),
    enginePower: pick([mkJSONNum("engine_power"), mkJSONNum("power"), fromText(/\bMoc\b[^0-9]{0,30}([0-9][\d\s]*)\s*(?:KM|HP|kW)/i)]),
    fuelType: pick([mkJSONLabel("fuel_type"), mkJSON("fuel_type"), mkJSON("fuelType"), fromText(/\bRodzaj\s+paliwa\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,30})/i)]),
    transmission: pick([mkJSONLabel("gearbox"), mkJSON("gearbox"), mkJSON("transmission"), fromText(/\bSkrzynia\s+bieg[oó]w\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,40})/i)]),
    drivetrain: pick([mkJSONLabel("drive"), mkJSON("drive"), fromText(/\bNap[ęe]d\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9 \-]{2,40})/i)]),
    bodyType: pick([mkJSONLabel("body_type"), mkJSON("body_type"), mkJSON("bodyStyle"), mkJSON("car_type"), fromText(/\bTyp\s+nadwozia\b[^A-Za-z]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż ]{2,40})/i)]),
    firstRegistration: pick([mkJSON("firstRegistrationDate"), mkJSON("registration_date"), fromText(/\bData\s+pierwszej\s+rejestracji\b[^0-9]{0,40}([0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4}|[0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2}|[12][0-9]{3})/i)]),
    location: pick([mkJSON("cityName"), fromText(/\bLokalizacja\b[^A-Za-z]{0,20}([A-ZŁŚŻŹĆÓ][^,\n]{1,50})/i)]),
    seller: pick([mkJSON("sellerName"), mkJSON("advertiserName")]),
    licensePlate: pick([mkJSON("plate_number"), mkJSON("registration_number"), fromText(/\bNumer\s+rejestracyjny\b[^A-Za-z0-9]{0,20}([A-Z0-9 \-]{4,12})/i)]),
  };
}

function parseOtomoto(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);
  const rawText = doc.body?.textContent ?? "";
  const text = normText(doc.body?.textContent);
  const labels = extractLabelMapFromText(rawText);
  const nd = parseNextData(doc) ?? extractScriptJsonById(html, "__NEXT_DATA__");
  const { advert: ndAdvert, params: ndParams, pageProps: ndPageProps } = getOtomotoAdvertFromNextData(nd);
  const blobResult = findAdvertBlobInAllScripts(html);
  const blobAdvert = blobResult?.advert ?? {};
  const blobParams = flattenParams(blobAdvert?.params ?? deepFind(blobAdvert, "params"));
  const advert = Object.assign({}, blobAdvert, ndAdvert);
  const params = { ...blobParams, ...ndParams };
  const pageProps = ndPageProps ?? {};
  const domParams = { ...extractParamsFromDetailItems(doc), ...extractParamsFromDataTestId(doc) };
  const rx = regexExtractOtomoto(html, text);
  const titleFromText = pickMatch(rawText, [/Title:\s*([^\n]+?)(?:\s+URL Source:|$)/i]);
  const title = getTitleFromDoc(doc) ?? titleFromText;
  const titleGuess = guessBrandModelFromTitle(title);
  const urlGuess = guessBrandModelFromUrl(url);
  const textFacts = parseKeyFactsFromText(text);
  const first = (...vals) => { for (const v of vals) { const c = cleanReal(v); if (c) return c; } return null; };
  const firstNum = (...vals) => { for (const v of vals) { const n = toNum(v); if (n != null && n > 0) return n; } return null; };
  const firstEnum = (...vals) => { for (const v of vals) { const c = cleanEnumReal(v); if (c) return c; } return null; };

  const price = toNum(
    advert?.price?.amount?.units ??
    advert?.price?.value ??
    pageProps?.price?.value ??
    getParam(params, "price", "price_amount") ??
    ld?.offers?.price ??
    grabMeta(doc, "product:price:amount")
  );
  const currency = clean(advert?.price?.currency ?? getParam(params, "currency", "price_currency") ?? ld?.offers?.priceCurrency) ?? "PLN";

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
    const v = title.replace(new RegExp(brand, "i"), "").replace(new RegExp(model, "i"), "").replace(/\s+/g, " ").trim();
    if (v.length > 2 && v.length < 100) variant = v;
  }

  const idMatch = url.match(/ID([A-Za-z0-9]+)(?:\.html)?$/i);
  const brandFromDetails =
    valueAfterLabelInDom(doc, ["Marka pojazdu", "Marka"]) ??
    labels["Marka pojazdu"] ??
    pickLabeledValue(rawText, "Marka pojazdu", ["Model pojazdu", "Kolor"]);
  const modelFromDetails =
    valueAfterLabelInDom(doc, ["Model pojazdu", "Model"]) ??
    labels["Model pojazdu"] ??
    pickLabeledValue(rawText, "Model pojazdu", ["Kolor", "Liczba drzwi", "Rok produkcji"]);
  const yearFromDetails = labels["Rok produkcji"] ?? pickLabeledValue(rawText, "Rok produkcji", ["Generacja", "VIN", "Data pierwszej rejestracji"]);
  const doorsFromDetails = labels["Liczba drzwi"] ?? pickLabeledValue(rawText, "Liczba drzwi", ["Liczba miejsc", "Rok produkcji"]);
  const fuelFromDetails = labels["Rodzaj paliwa"] ?? pickLabeledValue(rawText, "Rodzaj paliwa", ["Skrzynia biegów", "Typ nadwozia", "Pojemność skokowa"]);
  const gearboxFromDetails = labels["Skrzynia biegów"] ?? pickLabeledValue(rawText, "Skrzynia biegów", ["Typ nadwozia", "Pojemność skokowa", "Moc"]);
  const bodyFromDetails = labels["Typ nadwozia"] ?? pickLabeledValue(rawText, "Typ nadwozia", ["Pojemność skokowa", "Moc", "Opis"]);
  const driveFromDetails = labels["Napęd"] ?? labels["Rodzaj napędu"];
  const firstRegistrationFromDetails =
    labels["Data pierwszej rejestracji w historii pojazdu"] ??
    labels["Data pierwszej rejestracji"];
  const licensePlateFromDetails =
    labels["Numer rejestracyjny pojazdu"] ??
    labels["Numer rejestracyjny"];
  const sellerFromDetails =
    valueAfterHeadingInText(rawText, "Informacje o sprzedającym") ??
    labels["Sprzedający"];
  const locationFromMapLink = pickMatch(rawText, [/\[([^\]]+)\]\(https?:\/\/www\.google\.com\/maps/i]);
  const locationFromText = pickMatch(text, [
    /\bZnajd[źz]\s+na\s+mapie\b[^A-Za-z0-9]{0,20}([A-ZŁŚŻŹĆÓ][^,\n]{1,40},\s*[^,\n]{1,40})/i,
    /\bLokalizacja\b[^A-Za-z0-9]{0,20}([A-ZŁŚŻŹĆÓ][^,\n]{1,50})/i,
    /\bKontakt bezpośredni\b.*?\b([A-ZŁŚŻŹĆÓ][a-ząćęłńóśźż]+,\s*[A-ZŁŚŻŹĆÓ][^,\n]{1,40})\b/i,
  ]);

  const debugInfo = {
    fetchSource: html.includes("URL Source: http") ? "jina-markdown" : "html",
    title,
    portalHints: {
      hasNextData: html.includes("__NEXT_DATA__"),
      hasSellerSection: /informacje o sprzedającym/i.test(rawText),
      hasMapSection: /znajdź na mapie/i.test(rawText),
    },
    candidates: {
      drivetrain: {
        param: getParam(params, "drive", "driveWheels"),
        dom: domParams["Napęd"] ?? domParams["Rodzaj napędu"],
        labelMap: driveFromDetails,
        regex: rx.drivetrain,
        final: firstEnum(
          getParam(params, "drive", "driveWheels"),
          driveFromDetails,
          domParams["Napęd"],
          domParams["Rodzaj napędu"],
          valueAfterLabelInDom(doc, ["Napęd", "Rodzaj napędu"]),
          rx.drivetrain
        ),
      },
      licensePlate: {
        param: getParam(params, "plate_number", "registration_number", "license_plate"),
        dom: domParams["Numer rejestracyjny"] ?? domParams["Numer rejestracyjny pojazdu"],
        labelMap: licensePlateFromDetails,
        regex: rx.licensePlate,
        final: first(
          getParam(params, "plate_number", "registration_number", "license_plate"),
          domParams["Numer rejestracyjny"],
          domParams["Numer rejestracyjny pojazdu"],
          licensePlateFromDetails,
          valueAfterLabelInDom(doc, ["Numer rejestracyjny pojazdu", "Numer rejestracyjny"]),
          rx.licensePlate
        ),
      },
      location: {
        advert: advert?.location?.city?.name ?? advert?.location?.name,
        pageProps: pageProps?.location?.city?.name,
        deep: deepFind(advert, "cityName") ?? deepFind(pageProps, "cityName"),
        dom: domParams["Lokalizacja"],
        labelMap: labels["Lokalizacja"],
        mapLink: locationFromMapLink,
        regex: rx.location ?? locationFromText,
        final: first(
          advert?.location?.city?.name,
          advert?.location?.name,
          pageProps?.location?.city?.name,
          deepFind(advert, "cityName"),
          deepFind(pageProps, "cityName"),
          domParams["Lokalizacja"],
          labels["Lokalizacja"],
          locationFromMapLink,
          rx.location,
          locationFromText
        ),
      },
      seller: {
        advert: advert?.advertiser?.name ?? advert?.seller?.name,
        pageProps: pageProps?.seller?.name,
        deep: deepFind(advert, "sellerName"),
        dom: domParams["Sprzedający"],
        labelMap: sellerFromDetails,
        regex: rx.seller,
        final: first(
          advert?.advertiser?.name,
          advert?.seller?.name,
          pageProps?.seller?.name,
          deepFind(advert, "sellerName"),
          domParams["Sprzedający"],
          rx.seller,
          sellerFromDetails
        ),
      },
      firstRegistration: {
        param: getParam(params, "first_registration", "registration_date", "first_registration_year"),
        dom: domParams["Data pierwszej rejestracji w historii pojazdu"],
        labelMap: firstRegistrationFromDetails,
        regex: rx.firstRegistration,
      },
    },
  };

  return {
    brand: brand ?? cleanReal(brandFromDetails),
    model: model ?? cleanReal(modelFromDetails),
    variant: variant ?? titleGuess.variant,
    year: toNum(advert?.year ?? getParam(params, "year", "production_year", "model_year") ?? yearFromDetails ?? ld?.vehicleModelDate ?? pickMatch(text, [/\bRok produkcji\b[^0-9]{0,20}([12][0-9]{3})/i, /\bRok\b[^0-9]{0,20}([12][0-9]{3})/i])),
    price, currency,
    mileage: firstNum(
      advert?.mileage ??
      getParam(params, "mileage", "odometer", "mileage_from_odometer") ??
      deepFindAny(advert, ["mileage", "odometer", "mileageFromOdometer"]) ??
      deepFindAny(pageProps, ["mileage", "odometer", "mileageFromOdometer"]) ??
      domParams["Przebieg"] ??
      labels["Przebieg"] ??
      textFacts.mileage ??
      rx.mileage ??
      ld?.mileageFromOdometer?.value ??
      pickMatch(text, [/\bPrzebieg\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*km/i, /\bMileage\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*km/i])
    ),
    engineDisplacement: firstNum(
      getParam(params, "engine_capacity", "engineDisplacement", "engine_displacement") ??
      deepFindAny(advert, ["engine_capacity", "engineDisplacement", "engine_displacement"]) ??
      deepFindAny(pageProps, ["engine_capacity", "engineDisplacement", "engine_displacement"]) ??
      domParams["Pojemność skokowa"] ??
      labels["Pojemność skokowa"] ??
      textFacts.engineDisplacement ??
      rx.engineDisplacement ??
      ld?.engineDisplacement?.value ??
      pickMatch(text, [/\bPojemno(?:ść|sć|sc)\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*cm/i, /\bEngine capacity\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)/i])
    ),
    enginePower: firstNum(
      getParam(params, "engine_power", "power") ??
      deepFindAny(advert, ["engine_power", "power", "horsepower"]) ??
      deepFindAny(pageProps, ["engine_power", "power", "horsepower"]) ??
      domParams["Moc"] ??
      labels["Moc"] ??
      textFacts.enginePower ??
      rx.enginePower ??
      ld?.vehicleEngine?.enginePower?.value ??
      pickMatch(text, [/\bMoc\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*(?:KM|HP|kW)/i, /\bPower\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*(?:KM|HP|kW)/i])
    ),
    enginePowerUnit: "KM",
    fuelType: firstEnum(getParam(params, "fuel_type", "fuelType", "fuel"), ld?.fuelType, domParams["Rodzaj paliwa"], labels["Rodzaj paliwa"], fuelFromDetails, rx.fuelType),
    transmission: firstEnum(getParam(params, "gearbox", "transmission"), ld?.vehicleTransmission, domParams["Skrzynia biegów"], labels["Skrzynia biegów"], gearboxFromDetails, rx.transmission),
    drivetrain: firstEnum(
      getParam(params, "drive", "driveWheels") ??
      driveFromDetails ??
      domParams["Napęd"] ??
      domParams["Rodzaj napędu"] ??
      valueAfterLabelInDom(doc, ["Napęd", "Rodzaj napędu"]) ??
      rx.drivetrain ??
      pickMatch(text, [/\bNap[ęe]d\b[^A-Za-z0-9]{0,20}([A-Za-zĄĆĘŁŃÓŚŹŻ0-9 \-]{2,40})/i, /\b(?:RWD|FWD|AWD|4x4|4X4)\b/i])
    ),
    bodyType: firstEnum(getParam(params, "body_type", "bodyStyle", "car_type"), ld?.bodyType, domParams["Typ nadwozia"], labels["Typ nadwozia"], bodyFromDetails, rx.bodyType),
    color: null,
    doors: toNum(getParam(params, "doors_count", "doors") ?? doorsFromDetails),
    seats: null,
    vin: null,
    firstRegistration: cleanDate(first(
      advert?.firstRegistrationDate ??
      getParam(params, "first_registration", "registration_date", "first_registration_year") ??
      domParams["Data pierwszej rejestracji w historii pojazdu"] ??
      firstRegistrationFromDetails ??
      rx.firstRegistration ??
      pickLabeledValue(rawText, "Data pierwszej rejestracji w historii pojazdu", ["Kup ten pojazd na raty", "Specyfikacja"])
    )),
    licensePlate: first(
      getParam(params, "plate_number", "registration_number", "license_plate") ??
      domParams["Numer rejestracyjny"] ??
      domParams["Numer rejestracyjny pojazdu"] ??
      licensePlateFromDetails ??
      valueAfterLabelInDom(doc, ["Numer rejestracyjny pojazdu", "Numer rejestracyjny"]) ??
      rx.licensePlate
    ),
    condition: null,
    location: first(
      advert?.location?.city?.name ??
      advert?.location?.name ??
      pageProps?.location?.city?.name ??
      deepFind(advert, "cityName") ??
      deepFind(pageProps, "cityName") ??
      domParams["Lokalizacja"] ??
      labels["Lokalizacja"] ??
      locationFromMapLink ??
      rx.location ??
      locationFromText
    ),
    seller: first(
      advert?.advertiser?.name ??
      advert?.seller?.name ??
      pageProps?.seller?.name ??
      deepFind(advert, "sellerName") ??
      domParams["Sprzedający"] ??
      rx.seller ??
      sellerFromDetails
    ),
    description: clean(advert?.description ?? pageProps?.description),
    images: normalizeImageList(advert?.photos ?? advert?.images ?? pageProps?.photos ?? pageProps?.images),
    portal: "otomoto.pl",
    _adId: clean(idMatch?.[1] ?? advert?.id ?? advert?.uuid ?? deepFind(advert, "id")),
    __debug: debugInfo,
  };
}

function parseOlx(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);
  const rawText = doc.body?.textContent ?? "";
  const text = normText(doc.body?.textContent);

  const state = extractWindowJson(html, "__PRERENDERED_STATE__") ??
    extractWindowJson(html, "__INITIAL_STATE__") ??
    parseNextData(doc) ??
    extractScriptJsonById(html, "__NEXT_DATA__");

  const ad = state?.ad?.ad ?? state?.ad ?? state?.advert ?? {};
  const params = flattenParams(ad?.params ?? deepFind(state, "params"));

  const titleFromText = pickMatch(rawText, [/Title:\s*([^\n]+?)(?:\s+URL Source:|$)/i]);
  const title = ad?.title ?? getTitleFromDoc(doc) ?? titleFromText;
  const titleGuess = guessBrandModelFromTitle(title);
  const urlGuess = guessBrandModelFromUrl(url);
  const brand = clean(
    getParam(params, "car_brand", "brand", "make") ??
    deepFindAny(ad, ["car_brand", "brand", "make", "manufacturer"]) ??
    deepFindAny(state, ["car_brand", "brand", "make", "manufacturer"]) ??
    valueAfterLabelInDom(doc, ["Marka", "Marka pojazdu"]) ??
    pickLabeledValue(rawText, "Marka", ["Model", "Rok produkcji"]) ??
    titleGuess.brand
  );
  const model = clean(
    getParam(params, "car_model", "model") ??
    deepFindAny(ad, ["car_model", "model", "modelName"]) ??
    deepFindAny(state, ["car_model", "model", "modelName"]) ??
    valueAfterLabelInDom(doc, ["Model", "Model pojazdu"]) ??
    pickLabeledValue(rawText, "Model", ["Wersja", "Rok produkcji", "Przebieg"]) ??
    titleGuess.model
  );

  return {
    brand: brand ?? urlGuess.brand, model: model ?? urlGuess.model,
    variant: titleGuess.variant,
    year: toNum(
      getParam(params, "year", "model_year", "production_year") ??
      ld?.vehicleModelDate ??
      pickMatch(text, [/\bRok produkcji\b[^0-9]{0,20}([12][0-9]{3})/i, /\bRok\b[^0-9]{0,20}([12][0-9]{3})/i])
    ),
    price: toNum(ad?.price?.regularPrice?.value ?? ad?.price?.value ?? ld?.offers?.price),
    currency: clean(ad?.price?.regularPrice?.currency ?? ad?.price?.currency) ?? "PLN",
    mileage: toNum(
      getParam(params, "mileage", "kilometer_mileage", "odometer") ??
      ld?.mileageFromOdometer?.value ??
      pickMatch(text, [/\bPrzebieg\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*km/i])
    ),
    engineDisplacement: toNum(
      getParam(params, "engine_capacity", "engine_displacement") ??
      ld?.engineDisplacement?.value ??
      pickMatch(text, [/\bPojemno(?:ść|sć|sc)\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*cm/i])
    ),
    enginePower: toNum(
      getParam(params, "engine_power", "power") ??
      ld?.vehicleEngine?.enginePower?.value ??
      pickMatch(text, [/\bMoc\b[^0-9]{0,20}([0-9][0-9 .,\u00A0]*)\s*(?:KM|HP|kW)/i])
    ),
    enginePowerUnit: "KM",
    fuelType: cleanEnum(getParam(params, "fuel_type", "petrol", "fuel")),
    transmission: cleanEnum(getParam(params, "gearbox", "transmission")),
    drivetrain: cleanEnum(getParam(params, "drive", "drivetrain")),
    bodyType: cleanEnum(getParam(params, "car_type", "body_type", "bodyStyle")),
    color: cleanEnum(getParam(params, "color", "colour")),
    doors: toNum(getParam(params, "doors_count", "doors")),
    seats: null,
    vin: null,
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
];

const STEPS_OTOMOTO = ["Pobieranie przez Jina Reader", "Parsowanie strony", "Gotowe"];
const STEPS_OLX     = ["Pobieranie przez Jina Reader", "Parsowanie strony", "Gotowe"];

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
  const [showDebug, setShowDebug] = useState(false);

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
    setLoading(true); setError(null); setData(null); setShowDebug(false);
    const isOtomoto = /otomoto\.pl/i.test(u);
    const isOlx = /olx\.pl/i.test(u);
    const stepList = isOtomoto ? STEPS_OTOMOTO : STEPS_OLX;
    setSteps(stepList); setActive(0);

    try {
      setActive(0);
      const html = await fetchProxy(u);
      setActive(1);
      let car;
      if (isOtomoto) car = parseOtomoto(html, u);
      else if (isOlx) car = parseOlx(html, u);
      else throw new Error("Nieobsługiwany portal. Wspierane portale: otomoto.pl i olx.pl");

      setActive(stepList.length - 1);
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
                { ico: "🪪", lbl: "Nr rejestracyjny", val: data.licensePlate },
                { ico: "👤", lbl: "Sprzedający", val: data.seller },
                { ico: "📍", lbl: "Lokalizacja", val: data.location },
              ].map(({ ico, lbl, val, hi }) => (
                <div className="id-card" key={lbl}>
                  <div className="id-ico">{ico}</div>
                  <div>
                    <div className="id-lbl">{lbl}</div>
                    <div className={`id-val${!val ? " nil" : hi ? " found" : ""}`}>
                      {val ?? "Niedostępne"}
                    </div>
                  </div>
                </div>
              ))}
              <div className="id-card">
                <div className="id-ico">🔑</div>
                <div style={{ width: "100%" }}>
                  <div className="id-lbl">Numer VIN (ręcznie)</div>
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
              <strong>ℹ VIN ręczny</strong> — VIN nie jest pobierany automatycznie z ogłoszenia.
              Uzupełnij go ręcznie, jeśli chcesz mieć go w eksporcie JSON i raporcie.
            </div>

            <div className="info-note">
              <strong>ℹ Jak działa parser</strong> — Strona pobierana jest przez Jina Reader (`r.jina.ai`)
              i parsowana lokalnie. Dzięki temu omijamy blokady CORS proxy i dostajemy stabilny markdown
              z treścią ogłoszenia. Działa bez klucza API.
            </div>

            {data?.portal === "otomoto.pl" && data?.__debug && (
              <div className="note">
                <strong>🛠 Debug parsera</strong> — użyj, gdy w ogłoszeniu brakuje pól.
                <div style={{ marginTop: 8 }}>
                  <button className="act-btn" onClick={() => setShowDebug(v => !v)}>
                    {showDebug ? "Ukryj debug" : "Pokaż debug"}
                  </button>
                </div>
                {showDebug && (
                  <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", fontSize: 11 }}>
                    {JSON.stringify(data.__debug, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
