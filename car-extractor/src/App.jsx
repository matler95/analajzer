import { useState, useEffect, useCallback } from "react";

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
.spec-val{font-family:var(--ff-m);font-size:14px;font-weight:600;color:var(--text)}
.spec-val .u{font-size:10px;color:var(--sub);font-weight:400;margin-left:3px}
.spec-val.nil{color:var(--muted);font-weight:400;font-size:12px}
.identity{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);margin-top:1px}
.id-card{background:var(--card);padding:18px 22px;display:flex;align-items:center;gap:16px}
.id-ico{font-size:22px;opacity:.45;flex-shrink:0}
.id-lbl{font-family:var(--ff-m);font-size:9px;color:var(--sub);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.id-val{font-family:var(--ff-m);font-size:13px;font-weight:600;letter-spacing:1px}
.id-val.nil{color:var(--muted);font-weight:400;font-size:12px;letter-spacing:.5px}
.id-input{width:100%;background:transparent;border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:var(--ff-m);font-size:14px;letter-spacing:1px;padding:8px 10px;outline:none}
.id-input:focus{border-color:var(--amber);box-shadow:0 0 0 2px var(--amber-glow)}
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
@media print{
  .hdr,.input-area,.actions,.note{display:none!important}
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
  const n = parseFloat(
    String(v).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "")
  );
  return isNaN(n) ? null : n;
};

const clean = v =>
  v ? String(v).trim().replace(/\*+/g, "").replace(/\s+/g, " ").trim() || null : null;

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
  return [...imgs].slice(0, 12);
}

function extractDescription(md) {
  // Szuka bloku po nagłówku "Opis"
  const m = md.match(
    /(?:^|\n)#{1,3}\s*(?:Opis|Description)[^\n]*\n([\s\S]{20,1500}?)(?=\n#{1,3}|\n\*\*[A-ZŁŚŻŹĆÓ]|$)/i
  );
  if (m) return clean(m[1].replace(/\n{3,}/g, "\n\n"));
  // Fallback: pierwszy długi blok tekstu który nie jest listą parametrów
  for (const block of md.split(/\n{2,}/)) {
    const t = block.trim();
    if (
      t.length > 120 &&
      !/^[*#|]/.test(t) &&
      !/^\*\*(Marka|Model|Rok|Przebieg|Moc|Paliwo|Cena)/i.test(t)
    ) return clean(t);
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
    mileage: fieldNum(fromKv(kv, "Przebieg", "Przebieg (km)", "Mileage")) ?? fieldNum(md, "Przebieg", "Przebieg (km)", "Mileage") ?? findNumUnit(md, "km\\b"),
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

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const portal = detectPortal(url);

  const run = useCallback(async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true); setError(null); setData(null); setShowDebug(false);
    try {
      const md = await fetchPage(u);
      const car = parseMd(md, u);
      car.listingUrl = u;
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
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
        <div className="hdr-pill">BEZ KLUCZA · BEZ CORS</div>
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
            <span className="hint-dot">·</span> Działa przez r.jina.ai — bez klucza API
          </div>
        </div>

        {loading && (
          <div className="loader">
            <div className="spin" />
            <div className="load-msg">▶ Pobieranie przez Jina AI…</div>
          </div>
        )}

        {error && (
          <div className="err">
            <span className="err-ico">⚠</span>
            <div><strong>Błąd</strong> — {error}</div>
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
                { ico: "👤", lbl: "Sprzedający",      val: data.seller },
                { ico: "📍", lbl: "Lokalizacja",      val: data.location },
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
                  <div className="id-lbl">Numer VIN (ręcznie)</div>
                  <input
                    className="id-input"
                    placeholder="Wpisz VIN ręcznie"
                    value={data.vin ?? ""}
                    onChange={e => setData(p => ({ ...p, vin: e.target.value.toUpperCase().trim() || null }))}
                    maxLength={17}
                  />
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
            </div>

            <div className="src-bar">
              <span>Źródło</span>
              <a href={data.listingUrl} target="_blank" rel="noreferrer">{data.listingUrl}</a>
            </div>

            <div className="note">
              <strong>ℹ Jak działa</strong> — Strona jest pobierana przez{" "}
              <a href="https://r.jina.ai" target="_blank" rel="noreferrer" style={{color:"var(--amber)"}}>r.jina.ai</a>,
              który konwertuje ją na Markdown omijając blokady CORS i anti-bot.
              Parser odczytuje dane lokalnie — żadne dane nie trafiają do zewnętrznych serwerów.
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
