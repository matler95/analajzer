import { useState, useEffect, useCallback } from "react";
import { apiFetch, setTokens, clearTokens, getTokens, API_BASE } from "./api.js";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0b0f;--card:#16161f;--card2:#1a1a26;
  --border:#1e1e2a;--border2:#2a2a3a;
  --amber:#f0a500;--amber-bg:#f0a50012;--amber-glow:#f0a50030;
  --red:#e04545;--green:#3db87a;--blue:#4a9eff;
  --text:#dddde8;--sub:#7a7a96;--muted:#3e3e54;
  --ff-d:'Bebas Neue',sans-serif;--ff-u:'Outfit',sans-serif;--ff-m:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--text);font-family:var(--ff-u);-webkit-font-smoothing:antialiased}
.app{min-height:100vh;background-color:var(--bg);background-image:radial-gradient(circle at 18% 8%,#f0a50009 0%,transparent 45%),linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:100%,44px 44px,44px 44px}
.hdr{position:sticky;top:0;z-index:99;display:flex;align-items:center;gap:14px;padding:14px 36px;border-bottom:1px solid var(--border2);background:rgba(11,11,15,.88);backdrop-filter:blur(14px)}
.hdr-hex{width:34px;height:34px;flex-shrink:0;background:var(--amber);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);display:flex;align-items:center;justify-content:center;font-family:var(--ff-d);font-size:12px;color:#000;letter-spacing:1px}
.hdr-title{font-family:var(--ff-d);font-size:24px;letter-spacing:3px}
.hdr-sub{font-family:var(--ff-m);font-size:10px;color:var(--sub);letter-spacing:1px;margin-top:2px}
.hdr-pill{margin-left:auto;font-family:var(--ff-m);font-size:9px;letter-spacing:1.5px;padding:4px 12px;border:1px solid var(--border2);border-radius:20px;color:var(--sub)}
.main{max-width:860px;margin:0 auto;padding:44px 24px 80px}
.section-label{font-family:var(--ff-m);font-size:10px;color:var(--amber);letter-spacing:2.5px;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin-bottom:10px}
.section-label::before{content:'';display:block;width:10px;height:2px;background:var(--amber)}
.input-wrap{display:flex;border:1px solid var(--border2);border-radius:4px;overflow:hidden;background:var(--card);transition:border-color .2s,box-shadow .2s}
.input-wrap:focus-within{border-color:var(--amber);box-shadow:0 0 0 3px var(--amber-glow)}
.url-in{flex:1;background:transparent;border:none;outline:none;padding:15px 18px;font-family:var(--ff-m);font-size:13px;color:var(--text);min-width:0}
.url-in::placeholder{color:var(--muted)}
.portal-chip{display:flex;align-items:center;padding:0 14px;font-family:var(--ff-m);font-size:10px;letter-spacing:1px;border-left:1px solid var(--border2)}
.portal-chip.otomoto{color:#ff6b35}.portal-chip.olx{color:var(--green)}
.go-btn{padding:0 28px;background:var(--amber);border:none;cursor:pointer;font-family:var(--ff-d);font-size:17px;letter-spacing:2px;color:#000;transition:background .15s,transform .1s;flex-shrink:0}
.go-btn:hover{background:#ffc22a}.go-btn:active{transform:scale(.97)}.go-btn:disabled{background:var(--muted);color:var(--sub);cursor:not-allowed}
.hint{margin-top:9px;font-family:var(--ff-m);font-size:10px;color:var(--sub);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hint-dot{color:var(--muted)}
.loader{margin-top:32px;border:1px solid var(--border2);border-radius:4px;background:var(--card);padding:44px;text-align:center;animation:fadeUp .3s ease}
.spin{width:44px;height:44px;border:2px solid var(--border2);border-top-color:var(--amber);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px}
.load-msg{font-family:var(--ff-m);font-size:11px;color:var(--amber);letter-spacing:1px}
.err{margin-top:24px;border:1px solid var(--red);background:#e0454510;border-radius:4px;padding:18px 22px;font-family:var(--ff-m);font-size:12px;color:var(--red);animation:fadeUp .3s ease;display:flex;gap:12px;align-items:flex-start;line-height:1.6}
.err-ico{font-size:16px;flex-shrink:0}
.result{margin-top:32px;animation:fadeUp .4s ease}
.car-hero{position:relative;overflow:hidden;border:1px solid var(--border2);border-radius:4px 4px 0 0;background:var(--card);padding:30px 32px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.car-hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--amber),var(--amber) 40%,transparent)}
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
.spec-lbl-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
.spec-val{font-family:var(--ff-m);font-size:14px;font-weight:600;color:var(--text)}
.spec-val .u{font-size:10px;color:var(--sub);font-weight:400;margin-left:3px}
.spec-val.nil{color:var(--muted);font-weight:400;font-size:12px}
.cmp-badge{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;font-family:var(--ff-m);font-size:11px;border:1px solid var(--border2);color:var(--sub);background:var(--card2);line-height:1}
.cmp-badge.ok{color:var(--green);border-color:#3db87a66;background:#3db87a1a}
.cmp-badge.warning{color:var(--red);border-color:#e0454566;background:#e045451a}
.cmp-badge.check{color:var(--amber);border-color:#f0a50066;background:#f0a5001a}
.hero-line{display:flex;align-items:center;gap:10px}
.hero-line .cmp-badge{width:20px;height:20px;font-size:12px}
.identity{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);margin-top:1px}
.id-card{background:var(--card);padding:18px 22px;display:flex;align-items:center;gap:16px}
.id-ico{font-size:22px;opacity:.45;flex-shrink:0}
.id-lbl{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.id-val{font-family:var(--ff-m);font-size:13px;font-weight:600;letter-spacing:1px}
.id-val.nil{color:var(--muted);font-weight:400;font-size:12px;letter-spacing:.5px}
.id-input{width:100%;background:transparent;border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:var(--ff-m);font-size:14px;letter-spacing:1px;padding:8px 10px;outline:none}
.id-input:focus{border-color:var(--amber);box-shadow:0 0 0 2px var(--amber-glow)}
.id-input[type="date"]{color-scheme:dark}
.desc-box{margin-top:1px;background:var(--card);border:1px solid var(--border2);padding:16px 18px}
.desc-lbl{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.desc-txt{color:var(--text);font-size:13px;line-height:1.6;white-space:pre-wrap;max-height:260px;overflow-y:auto}
.gallery{margin-top:1px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--border)}
.gallery-item{position:relative;display:block;background:var(--card);aspect-ratio:4/3;overflow:hidden}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .2s}
.gallery-item:hover img{transform:scale(1.03)}
.actions{display:flex;gap:1px;background:var(--border);margin-top:1px}
.act-btn{flex:1;background:var(--card);border:none;cursor:pointer;padding:13px 16px;font-family:var(--ff-d);font-size:15px;letter-spacing:1.5px;color:var(--sub);display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
.act-btn:hover{background:var(--card2);color:var(--text)}
.act-btn.primary{background:var(--amber-bg);color:var(--amber)}
.act-btn.primary:hover{background:var(--amber);color:#000}
.src-bar{background:var(--card);border-top:1px solid var(--border);padding:10px 18px;font-family:var(--ff-m);font-size:10px;color:var(--sub);display:flex;justify-content:space-between;align-items:center;gap:12px}
.src-bar a{color:var(--sub);text-decoration:none;word-break:break-all}
.src-bar a:hover{color:var(--amber)}
.note{margin-top:14px;padding:12px 16px;border:1px solid var(--border2);border-left:3px solid var(--amber);background:var(--card);font-family:var(--ff-m);font-size:11px;color:var(--sub);line-height:1.6}
.note strong{color:var(--amber)}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:680px){
  .specs{grid-template-columns:repeat(2,1fr)}.identity{grid-template-columns:1fr}
  .gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.car-hero{flex-direction:column}
  .ch-price{text-align:left}.ch-model{font-size:38px}.price-val{font-size:34px}
  .actions{flex-direction:column}.hdr{padding:12px 16px}.main{padding:28px 16px 60px}
}
.tabs{display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border2);padding-bottom:8px}
.tab{background:transparent;border:none;font-family:var(--ff-d);font-size:14px;letter-spacing:2px;color:var(--sub);padding:8px 16px;cursor:pointer;border-radius:4px 4px 0 0}
.tab:hover{color:var(--text)}.tab.on{color:var(--amber);background:var(--amber-bg)}
.auth-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px;padding:12px 14px;border:1px solid var(--border2);border-radius:4px;background:var(--card)}
.auth-row input{background:var(--card2);border:1px solid var(--border2);color:var(--text);padding:8px 10px;border-radius:4px;font-family:var(--ff-m);font-size:12px;min-width:140px}
.auth-row .mini{font-family:var(--ff-m);font-size:10px;color:var(--sub)}
.history-list{display:flex;flex-direction:column;gap:10px}
.hist-row{position:relative;display:grid;grid-template-columns:120px 1fr auto;gap:12px;align-items:stretch;border:1px solid var(--border2);border-radius:4px;overflow:hidden;background:var(--card);cursor:pointer;transition:border-color .15s}
.hist-row:hover{border-color:var(--amber)}
.hist-thumb{width:120px;aspect-ratio:16/10;object-fit:cover;background:var(--card2)}
.hist-main{padding:10px 12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.hist-title{font-family:var(--ff-d);font-size:24px;letter-spacing:1.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.hist-meta{font-family:var(--ff-m);font-size:9px;color:var(--sub)}
.hist-sub{font-family:var(--ff-m);font-size:11px;color:var(--text);opacity:.9}
.hist-sub .dim{color:var(--sub)}
.hist-badges{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.hist-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-family:var(--ff-m);font-size:9px;letter-spacing:.3px;border:1px solid var(--border2);background:var(--card2);color:var(--sub)}
.hist-badge.ok{border-color:#3d5d47;background:#2a2f2a;color:#b5f4c8}
.hist-badge.warn{border-color:#7f5b2f;background:#3a2c1f;color:#ffd18c}
.hist-badge.check{border-color:#f0a50066;background:#f0a5001a;color:var(--amber)}
.hist-actions{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-left:1px solid var(--border)}
.hist-actions .act-mini{border:1px solid var(--border2);background:var(--card2);color:var(--sub);border-radius:8px;padding:8px 10px;cursor:pointer;font-family:var(--ff-m);font-size:11px;text-align:center}
.hist-actions .act-mini:hover{border-color:var(--amber);color:var(--text)}
.hist-actions .act-mini.primary{background:var(--amber-bg);color:var(--amber)}
.hist-actions .act-mini.primary:hover{background:var(--amber);color:#000}
.hist-actions .act-mini.danger{background:#e0454510;color:#ffb0b0}
.hist-actions .act-mini.danger:hover{background:#4a1f1f;border-color:#e04545}
.hist-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.hist-field{border:1px solid transparent;border-radius:8px;padding:8px 10px;background:transparent;min-width:0;transition:background .15s,border-color .15s}
.hist-field:hover{background:var(--card2);border-color:var(--border2)}
.hist-field:focus-within{background:var(--card2);border-color:var(--amber);box-shadow:0 0 0 2px var(--amber-glow)}
.hist-field .k{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:1.5px;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;gap:8px}
.hist-field .v{margin-top:6px;font-family:var(--ff-m);font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hist-field .v.nil{color:var(--muted)}
.hist-field input{width:100%;margin-top:6px}
.hist-field .edit-actions{margin-top:8px}
.hist-tap{margin-top:6px;width:100%;text-align:left;border:none;background:transparent;color:inherit;padding:0;cursor:text}
.hist-tap:focus{outline:none}
.hist-row-note{font-family:var(--ff-m);font-size:10px;color:var(--sub)}
@media(max-width:680px){
  .hist-row{grid-template-columns:90px 1fr;grid-template-rows:auto auto}
  .hist-thumb{width:90px}
  .hist-actions{grid-column:1 / -1;flex-direction:row;flex-wrap:wrap}
  .hist-fields{grid-template-columns:1fr}
}
.edit-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.edit-actions{display:flex;gap:6px}
.edit-btn{border:1px solid var(--border2);background:var(--card2);color:var(--sub);border-radius:6px;padding:4px 8px;cursor:pointer;font-family:var(--ff-m);font-size:11px}
.edit-btn:hover{color:var(--text);border-color:var(--amber)}
.edit-err{margin-top:8px;font-family:var(--ff-m);font-size:10px;color:var(--red);line-height:1.4}
.cepik-panel{margin-top:16px;border:1px solid var(--border2);border-radius:4px;background:var(--card);padding:16px 18px}
.cepik-title{font-family:var(--ff-m);font-size:10px;color:var(--amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}
.check-row{display:flex;align-items:flex-start;gap:10px;font-family:var(--ff-m);font-size:12px;padding:6px 0;border-bottom:1px solid var(--border)}
.check-row:last-child{border-bottom:none}
.check-ico{flex-shrink:0;width:20px;text-align:center}
.check-field{flex:1;color:var(--sub);font-size:10px;text-transform:uppercase;letter-spacing:1px}
.check-msg{flex:2;color:var(--text);line-height:1.4}
.meta-pill{display:inline-block;font-size:9px;padding:2px 8px;border-radius:10px;background:var(--card2);color:var(--sub);margin-left:8px}
@media print{
  .hdr,.input-area,.actions,.note,.tabs,.auth-row,.cepik-panel{display:none!important}
  .app{background:white!important;background-image:none!important}body{color:#000!important}
  .car-hero,.spec,.id-card,.src-bar{background:white!important;border-color:#ddd!important}
  .ch-model,.spec-val,.id-val{color:#000!important}.ch-brand,.price-val{color:#c47a00!important}
  .spec-lbl,.id-lbl,.ch-src,.price-note{color:#888!important}.specs,.identity,.actions{background:#ddd!important}
}
`;

/* ─── FETCH via Jina AI reader ───────────────────────────── */
// r.jina.ai konwertuje stronę na czysty Markdown — omija CORS i anti-bot.
// Nie wymaga klucza API dla podstawowego użycia.
async function fetchPage(url) {
  const endpoint = `https://r.jina.ai/${url}`;
  const score = (txt) => {
    const t = String(txt ?? "");
    const low = t.toLowerCase();
    let s = 0;
    if (t.length > 2000) s += 2;
    if (/##\s+najważniejsze/i.test(t)) s += 3;
    if (/##\s+szczegóły/i.test(t)) s += 3;
    if (/informacje o sprzedającym/i.test(low)) s += 2;
    if (/nap[ęe]d/i.test(low)) s += 2;
    if (/rejestracyj/i.test(low)) s += 2;
    if (/znajd[źz] na mapie|krak[óo]w/i.test(low)) s += 2;
    if (/request blocked|cloudfront|403 error/i.test(low)) s -= 10;
    return s;
  };
  const attempts = [
    // Fast markdown default
    { Accept: "text/plain", "x-respond-with": "markdown" },
    // Broader content extraction for collapsed sections
    { Accept: "text/plain", "x-target-selector": "main,article,body", "x-respond-with": "markdown" },
    // Target full Next payload area (still markdown transformed)
    { Accept: "text/plain", "x-target-selector": "script#__NEXT_DATA__", "x-respond-with": "markdown" },
    // Last resort, default reader mode
    { Accept: "text/plain" },
  ];

  let lastErr = null;
  let best = "";
  let bestScore = -Infinity;
  for (const headers of attempts) {
    try {
      const res = await fetch(endpoint, {
        headers,
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`Jina HTTP ${res.status}`);
      const text = await res.text();
      const s = score(text);
      if (s > bestScore || (s === bestScore && text.length > best.length)) {
        best = text;
        bestScore = s;
      }
      if (s >= 8 && text.length > 1200) return text;
    } catch (e) {
      lastErr = e;
    }
  }

  if (best.length > 100) return best;
  throw new Error(`Pusta odpowiedź z Jina AI${lastErr ? `: ${lastErr.message}` : ""}`);
}


/* ─── PARSER ─────────────────────────────────────────────── */
// Jina zwraca Markdown. Parsujemy go prostymi regexami.
// Obsługiwane formaty linii:
//   **Marka pojazdu:** Toyota
//   Marka pojazdu\nToyota
//   | Marka pojazdu | Toyota |

const toNum = v => {
  if (v == null) return null;
  const original = String(v).toLowerCase();
  let s = String(v)
    .replace(/\u00a0/g, " ")
    .replace(/[^\d,.\s]/g, "")
    .replace(/\s+/g, "");
  if (!s) return null;
  // 127.000 / 127,000 -> 127000
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    s = s.replace(/[.,]/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(".") && !s.includes(",")) {
    s = /\.\d{1,2}$/.test(s) ? s : s.replace(/\./g, "");
  } else if (s.includes(".") && s.includes(",")) {
    // Jeśli oba separatory: traktuj ostatni jako dziesiętny tylko przy 1-2 cyfrach po nim.
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    const idx = Math.max(lastDot, lastComma);
    const fracLen = s.length - idx - 1;
    if (fracLen <= 2) {
      const intPart = s.slice(0, idx).replace(/[.,]/g, "");
      const frac = s.slice(idx + 1);
      s = `${intPart}.${frac}`;
    } else {
      s = s.replace(/[.,]/g, "");
    }
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  // "127 tys." => 127000
  if (/\btys\b/.test(original) && n < 1000) return Math.round(n * 1000);
  return n;
};

const clean = v =>
  v ? String(v).trim().replace(/!\[.*?\]\(.*?\)/g, "").replace(/\*+/g, "").replace(/\s+/g, " ").trim() || null : null;

const cleanDate = v => {
  if (!v) return null;
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}$/.test(s)) return s;
  const m = s.match(/\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4}/);
  return m ? m[0] : s;
};

const normKey = s =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\*+/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function buildKvMap(md) {
  const map = {};
  const lines = String(md).split(/\r?\n/);

  const add = (k, v) => {
    const key = normKey(k);
    const val = clean(v);
    if (!key || !val) return;
    if (!map[key]) map[key] = val;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // | Label | Value |
    const table = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
    if (table) add(table[1], table[2]);

    // **Label:** Value / Label: Value
    const inline = line.match(/^(?:\*{1,2})?([^:*|]{2,80}?)(?:\*{1,2})?\s*:\s*(.{1,120})$/);
    if (inline) add(inline[1], inline[2]);

    // Label on one line, value on next line
    const lblOnly = line.match(/^(?:\*{1,2})?([^:*|]{2,80}?)(?:\*{1,2})?$/);
    if (lblOnly && lines[i + 1]) {
      const next = lines[i + 1].trim();
      if (
        next &&
        !/^(#|\*|-|\|)/.test(next) &&
        !/:$/.test(next) &&
        next.length <= 120
      ) {
        add(lblOnly[1], next);
      }
    }
  }

  return map;
}

function fromKv(kv, ...keys) {
  for (const k of keys) {
    const v = kv[normKey(k)];
    if (v) return v;
  }
  return null;
}

/** Szuka wartości tekstowej po jednej z podanych etykiet */
function field(md, ...labels) {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      // **Label:** Value  lub  **Label** Value
      new RegExp(`\\*{1,2}${esc}\\*{0,2}\\s*:?\\*{0,2}\\s+([^\\n*|]{1,80})`, "i"),
      // Label: Value (plaintext)
      new RegExp(`^${esc}\\s*:\\s*([^\\n|]{1,80})`, "im"),
      // Label na linii, wartość na następnej
      new RegExp(`^${esc}\\s*$\\n([^\\n#|*]{1,80})`, "im"),
      // | Label | Value |
      new RegExp(`\\|\\s*${esc}\\s*\\|\\s*([^|\\n]{1,80})\\s*\\|`, "i"),
    ];
    for (const re of patterns) {
      const val = clean(md.match(re)?.[1]);
      if (val && val.toLowerCase() !== label.toLowerCase()) return val;
    }
  }
  return null;
}

/** Szuka wartości numerycznej po etykiecie */
function fieldNum(md, ...labels) {
  const v = field(md, ...labels);
  if (v) {
    const n = toNum(v.replace(/\s*(km|cm3|cm³|KM|HP|kW)\b.*/i, ""));
    if (n != null) return n;
  }
  return null;
}

/** Szuka pierwszej liczby z określoną jednostką w całym tekście */
function findNumUnit(md, unitRe) {
  const m = md.match(new RegExp(`([0-9][\\d\\s.,\u00a0]*)\\s*${unitRe}`, "i"));
  return m ? toNum(m[1]) : null;
}

function extractMileage(md, kv) {
  const candidates = [];
  const kvMileage = fromKv(kv, "Przebieg", "Przebieg (km)", "Mileage");
  if (kvMileage) candidates.push(toNum(kvMileage));
  const fieldMileage = field(md, "Przebieg", "Przebieg (km)", "Mileage");
  if (fieldMileage) candidates.push(toNum(fieldMileage));

  // Najbardziej precyzyjny wzorzec: liczba bezpośrednio przy etykiecie "Przebieg".
  const nearLabel = md.match(/Przebieg[\s:|\-*]*\n?\s*([0-9][\d\s.,\u00a0]*(?:\s*tys\.?)?)\s*km\b/i);
  if (nearLabel?.[1]) candidates.push(toNum(nearLabel[1]));

  // Fallback globalny.
  candidates.push(findNumUnit(md, "km\\b"));

  const valid = candidates.filter(n => Number.isFinite(n));
  if (!valid.length) return null;

  // Dla przebiegu wolimy największą sensowną wartość (unika zaniżenia do 127 z "127 tys.")
  return Math.max(...valid);
}

function detectPortal(url) {
  if (/otomoto\.pl/i.test(url)) return "otomoto";
  if (/olx\.pl/i.test(url)) return "olx";
  return "unknown";
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m) ?? md.match(/^Title:\s*(.+)$/im);
  return clean(m?.[1]?.split("|")[0]?.split(" - ")[0]);
}

function extractImages(md) {
  const imgs = new Set();
  let m;
  const re1 = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  while ((m = re1.exec(md)) !== null) imgs.add(m[1]);
  const re2 = /\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)[^\s)]*)\)/gi;
  while ((m = re2.exec(md)) !== null) imgs.add(m[1]);
  return [...imgs].filter(url => !/otomoto.*logo/i.test(url)).slice(0, 6);
}

function extractDescription(md) {
  const normalize = text => {
    const cleaned = text
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .filter(line => {
        const trim = line.trim();
        if (!trim) return false;
        if (/!\[.*?\]\(.*?\)/i.test(trim)) return false;
        if (/^\[.*?\]\(.*?\)$/i.test(trim)) return false;
        if (/^\s*\[\s*\]\(.*?\)/.test(trim)) return false;
        return true;
      })
      .join("\n");
    return clean(cleaned);
  };

  // 1) Nagłówki Markdown: # Opis / ## Description
  let m = md.match(/(?:^|\n)#{1,3}\s*(?:Opis|Description)[^\n]*\n([\s\S]*?)(?=\n#{1,3}|\n(?:Opis ogłoszenia|Opis|Description)|$)/i);
  if (m) {
    const desc = normalize(m[1]);
    if (desc) return desc;
  }

  // 2) Wyrażenie opisowe bez nagłówka: Opis ogłoszenia / Opis / Description
  m = md.match(/(?:^|\n)(?:Opis ogłoszenia|Opis|Description)\s*[:]?\s*\n([\s\S]*?)(?=\n#{1,3}|\n(?:Opis ogłoszenia|Opis|Description)|$)/i);
  if (m) {
    const desc = normalize(m[1]);
    if (desc) return desc;
  }

  // 3) Fallback: pierwszy sensowny długi blok tekstu
  for (const block of md.split(/\n{2,}/)) {
    const t = block.trim();
    if (
      t.length > 60 &&
      !/^[*#|]/.test(t) &&
      !/^\*\*(Marka|Model|Rok|Przebieg|Moc|Paliwo|Cena)/i.test(t)
    ) {
      const fallback = normalize(t);
      if (fallback) return fallback;
    }
  }

  return null;
}

function extractLocationFromMarkdown(md) {
  const text = String(md ?? "");
  const patterns = [
    // Most common: linked location text
    /\[([A-ZŁŚŻŹĆÓ][^\]\n]{2,60},\s*[A-ZŁŚŻŹĆÓ][^\]\n]{2,60})\]\((?:https?:\/\/)?(?:www\.)?otomoto\.pl\/[^\)]*\)/i,
    // Location appears shortly after "Znajdź na mapie"
    /Znajd[źz]\s+na\s+mapie[\s\S]{0,220}\[([A-ZŁŚŻŹĆÓ][^\]\n]{2,60},\s*[A-ZŁŚŻŹĆÓ][^\]\n]{2,60})\]\(/i,
    // Plain text location
    /\b([A-ZŁŚŻŹĆÓ][a-ząćęłńóśźż]+,\s*[A-ZŁŚŻŹĆÓ][A-Za-ząćęłńóśźż \-]{2,60})\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const v = clean(m?.[1]);
    if (v) return v;
  }
  return null;
}

function parseMd(md, url) {
  const kv = buildKvMap(md);
  const lines = String(md).split(/\r?\n/);
  const sectionSlice = (name, radius = 14) => {
    const idx = lines.findIndex(l => new RegExp(name, "i").test(l));
    if (idx < 0) return null;
    const from = Math.max(0, idx - radius);
    const to = Math.min(lines.length, idx + radius + 1);
    return lines.slice(from, to).join("\n");
  };
  const keywordHits = (keywords) =>
    lines
      .filter(l => keywords.some(k => new RegExp(k, "i").test(l)))
      .slice(0, 40);
  // Tytuł i podstawowe dane z tytułu
  const title = extractTitle(md);
  const titleTokens = (title ?? "")
    .split(/\s+/)
    .filter(t => !/^[12]\d{3}$/.test(t) && t.length > 1);
  const tBrand = clean(titleTokens[0]);
  const tModel = clean(titleTokens[1]);

  const brand = clean(fromKv(kv, "Marka pojazdu", "Marka", "Make") ?? field(md, "Marka pojazdu", "Marka", "Make") ?? tBrand);
  const model = clean(fromKv(kv, "Model pojazdu", "Model") ?? field(md, "Model pojazdu", "Model") ?? tModel);

  // Wariant — reszta tytułu po usunięciu marki i modelu
  let variant = null;
  if (title && brand && model) {
    const v = title
      .replace(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(/\|.*$/, "").replace(/\s+/g, " ").trim();
    if (v.length > 1 && v.length < 60) variant = v;
  }

  // Cena
  const priceRaw = field(md, "Cena", "Price");
  const price = priceRaw
    ? toNum(priceRaw.replace(/\s*(PLN|zł|EUR|USD).*/i, ""))
    : findNumUnit(md, "(?:PLN|zł)");
  const currency = /\bEUR\b/.test(md.slice(0, 3000)) ? "EUR" : "PLN";

  // Rok
  const year =
    fieldNum(md, "Rok produkcji", "Rok", "Year") ??
    (() => {
      const m = md.match(/Rok\s+produkcji[^0-9]{0,20}([12]\d{3})/i);
      return m ? +m[1] : null;
    })();

  const drivetrainKv = fromKv(kv, "Napęd", "Rodzaj napędu", "Drive");
  const drivetrainField = field(md, "Napęd", "Rodzaj napędu", "Drive");
  const licensePlateKv = fromKv(kv, "Numer rejestracyjny pojazdu", "Numer rejestracyjny", "License plate");
  const licensePlateField = field(md, "Numer rejestracyjny pojazdu", "Numer rejestracyjny", "License plate");
  const locationKv = fromKv(kv, "Lokalizacja", "Miasto", "Location", "City");
  const locationField = field(md, "Lokalizacja", "Miasto", "Location", "City");
  const locationMap = extractLocationFromMarkdown(md);
  const sellerKv = fromKv(kv, "Sprzedający", "Informacje o sprzedającym", "Seller");
  const sellerField = field(md, "Sprzedający", "Informacje o sprzedającym", "Seller");
  const sellerSection =
    (() => {
      const m = md.match(/##\s*Informacje o sprzedającym\s*\n+([^\n*#|]{2,80})/i);
      return clean(m?.[1]);
    })();
  const firstRegistrationKv = fromKv(kv, "Data pierwszej rejestracji w historii pojazdu", "Data pierwszej rejestracji", "Pierwsza rejestracja");
  const firstRegistrationField = field(md, "Data pierwszej rejestracji w historii pojazdu", "Data pierwszej rejestracji", "Pierwsza rejestracja");

  return {
    brand, model, variant,
    year,
    price, currency,
    mileage: extractMileage(md, kv),
    engineDisplacement:
      fieldNum(fromKv(kv, "Pojemność skokowa", "Pojemność", "Engine capacity")) ??
      fieldNum(md, "Pojemność skokowa", "Pojemność", "Engine capacity") ??
      findNumUnit(md, "cm[3³]"),
    enginePower:
      fieldNum(fromKv(kv, "Moc", "Power")) ??
      fieldNum(md, "Moc", "Power") ??
      findNumUnit(md, "KM\\b"),
    enginePowerUnit: "KM",
    fuelType:      fromKv(kv, "Rodzaj paliwa", "Paliwo", "Fuel type") ?? field(md, "Rodzaj paliwa", "Paliwo", "Fuel type"),
    transmission:  fromKv(kv, "Skrzynia biegów", "Skrzynia", "Transmission", "Gearbox") ?? field(md, "Skrzynia biegów", "Skrzynia", "Transmission", "Gearbox"),
    drivetrain:    drivetrainKv ?? drivetrainField,
    bodyType:      fromKv(kv, "Typ nadwozia", "Nadwozie", "Body type") ?? field(md, "Typ nadwozia", "Nadwozie", "Body type"),
    color:         fromKv(kv, "Kolor", "Kolor nadwozia", "Color") ?? field(md, "Kolor", "Kolor nadwozia", "Color"),
    doors:         fieldNum(fromKv(kv, "Liczba drzwi", "Drzwi", "Doors")) ?? fieldNum(md, "Liczba drzwi", "Drzwi", "Doors"),
    seats:         fieldNum(fromKv(kv, "Liczba miejsc", "Miejsca", "Seats")) ?? fieldNum(md, "Liczba miejsc", "Miejsca", "Seats"),
    firstRegistration: cleanDate(firstRegistrationKv ?? firstRegistrationField),
    licensePlate: licensePlateKv ?? licensePlateField,
    vin: null, // Otomoto nie udostępnia VIN publicznie
    location: locationKv ?? locationField ?? locationMap,
    seller: sellerKv ?? sellerField ?? sellerSection,
    description: extractDescription(md),
    images: extractImages(md),
    portal: /otomoto\.pl/i.test(url) ? "otomoto.pl" : /olx\.pl/i.test(url) ? "olx.pl" : url,
    __debug: {
      source: "jina-markdown",
      mdLength: md.length,
      qualityHints: {
        hasNapedWord: /nap[ęe]d/i.test(md),
        hasRejestrWord: /rejestracyj/i.test(md),
        hasMapWord: /znajd[źz] na mapie|krak[óo]w/i.test(md),
      },
      hasSections: {
        spec: /specyfikacja/i.test(md),
        history: /stan i historia/i.test(md),
        seller: /informacje o sprzedającym/i.test(md),
      },
      candidates: {
        drivetrain: { kv: drivetrainKv, field: drivetrainField, final: drivetrainKv ?? drivetrainField ?? null },
        licensePlate: { kv: licensePlateKv, field: licensePlateField, final: licensePlateKv ?? licensePlateField ?? null },
        location: { kv: locationKv, field: locationField, map: locationMap, final: locationKv ?? locationField ?? locationMap ?? null },
        seller: { kv: sellerKv, field: sellerField, section: sellerSection, final: sellerKv ?? sellerField ?? sellerSection ?? null },
        firstRegistration: { kv: firstRegistrationKv, field: firstRegistrationField, final: cleanDate(firstRegistrationKv ?? firstRegistrationField) },
      },
      kvKeysSample: Object.keys(kv).slice(0, 80),
      sectionsPreview: {
        najwazniejsze: sectionSlice("Najważniejsze"),
        specyfikacja: sectionSlice("Specyfikacja"),
        stanHistoria: sectionSlice("Stan i historia"),
        seller: sectionSlice("Informacje o sprzedającym"),
      },
      keywordLines: keywordHits([
        "napęd",
        "rodzaj napędu",
        "rejestracyj",
        "lokalizacja",
        "znajdź na mapie",
        "pierwszej rejestracji",
        "kraków",
        "nowa huta",
      ]),
    },
  };
}

function stripDebug(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const { __debug, ...rest } = obj;
  return rest;
}

function normalizeDateForCepik(s) {
  if (!s) return "";
  const t = String(s).trim();
  const plMonthMap = {
    stycznia: "01",
    lutego: "02",
    marca: "03",
    kwietnia: "04",
    maja: "05",
    czerwca: "06",
    lipca: "07",
    sierpnia: "08",
    września: "09",
    wrzesnia: "09",
    października: "10",
    pazdziernika: "10",
    listopada: "11",
    grudnia: "12",
  };
  const iso = t.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const pl = t.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})/);
  if (pl) return `${pl[3]}-${pl[2]}-${pl[1]}`;
  const plText = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (plText) {
    const dd = String(plText[1]).padStart(2, "0");
    const mm = plMonthMap[plText[2]] || null;
    const yyyy = plText[3];
    if (mm) return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}$/.test(t)) return `${t}-01-01`;
  return t;
}

function buildExportPayload(data, cepikResult) {
  const base = stripDebug(data);
  if (!cepikResult) return base;
  return {
    ...base,
    cepik: {
      technicalData: cepikResult.technicalData,
      odometerReadings: cepikResult.odometerReadings,
      events: cepikResult.events,
      meta: cepikResult.meta,
      comparison: cepikResult.comparison,
    },
  };
}

function mergeSearchRecord(row) {
  const snap = row.snapshot_json || {};
  return {
    ...snap,
    listingUrl: row.listing_url || snap.listingUrl,
    vin: row.manual_vin ?? snap.vin ?? null,
    firstRegistration: row.manual_first_registration ?? snap.firstRegistration ?? null,
    licensePlate: row.manual_license_plate ?? snap.licensePlate ?? null,
  };
}

function normListingUrl(u) {
  return String(u || "").trim().replace(/\/+$/, "");
}

function normalizeLicensePlate(input) {
  const s = String(input || "")
    .toUpperCase()
    .replace(/\u00a0/g, " ")
    .trim();
  // usuń spacje i łączniki z wklejonej wartości
  return s.replace(/[\s-]+/g, "");
}

function isValidLicensePlate(input) {
  const s = normalizeLicensePlate(input);
  // dość liberalnie: PL tablice zwykle 5-8 znaków, litery+cyfry
  return /^[A-Z0-9]{5,8}$/.test(s);
}

function normalizeVin(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, "");
}

function isValidVin(input) {
  const s = normalizeVin(input);
  // VIN: 17 znaków, bez I/O/Q
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(s);
}

/** FastAPI: detail bywa stringiem, tablicą {loc,msg,type} albo obiektem — zawsze na czytelny string pod React. */
function formatFastApiDetail(detail) {
  if (detail == null || detail === "") return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map(e => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object" && e.msg != null) {
          const loc = Array.isArray(e.loc) ? e.loc.filter(Boolean).join(" · ") : "";
          return loc ? `${loc}: ${e.msg}` : String(e.msg);
        }
        try {
          return JSON.stringify(e);
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof detail === "object" && detail.msg != null) return String(detail.msg);
  try {
    return JSON.stringify(detail);
  } catch {
    return "Błąd serwera";
  }
}

/* ─── FIELDS CONFIG ──────────────────────────────────────── */
const FIELDS = [
  { key: "year",               lbl: "Rok" },
  { key: "mileage",            lbl: "Przebieg",    u: "km",  fmt: v => v?.toLocaleString("pl-PL") },
  { key: "firstRegistration",  lbl: "Pierwsza rej." },
  { key: "engineDisplacement", lbl: "Pojemność",   u: "cm³", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "enginePower",        lbl: "Moc",         uFn: d => d.enginePowerUnit || "KM" },
  { key: "fuelType",           lbl: "Paliwo" },
  { key: "transmission",       lbl: "Skrzynia" },
  { key: "drivetrain",         lbl: "Napęd" },
  { key: "bodyType",           lbl: "Nadwozie" },
  { key: "color",              lbl: "Kolor" },
  { key: "doors",              lbl: "Drzwi" },
  { key: "seats",              lbl: "Miejsca" },
];

const COMPARISON_TO_UI = {
  year: "year",
  fuelType: "fuelType",
  engineDisplacement: "engineDisplacement",
  enginePower: "enginePower",
  mileage: "mileage",
  firstRegistration: "firstRegistration",
  brand: "brand",
  model: "model",
};

function normalizeCompareFieldName(name) {
  const n = String(name ?? "").trim();
  return COMPARISON_TO_UI[n] || null;
}

function buildComparisonLookup(cepik) {
  const checks = cepik?.comparison?.checks;
  if (!Array.isArray(checks)) return {};
  const map = {};
  for (const c of checks) {
    const key = normalizeCompareFieldName(c?.field);
    if (key && !map[key]) map[key] = c;
  }
  return map;
}

function checkIcon(status) {
  if (status === "ok") return "✓";
  if (status === "warning") return "!";
  return "○";
}

function checkTooltip(check) {
  if (!check) return "";
  if (check.message) return String(check.message);
  const left = check.listing != null ? JSON.stringify(check.listing) : "brak danych";
  const right = check.cepi != null ? JSON.stringify(check.cepi) : "brak danych";
  return `Ogłoszenie: ${left} | CEPiK: ${right}`;
}

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [tab, setTab] = useState("analyze");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [me, setMe] = useState(null);
  const [authErr, setAuthErr] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [savedSearchId, setSavedSearchId] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [cepik, setCepik] = useState(null);
  const [cepikLoading, setCepikLoading] = useState(false);
  const [cepikErr, setCepikErr] = useState(null);
  const [editMode, setEditMode] = useState({ licensePlate: false, firstRegistration: false, vin: false });
  const [editDraft, setEditDraft] = useState({ licensePlate: "", firstRegistration: "", vin: "" });
  const [editErr, setEditErr] = useState({ licensePlate: null, firstRegistration: null, vin: null });
  const [histEditMode, setHistEditMode] = useState({});
  const [histEditDraft, setHistEditDraft] = useState({});
  const [histEditErr, setHistEditErr] = useState({});
  const [histVerifyBusy, setHistVerifyBusy] = useState({});

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getTokens().access) {
      setMe(null);
      return;
    }
    const res = await apiFetch("/auth/me");
    if (res.ok) setMe(await res.json());
    else setMe(null);
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await apiFetch("/searches");
      if (res.ok) setHistory(await res.json());
      else setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "history" && me) loadHistory();
  }, [tab, me, loadHistory]);

  const portal = detectPortal(url);

  const run = useCallback(async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    setData(null);
    setShowDebug(false);
    setSavedSearchId(null);
    setCepik(null);
    setCepikErr(null);
    setSaveMsg(null);
    try {
      const normU = normListingUrl(u);
      if (me) {
        const existingRes = await apiFetch(`/searches/lookup/by-url?listing_url=${encodeURIComponent(normU)}`);
        if (existingRes.ok) {
          const existing = await existingRes.json();
          if (existing) {
            setData(mergeSearchRecord(existing));
            setSavedSearchId(existing.id);
            if (existing.latest_verification?.normalized) {
              setCepik({
                technicalData: existing.latest_verification.normalized.technicalData || {},
                odometerReadings: existing.latest_verification.normalized.odometerReadings || [],
                events: existing.latest_verification.normalized.events || [],
                meta: { fromHistory: true, cacheHit: existing.latest_verification.cache_hit },
                comparison: existing.latest_verification.comparison || null,
              });
            }
            setSaveMsg("Wczytano z historii (bez ponownego fetch).");
            return;
          }
        }
      }
      const md = await fetchPage(u);
      const car = parseMd(md, u);
      car.listingUrl = normU;
      setData(car);
    } catch (e) {
      setError(e.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const login = async () => {
    setAuthErr(null);
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: authEmail, password: authPass },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAuthErr(formatFastApiDetail(j.detail) || "Błąd logowania");
      return;
    }
    setTokens(j.access_token, j.refresh_token);
    setAuthPass("");
    refreshMe();
  };

  const register = async () => {
    setAuthErr(null);
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: { email: authEmail, password: authPass },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAuthErr(formatFastApiDetail(j.detail) || "Błąd rejestracji");
      return;
    }
    setTokens(j.access_token, j.refresh_token);
    setAuthPass("");
    refreshMe();
  };

  const logout = () => {
    clearTokens();
    setMe(null);
    setHistory([]);
    setSavedSearchId(null);
  };

  const openHistoryItem = async id => {
    const res = await apiFetch(`/searches/${id}`);
    if (!res.ok) return;
    const row = await res.json();
    setData(mergeSearchRecord(row));
    setSavedSearchId(row.id);
    setCepik(null);
    setCepikErr(null);
    if (row.latest_verification?.normalized) {
      setCepik({
        technicalData: row.latest_verification.normalized.technicalData || {},
        odometerReadings: row.latest_verification.normalized.odometerReadings || [],
        events: row.latest_verification.normalized.events || [],
        meta: { fromHistory: true, cacheHit: row.latest_verification.cache_hit },
        comparison: row.latest_verification.comparison || null,
      });
    }
    setTab("analyze");
  };

  const startEdit = key => {
    if (!data) return;
    let seed = String(data[key] ?? "");
    if (key === "licensePlate") seed = normalizeLicensePlate(seed);
    if (key === "vin") seed = normalizeVin(seed);
    if (key === "firstRegistration") seed = normalizeDateForCepik(seed);
    setEditDraft(d => ({ ...d, [key]: seed }));
    setEditErr(e => ({ ...e, [key]: null }));
    setEditMode(m => ({ ...m, [key]: true }));
  };

  const cancelEdit = key => {
    setEditErr(e => ({ ...e, [key]: null }));
    setEditMode(m => ({ ...m, [key]: false }));
  };

  const confirmEdit = key => {
    const raw = String(editDraft[key] ?? "").trim();
    let val = raw || null;
    if (key === "vin") val = normalizeVin(raw) || null;
    if (key === "licensePlate") val = normalizeLicensePlate(raw) || null;
    if (key === "firstRegistration") val = normalizeDateForCepik(raw) || null;

    if (key === "vin" && val && !isValidVin(val)) {
      setEditErr(e => ({ ...e, vin: "Niepoprawny VIN (wymagane 17 znaków, bez I/O/Q)." }));
      return;
    }
    if (key === "licensePlate" && val && !isValidLicensePlate(val)) {
      setEditErr(e => ({ ...e, licensePlate: "Niepoprawny numer rejestracyjny (oczekiwane 5–8 znaków A-Z/0-9)." }));
      return;
    }
    if (key === "firstRegistration" && val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setEditErr(e => ({ ...e, firstRegistration: "Niepoprawny format daty. Użyj kalendarza lub YYYY-MM-DD." }));
      return;
    }

    setData(p => ({ ...p, [key]: val }));
    setEditMode(m => ({ ...m, [key]: false }));
    setEditErr(e => ({ ...e, [key]: null }));
  };

  const deleteHistoryItem = async id => {
    const ok = window.confirm("Usunąć to ogłoszenie z historii?");
    if (!ok) return;
    const res = await apiFetch(`/searches/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setHistory(prev => prev.filter(h => h.id !== id));
    if (savedSearchId === id) {
      setSavedSearchId(null);
      setData(null);
      setCepik(null);
      setCepikErr(null);
    }
  };

  const histStartEdit = (id, key, currentValue) => {
    setHistEditDraft(d => {
      const row = d[id] || {};
      let seed = String(currentValue ?? "");
      if (key === "manual_license_plate") seed = normalizeLicensePlate(seed);
      if (key === "manual_vin") seed = normalizeVin(seed);
      if (key === "manual_first_registration") seed = normalizeDateForCepik(seed);
      return { ...d, [id]: { ...row, [key]: seed } };
    });
    setHistEditErr(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: null } }));
    setHistEditMode(m => ({ ...m, [id]: { ...(m[id] || {}), [key]: true } }));
  };

  const histCancelEdit = (id, key) => {
    setHistEditErr(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: null } }));
    setHistEditMode(m => ({ ...m, [id]: { ...(m[id] || {}), [key]: false } }));
  };

  const histConfirmEdit = async (id, key) => {
    const draft = histEditDraft[id] || {};
    const raw = String(draft[key] ?? "").trim();
    let val = raw || null;
    if (key === "manual_vin") val = normalizeVin(raw) || null;
    if (key === "manual_license_plate") val = normalizeLicensePlate(raw) || null;
    if (key === "manual_first_registration") val = normalizeDateForCepik(raw) || null;

    if (key === "manual_vin" && val && !isValidVin(val)) {
      setHistEditErr(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: "Niepoprawny VIN (17 znaków, bez I/O/Q)." } }));
      return;
    }
    if (key === "manual_license_plate" && val && !isValidLicensePlate(val)) {
      setHistEditErr(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: "Niepoprawny numer rejestracyjny (5–8 znaków A-Z/0-9)." } }));
      return;
    }
    if (key === "manual_first_registration" && val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setHistEditErr(e => ({ ...e, [id]: { ...(e[id] || {}), [key]: "Niepoprawny format daty. Użyj kalendarza." } }));
      return;
    }

    const res = await apiFetch(`/searches/${id}`, {
      method: "PATCH",
      body: { [key]: val },
    });
    if (!res.ok) return;
    await loadHistory();
    setHistEditMode(m => ({ ...m, [id]: { ...(m[id] || {}), [key]: false } }));
  };

  const verifyHistoryItem = async (row) => {
    if (!me) return;
    const snap = row.snapshot_json || {};
    const reg = (row.manual_license_plate ?? snap.licensePlate ?? "").toString().trim();
    const vin = (row.manual_vin ?? snap.vin ?? "").toString().trim();
    const fr = normalizeDateForCepik(row.manual_first_registration ?? snap.firstRegistration ?? "");
    if (!reg || !vin || !fr) return;

    setHistVerifyBusy(b => ({ ...b, [row.id]: true }));
    try {
      const res = await apiFetch("/cepik/verify", {
        method: "POST",
        body: {
          search_id: row.id,
          registration_number: normalizeLicensePlate(reg),
          vin_number: normalizeVin(vin),
          first_registration_date: fr,
          listing_snapshot: stripDebug(mergeSearchRecord(row)),
          force_refresh: false,
        },
      });
      if (!res.ok) return;
      await loadHistory();
    } finally {
      setHistVerifyBusy(b => ({ ...b, [row.id]: false }));
    }
  };

  const persistManualToServer = async id => {
    if (!id || !me) return;
    await apiFetch(`/searches/${id}`, {
      method: "PATCH",
      body: {
        manual_vin: data.vin || null,
        manual_first_registration: data.firstRegistration || null,
        manual_license_plate: data.licensePlate || null,
      },
    });
  };

  const saveSearch = async () => {
    if (!data || !me) return;
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      const res = await apiFetch("/searches", {
        method: "POST",
        body: {
          listing_url: normListingUrl(data.listingUrl),
          snapshot_json: stripDebug(data),
          manual_vin: data.vin || null,
          manual_first_registration: data.firstRegistration || null,
          manual_license_plate: data.licensePlate || null,
          latest_verification: cepik
            ? {
                technicalData: cepik.technicalData || {},
                odometerReadings: cepik.odometerReadings || [],
                events: cepik.events || [],
                comparison: cepik.comparison || null,
                meta: cepik.meta || {},
              }
            : null,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg(formatFastApiDetail(j.detail) || "Nie zapisano");
        return;
      }
      setSavedSearchId(j.id);
      setSaveMsg("Zapisano/zaaktualizowano w historii.");
      loadHistory();
    } finally {
      setSaveBusy(false);
    }
  };

  const verifyGov = async () => {
    if (!data) return;
    const reg = (data.licensePlate || "").trim();
    const vin = (data.vin || "").trim();
    const fr = normalizeDateForCepik(data.firstRegistration || "");
    if (!reg || !vin || !fr) {
      setCepikErr("Uzupełnij VIN, numer rejestracyjny i datę pierwszej rejestracji (YYYY-MM-DD).");
      return;
    }
    if (!me) {
      setCepikErr("Zaloguj się, aby weryfikować przez API.");
      return;
    }
    setCepikLoading(true);
    setCepikErr(null);
    try {
      if (savedSearchId) await persistManualToServer(savedSearchId);
      const res = await apiFetch("/cepik/verify", {
        method: "POST",
        body: {
          search_id: savedSearchId,
          registration_number: reg,
          vin_number: vin,
          first_registration_date: fr,
          listing_snapshot: stripDebug(data),
          force_refresh: false,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCepikErr(typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail || j));
        setCepik(null);
        return;
      }
      setCepik(j);
    } catch (e) {
      throw e;
    } finally {
      setCepikLoading(false);
    }
  };

  const canVerify =
    me &&
    data &&
    (data.licensePlate || "").trim() &&
    (data.vin || "").trim() &&
    normalizeDateForCepik(data.firstRegistration || "");
  const comparisonLookup = buildComparisonLookup(cepik);

  const dlJSON = () => {
    if (!data) return;
    const name = [data.brand, data.model, data.year].filter(Boolean).join("-");
    const payload = buildExportPayload(data, cepik);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    a.download = `raport-${name || "pojazd"}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-hex">VX</div>
        <div>
          <div className="hdr-title">VEHICLE EXTRACTOR</div>
          <div className="hdr-sub">OTOMOTO · OLX · via Jina AI Reader</div>
        </div>
        <div className="hdr-pill">
          {me ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Zalogowano jako <strong style={{ color: 'var(--text)' }}>{me.email}</strong></span>
              <button type="button" style={{ fontSize: '8px', padding: '2px 6px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={logout}>Wyloguj</button>
            </div>
          ) : (
            "API: " + API_BASE.replace(/^https?:\/\//, "")
          )}
        </div>
      </header>

      <div className="main">
        <div className="tabs">
          <button type="button" className={`tab${tab === "analyze" ? " on" : ""}`} onClick={() => setTab("analyze")}>
            Analiza
          </button>
          <button type="button" className={`tab${tab === "history" ? " on" : ""}`} onClick={() => setTab("history")}>
            Historia
          </button>
        </div>

        {!me && (
          <div className="auth-row">
            <input placeholder="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} autoComplete="username" />
            <input type="password" placeholder="hasło" value={authPass} onChange={e => setAuthPass(e.target.value)} autoComplete="current-password" />
            <button type="button" className="act-btn primary" onClick={login}>Loguj</button>
            <button type="button" className="act-btn" onClick={register}>Rejestracja</button>
            <span className="mini">Konto wymagane do historii i CEPiK</span>
            {authErr && <span className="mini" style={{ color: "var(--red)", width: "100%" }}>{authErr}</span>}
          </div>
        )}

        {tab === "history" && (
          <div style={{ marginBottom: 24 }}>
            <div className="section-label">Zapisane wyszukiwania</div>
            {histLoading && <div className="load-msg">Ładowanie…</div>}
            {!me && <div className="note">Zaloguj się, aby zobaczyć historię.</div>}
            {me && !histLoading && history.length === 0 && <div className="note">Brak zapisanych wyszukiwań.</div>}
            {me && (
              <div className="history-list">
                {history.map(h => {
                  const snap = h.snapshot_json || {};
                  const img = snap.images?.[0];
                  const title = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";
                  const ver = h.verification;
                  const subtitleParts = [];
                  if (snap.engineDisplacement) subtitleParts.push(`${Number(snap.engineDisplacement).toLocaleString("pl-PL")} cm³`);
                  if (snap.enginePower) subtitleParts.push(`${Number(snap.enginePower).toLocaleString("pl-PL")} KM`);
                  if (snap.mileage) subtitleParts.push(`${Number(snap.mileage).toLocaleString("pl-PL")} km`);
                  const subtitle = subtitleParts.join(" · ");
                  const effPlate = h.manual_license_plate ?? snap.licensePlate ?? null;
                  const effVin = h.manual_vin ?? snap.vin ?? null;
                  const effFirstReg = h.manual_first_registration ?? snap.firstRegistration ?? null;
                  const canRowVerify = Boolean(me && effPlate && effVin && normalizeDateForCepik(effFirstReg || ""));
                  const rowMode = histEditMode[h.id] || {};
                  const rowDraft = histEditDraft[h.id] || {};
                  const rowErr = histEditErr[h.id] || {};
                  return (
                    <div key={h.id} className="hist-row" onClick={() => openHistoryItem(h.id)}>
                      {img ? <img className="hist-thumb" src={img} alt="" /> : <div className="hist-thumb" />}
                      <div className="hist-main">
                        <div className="hist-title">{title}</div>
                        {subtitle && <div className="hist-sub">{subtitle}</div>}
                        <div className="hist-meta">{new Date(h.created_at).toLocaleString("pl-PL")} · {snap.portal || "źródło"}</div>
                        <div className="hist-badges">
                          {ver?.status === "ok" && <div className="hist-badge ok">✓ Zweryfikowane</div>}
                          {ver?.status === "warning" && <div className="hist-badge warn">! Weryfikacja: uwagi</div>}
                          {ver?.status === "check" && <div className="hist-badge check">○ Weryfikacja: częściowa</div>}
                        </div>

                        <div className="hist-fields" onClick={e => e.stopPropagation()}>
                          <div className="hist-field">
                            <div className="k">Tablice</div>
                            {rowMode.manual_license_plate ? (
                              <>
                                <input
                                  className="id-input"
                                  value={rowDraft.manual_license_plate ?? ""}
                                  placeholder="np. WX12345"
                                  onChange={e => setHistEditDraft(d => ({ ...d, [h.id]: { ...(d[h.id] || {}), manual_license_plate: e.target.value } }))}
                                  onPaste={e => {
                                    const pasted = e.clipboardData?.getData("text") ?? "";
                                    if (pasted) {
                                      e.preventDefault();
                                      setHistEditDraft(d => ({ ...d, [h.id]: { ...(d[h.id] || {}), manual_license_plate: normalizeLicensePlate(pasted) } }));
                                    }
                                  }}
                                />
                                <div className="edit-actions">
                                  <button type="button" className="edit-btn" onClick={() => histConfirmEdit(h.id, "manual_license_plate")}>Zapisz</button>
                                  <button type="button" className="edit-btn" onClick={() => histCancelEdit(h.id, "manual_license_plate")}>Anuluj</button>
                                </div>
                                {rowErr.manual_license_plate && <div className="edit-err">{rowErr.manual_license_plate}</div>}
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`hist-tap v${!effPlate ? " nil" : ""}`}
                                onClick={() => histStartEdit(h.id, "manual_license_plate", effPlate)}
                                title="Kliknij aby edytować"
                              >
                                {effPlate ? normalizeLicensePlate(effPlate) : "brak"}
                              </button>
                            )}
                          </div>

                          <div className="hist-field">
                            <div className="k">VIN</div>
                            {rowMode.manual_vin ? (
                              <>
                                <input className="id-input" value={rowDraft.manual_vin ?? ""} placeholder="17 znaków" onChange={e => setHistEditDraft(d => ({ ...d, [h.id]: { ...(d[h.id] || {}), manual_vin: e.target.value } }))} maxLength={17} />
                                <div className="edit-actions">
                                  <button type="button" className="edit-btn" onClick={() => histConfirmEdit(h.id, "manual_vin")}>Zapisz</button>
                                  <button type="button" className="edit-btn" onClick={() => histCancelEdit(h.id, "manual_vin")}>Anuluj</button>
                                </div>
                                {rowErr.manual_vin && <div className="edit-err">{rowErr.manual_vin}</div>}
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`hist-tap v${!effVin ? " nil" : ""}`}
                                onClick={() => histStartEdit(h.id, "manual_vin", effVin)}
                                title="Kliknij aby edytować"
                              >
                                {effVin ? normalizeVin(effVin) : "brak"}
                              </button>
                            )}
                          </div>

                          <div className="hist-field">
                            <div className="k">1. rej.</div>
                            {rowMode.manual_first_registration ? (
                              <>
                                <input
                                  type="date"
                                  lang="pl-PL"
                                  className="id-input"
                                  value={rowDraft.manual_first_registration ?? ""}
                                  onChange={e => setHistEditDraft(d => ({ ...d, [h.id]: { ...(d[h.id] || {}), manual_first_registration: e.target.value } }))}
                                />
                                <div className="edit-actions">
                                  <button type="button" className="edit-btn" onClick={() => histConfirmEdit(h.id, "manual_first_registration")}>Zapisz</button>
                                  <button type="button" className="edit-btn" onClick={() => histCancelEdit(h.id, "manual_first_registration")}>Anuluj</button>
                                </div>
                                {rowErr.manual_first_registration && <div className="edit-err">{rowErr.manual_first_registration}</div>}
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`hist-tap v${!effFirstReg ? " nil" : ""}`}
                                onClick={() => histStartEdit(h.id, "manual_first_registration", effFirstReg)}
                                title="Kliknij aby edytować"
                              >
                                {effFirstReg ? normalizeDateForCepik(effFirstReg) : "brak"}
                              </button>
                            )}
                          </div>
                        </div>

                        {!canRowVerify && (
                          <div className="hist-row-note">Uzupełnij VIN/tablice/datę, aby weryfikować z gov.</div>
                        )}
                      </div>

                      <div className="hist-actions" onClick={e => e.stopPropagation()}>
                        <button type="button" className="act-mini primary" disabled={!canRowVerify || histVerifyBusy[h.id]} onClick={() => verifyHistoryItem(h)}>
                          {histVerifyBusy[h.id] ? "…" : "Zweryfikuj"}
                        </button>
                        <button type="button" className="act-mini" onClick={() => openHistoryItem(h.id)}>Otwórz</button>
                        <button type="button" className="act-mini danger" onClick={() => deleteHistoryItem(h.id)}>Usuń</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "analyze" && (
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
            <span className="hint-dot">·</span> Działa przez r.jina.ai — bez klucza API
          </div>
        </div>
        )}

        {tab === "analyze" && loading && (
          <div className="loader">
            <div className="spin" />
            <div className="load-msg">▶ Pobieranie przez Jina AI…</div>
          </div>
        )}

        {tab === "analyze" && error && (
          <div className="err">
            <span className="err-ico">⚠</span>
            <div><strong>Błąd</strong> — {error}</div>
          </div>
        )}

        {tab === "analyze" && data && (
          <div className="result">
            <div className="car-hero">
              <div>
                {data.portal && <div className="ch-src">ŹRÓDŁO: {data.portal}</div>}
                <div className="hero-line">
                  <div className="ch-brand">{data.brand ?? "NIEZNANA MARKA"}</div>
                  {comparisonLookup.brand && (
                    <span
                      className={`cmp-badge ${comparisonLookup.brand.status}`}
                      title={checkTooltip(comparisonLookup.brand)}
                    >
                      {checkIcon(comparisonLookup.brand.status)}
                    </span>
                  )}
                </div>
                <div className="hero-line">
                  <div className="ch-model">{data.model ?? "NIEZNANY MODEL"}</div>
                  {comparisonLookup.model && (
                    <span
                      className={`cmp-badge ${comparisonLookup.model.status}`}
                      title={checkTooltip(comparisonLookup.model)}
                    >
                      {checkIcon(comparisonLookup.model.status)}
                    </span>
                  )}
                </div>
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
                const check = comparisonLookup[f.key];
                const isEditableFirstReg = f.key === "firstRegistration";
                return (
                  <div className="spec" key={f.key} title={checkTooltip(check)}>
                    <div className="spec-lbl-row">
                      <div className="spec-lbl">{f.lbl}</div>
                      {isEditableFirstReg && !editMode.firstRegistration && (
                        <button
                          type="button"
                          className="edit-btn"
                          title="Edytuj datę"
                          onClick={() => startEdit("firstRegistration")}
                        >
                          ✎
                        </button>
                      )}
                      {check && (
                        <span className={`cmp-badge ${check.status}`}>
                          {checkIcon(check.status)}
                        </span>
                      )}
                    </div>
                    {isEditableFirstReg && editMode.firstRegistration ? (
                      <>
                        <input
                          type="date"
                          className="id-input"
                          lang="pl-PL"
                          value={editDraft.firstRegistration}
                          onChange={e => setEditDraft(d => ({ ...d, firstRegistration: e.target.value }))}
                        />
                        <div className="edit-actions" style={{ marginTop: 8 }}>
                          <button type="button" className="edit-btn" onClick={() => confirmEdit("firstRegistration")}>Zapisz</button>
                          <button type="button" className="edit-btn" onClick={() => cancelEdit("firstRegistration")}>Anuluj</button>
                        </div>
                        {editErr.firstRegistration && <div className="edit-err">{editErr.firstRegistration}</div>}
                      </>
                    ) : (
                      <div className={`spec-val${nil ? " nil" : ""}`}>
                        {nil ? "—" : <>{val}{unit && <span className="u">{unit}</span>}</>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="identity">
              <div className="id-card">
                <div className="id-ico">🪪</div>
                <div style={{ width: "100%" }}>
                  <div className="edit-row">
                    <div className="id-lbl">Numer rejestracyjny (ręcznie / z ogłoszenia)</div>
                    {!editMode.licensePlate && <button type="button" className="edit-btn" onClick={() => startEdit("licensePlate")}>✎</button>}
                  </div>
                  {editMode.licensePlate ? (
                    <>
                      <input
                        className="id-input"
                        placeholder="np. WX 12345"
                        value={editDraft.licensePlate}
                        onChange={e => setEditDraft(d => ({ ...d, licensePlate: e.target.value }))}
                        onPaste={e => {
                          const pasted = e.clipboardData?.getData("text") ?? "";
                          if (pasted) {
                            e.preventDefault();
                            setEditDraft(d => ({ ...d, licensePlate: normalizeLicensePlate(pasted) }));
                          }
                        }}
                        maxLength={20}
                      />
                      <div className="edit-actions" style={{ marginTop: 8 }}>
                        <button type="button" className="edit-btn" onClick={() => confirmEdit("licensePlate")}>Zapisz</button>
                        <button type="button" className="edit-btn" onClick={() => cancelEdit("licensePlate")}>Anuluj</button>
                      </div>
                      {editErr.licensePlate && <div className="edit-err">{editErr.licensePlate}</div>}
                    </>
                  ) : (
                    <div className={`id-val${!data.licensePlate ? " nil" : ""}`}>{data.licensePlate ?? "Niedostępne"}</div>
                  )}
                </div>
              </div>
              {[
                { ico: "👤", lbl: "Sprzedający", val: data.seller },
                { ico: "📍", lbl: "Lokalizacja", val: data.location },
              ].map(({ ico, lbl, val }) => (
                <div className="id-card" key={lbl}>
                  <div className="id-ico">{ico}</div>
                  <div>
                    <div className="id-lbl">{lbl}</div>
                    <div className={`id-val${!val ? " nil" : ""}`}>{val ?? "Niedostępne"}</div>
                  </div>
                </div>
              ))}
              <div className="id-card">
                <div className="id-ico">🔑</div>
                <div style={{ width: "100%" }}>
                  <div className="edit-row">
                    <div className="id-lbl">Numer VIN (ręcznie)</div>
                    {!editMode.vin && <button type="button" className="edit-btn" onClick={() => startEdit("vin")}>✎</button>}
                  </div>
                  {editMode.vin ? (
                    <>
                      <input
                        className="id-input"
                        placeholder="Wpisz VIN ręcznie"
                        value={editDraft.vin}
                        onChange={e => setEditDraft(d => ({ ...d, vin: e.target.value }))}
                        maxLength={17}
                      />
                      <div className="edit-actions" style={{ marginTop: 8 }}>
                        <button type="button" className="edit-btn" onClick={() => confirmEdit("vin")}>Zapisz</button>
                        <button type="button" className="edit-btn" onClick={() => cancelEdit("vin")}>Anuluj</button>
                      </div>
                      {editErr.vin && <div className="edit-err">{editErr.vin}</div>}
                    </>
                  ) : (
                    <div className={`id-val${!data.vin ? " nil" : ""}`}>{data.vin ?? "Niedostępne"}</div>
                  )}
                </div>
              </div>
            </div>

            {data.description && (
              <div className="desc-box">
                <div className="desc-lbl">Opis ogłoszenia</div>
                <div className="desc-txt">{data.description}</div>
              </div>
            )}

            {data.images?.length > 0 && (
              <div className="gallery">
                {data.images.map((img, i) => (
                  <a className="gallery-item" key={i} href={img} target="_blank" rel="noreferrer">
                    <img src={img} alt={`Zdjęcie ${i + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            )}

            <div className="actions">
              <button className="act-btn primary" onClick={() => window.print()}>🖨 DRUKUJ / PDF</button>
              <button className="act-btn" onClick={dlJSON}>⬇ EKSPORTUJ JSON</button>
              <button className="act-btn" onClick={() => window.open(data.listingUrl, "_blank")}>↗ OGŁOSZENIE</button>
              <button className="act-btn" disabled={!me || !data || saveBusy} onClick={saveSearch} title={!me ? "Wymagane logowanie" : ""}>
                {saveBusy ? "…" : "💾 Zapisz w historii"}
              </button>
              <button
                className="act-btn primary"
                disabled={!canVerify || cepikLoading}
                onClick={verifyGov}
                title={!me ? "Zaloguj się" : !canVerify ? "Uzupełnij VIN, nr rej. i datę" : "Historia pojazdu (gov.pl)"}
              >
                {cepikLoading ? "…" : "✓ Weryfikuj dane z gov"}
              </button>
            </div>
            {saveMsg && <div className="note" style={{ marginTop: 8 }}>{saveMsg}{savedSearchId && <span className="meta-pill">ID {savedSearchId}</span>}</div>}
            {cepikErr && (
              <div className="err" style={{ marginTop: 12 }}>
                <span className="err-ico">⚠</span>
                <div><strong>CEPiK</strong> — {cepikErr}</div>
              </div>
            )}
            {cepik && (
              <div className="cepik-panel">
                <div className="cepik-title">
                  Weryfikacja moj.gov.pl
                  {cepik.meta?.cacheHit != null && (
                    <span className="meta-pill">{cepik.meta.cacheHit ? "cache hit" : "świeże dane"}</span>
                  )}
                </div>
                {cepik.comparison?.checks?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {cepik.comparison.checks.map((c, i) => (
                      <div className="check-row" key={i} title={c.message || ""}>
                        <span className="check-ico">{c.status === "ok" ? "✓" : c.status === "warning" ? "!" : "○"}</span>
                        <span className="check-field">{c.field}</span>
                        <span className="check-msg">
                          {c.message || `${JSON.stringify(c.listing)} → ${JSON.stringify(c.cepi)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="desc-lbl" style={{ marginTop: 8 }}>Odczyty przebiegu (CEPiK)</div>
                <pre style={{ fontSize: 11, marginTop: 6, whiteSpace: "pre-wrap", color: "var(--sub)" }}>
                  {JSON.stringify(cepik.odometerReadings || [], null, 2)}
                </pre>
                <div className="desc-lbl" style={{ marginTop: 12 }}>Zdarzenia (timeline)</div>
                <pre style={{ fontSize: 11, marginTop: 6, whiteSpace: "pre-wrap", color: "var(--sub)" }}>
                  {JSON.stringify(cepik.events || [], null, 2)}
                </pre>
                <div className="desc-lbl" style={{ marginTop: 12 }}>Dane techniczne (znormalizowane)</div>
                <pre style={{ fontSize: 11, marginTop: 6, whiteSpace: "pre-wrap", color: "var(--sub)" }}>
                  {JSON.stringify(cepik.technicalData || {}, null, 2)}
                </pre>
              </div>
            )}

            <div className="src-bar">
              <span>Źródło</span>
              <a href={data.listingUrl} target="_blank" rel="noreferrer">{data.listingUrl}</a>
            </div>

            <div className="note">
              <strong>ℹ Jak działa</strong> — Ogłoszenie jest pobierane przez{" "}
              <a href="https://r.jina.ai" target="_blank" rel="noreferrer" style={{color:"var(--amber)"}}>r.jina.ai</a>{" "}
              (Markdown, bez CORS). Parser działa w przeglądarce.{" "}
              <strong>Weryfikacja gov</strong> idzie przez Twój backend FastAPI (konto + zapis historii), który odpytuje moj.gov.pl.
            </div>

            {data.__debug && (
              <div className="note">
                <strong>🛠 Debug parsera</strong>
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
