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
.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);margin-top:1px}
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
      // Read body ONCE as text, then optionally parse JSON
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
const toNum = v => { if (v == null) return null; const n = parseFloat(String(v).replace(/[^\d.]/g, "")); return isNaN(n) ? null : n; };
const clean = v => { if (!v) return null; const s = String(v).trim(); return s.length ? s : null; };
const cleanEnum = v => { if (!v) return null; return String(v).trim().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || null; };
const cleanDate = v => { if (!v) return null; const s = String(v).trim(); if (/^\d{4}$/.test(s)) return s; const m = s.match(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/); return m ? m[0] : s || null; };
const grabMeta = (doc, n) => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content ?? null;
const vinFromHtml = html => { const m = html.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g); return m?.find(v => !/GTM|UA-/.test(v)) ?? null; };

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

function parseOtomoto(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);

  // Try to find NextData JSON embedded in scripts
  let nd = null;
  for (const s of doc.querySelectorAll("script")) {
    const t = s.textContent;
    if (!t.includes("advert") && !t.includes("offers")) continue;
    try {
      const start = t.indexOf("{");
      if (start === -1) continue;
      nd = JSON.parse(t.slice(start));
      if (nd?.props || nd?.pageProps || nd?.advert) break;
      nd = null;
    } catch {}
  }

  // Dig into nested structures
  const findDeep = (obj, key, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 8) return undefined;
    if (key in obj) return obj[key];
    for (const v of Object.values(obj)) { const r = findDeep(v, key, depth + 1); if (r !== undefined) return r; }
    return undefined;
  };

  const advert = findDeep(nd, "advert") ?? findDeep(nd, "adData") ?? {};
  const params = {};
  const rawParams = advert?.params ?? findDeep(advert, "params") ?? [];
  if (Array.isArray(rawParams)) {
    rawParams.forEach(p => { if (p?.key) params[p.key] = p.value?.label ?? p.value?.key ?? p.normalizedValue ?? p.value; });
  } else if (typeof rawParams === "object") {
    Object.assign(params, rawParams);
  }

  const get = (...keys) => { for (const k of keys) { const v = params[k]; if (v != null) return Array.isArray(v) ? v[0] : v; } return null; };

  const price = toNum(advert?.price?.amount?.units ?? advert?.price?.value ?? ld?.offers?.price ?? grabMeta(doc, "price"));
  const currency = clean(advert?.price?.currency ?? ld?.offers?.priceCurrency) ?? "PLN";
  const brand = clean(advert?.make ?? ld?.brand?.name ?? get("make", "brand"));
  const model = clean(advert?.model ?? ld?.model ?? get("model"));
  const title = doc.querySelector("h1")?.textContent?.trim() ?? grabMeta(doc, "og:title");
  const variant = title && brand && model ? clean(title.replace(brand, "").replace(model, "").replace(/\s+/g, " ").trim()) : null;

  const idMatch = url.match(/ID(\w+)(?:\.html)?$/i);

  return {
    brand, model,
    variant: variant?.length > 2 && variant?.length < 100 ? variant : null,
    year: toNum(advert?.year ?? ld?.vehicleModelDate ?? get("year")),
    price, currency,
    mileage: toNum(advert?.mileage ?? get("mileage", "odometer", "mileage_from_odometer") ?? ld?.mileageFromOdometer?.value),
    engineDisplacement: toNum(get("engine_capacity", "engineDisplacement", "engine_cc") ?? ld?.engineDisplacement?.value),
    enginePower: toNum(get("engine_power", "power") ?? ld?.vehicleEngine?.enginePower?.value),
    enginePowerUnit: "KM",
    fuelType: cleanEnum(get("fuel_type", "fuelType") ?? ld?.fuelType),
    transmission: cleanEnum(get("gearbox", "transmission") ?? ld?.vehicleTransmission),
    drivetrain: cleanEnum(get("drive", "driveWheels")),
    bodyType: cleanEnum(get("body_type", "bodyStyle") ?? ld?.bodyType),
    color: cleanEnum(get("color", "colour") ?? ld?.color),
    doors: toNum(get("doors_count", "doors")),
    seats: toNum(get("seats")),
    vin: null,
    firstRegistration: cleanDate(advert?.firstRegistrationDate ?? get("first_registration", "registration_date")),
    licensePlate: null,
    condition: cleanEnum(get("state", "condition") ?? ld?.itemCondition),
    location: clean(advert?.location?.city?.name ?? advert?.location?.name),
    seller: clean(advert?.advertiser?.name ?? advert?.seller?.name),
    portal: "otomoto.pl",
    _adId: clean(idMatch?.[1] ?? advert?.id ?? advert?.uuid),
  };
}

function parseOlx(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const ld = parseLd(doc);

  // Try window.__PRERENDERED_STATE__
  let state = null;
  for (const s of doc.querySelectorAll("script")) {
    const t = s.textContent;
    if (!t.includes("__PRERENDERED_STATE__") && !t.includes("window.__") ) continue;
    const m = t.match(/window\.__PRERENDERED_STATE__\s*=\s*'([\s\S]+?)'\s*;/);
    if (m) { try { state = JSON.parse(m[1].replace(/\\'/g, "'")); break; } catch {} }
    const m2 = t.match(/\{[\s\S]{100,}\}/);
    if (m2) { try { const j = JSON.parse(m2[0]); if (j?.ad || j?.advert) { state = j; break; } } catch {} }
  }

  const ad = state?.ad?.ad ?? state?.ad ?? state?.advert ?? {};
  const params = {};
  (ad?.params ?? []).forEach(p => { if (p?.key) params[p.key] = p.value?.label ?? p.value?.key ?? p.normalizedValue ?? p.value; });

  const title = ad?.title ?? doc.querySelector("h1")?.textContent?.trim();
  const parts = (title ?? "").split(/\s+/);
  const brand = clean(params["car_brand"] ?? params["brand"] ?? parts[0]);
  const model = clean(params["car_model"] ?? params["model"] ?? parts[1]);

  return {
    brand, model,
    variant: null,
    year: toNum(params["year"] ?? params["model_year"]),
    price: toNum(ad?.price?.regularPrice?.value ?? ad?.price?.value ?? ld?.offers?.price),
    currency: clean(ad?.price?.regularPrice?.currency ?? ad?.price?.currency) ?? "PLN",
    mileage: toNum(params["mileage"] ?? params["kilometer_mileage"]),
    engineDisplacement: toNum(params["engine_capacity"]),
    enginePower: toNum(params["engine_power"]),
    enginePowerUnit: "KM",
    fuelType: cleanEnum(params["fuel_type"] ?? params["petrol"]),
    transmission: cleanEnum(params["gearbox"]),
    drivetrain: cleanEnum(params["drive"]),
    bodyType: cleanEnum(params["car_type"] ?? params["body_type"]),
    color: cleanEnum(params["color"]),
    doors: toNum(params["doors_count"]),
    seats: null,
    vin: clean(params["vin"] ?? ad?.vin),
    firstRegistration: cleanDate(params["first_registration_year"] ?? params["registration_date"]),
    licensePlate: clean(params["plate_number"]),
    condition: cleanEnum(params["state"]),
    location: clean(ad?.location?.cityName ?? ad?.location?.city),
    seller: clean(ad?.contact?.name ?? ad?.user?.name),
    portal: "olx.pl",
    _adId: null,
  };
}

/* ─── VIN from otomoto API ───────────────────────────────── */
async function fetchVin(adId, html) {
  // First try raw HTML grep
  const fromPage = vinFromHtml(html);
  if (fromPage) return fromPage;
  if (!adId) return null;

  const endpoints = [
    `https://www.otomoto.pl/api/open/adverts/${adId}/vin`,
    `https://www.otomoto.pl/ajax/vin/${adId}`,
  ];
  for (const ep of endpoints) {
    for (const mk of PROXIES) {
      try {
        const r = await fetch(mk(ep), { signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const j = await r.json().catch(() => null);
        const text = j?.contents ?? j?.vin ?? JSON.stringify(j);
        const m = String(text).match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
        if (m) return m[0];
      } catch {}
    }
  }
  return null;
}

/* ─── FIELDS CONFIG ──────────────────────────────────────── */
const FIELDS = [
  { key: "year", lbl: "Rok" },
  { key: "mileage", lbl: "Przebieg", u: "km", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "engineDisplacement", lbl: "Pojemność", u: "cm³", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "enginePower", lbl: "Moc", uFn: d => d.enginePowerUnit || "KM" },
  { key: "fuelType", lbl: "Paliwo" },
  { key: "transmission", lbl: "Skrzynia" },
  { key: "drivetrain", lbl: "Napęd" },
  { key: "bodyType", lbl: "Nadwozie" },
  { key: "color", lbl: "Kolor" },
  { key: "condition", lbl: "Stan" },
  { key: "firstRegistration", lbl: "Pierwsza rej." },
  { key: "seats", lbl: "Miejsca" },
];

const STEPS_OTOMOTO = ["Pobieranie przez CORS proxy", "Parsowanie HTML", "Szukanie VIN", "Gotowe"];
const STEPS_OLX     = ["Pobieranie przez CORS proxy", "Parsowanie HTML", "Gotowe"];

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
    const stepList = isOtomoto ? STEPS_OTOMOTO : STEPS_OLX;
    setSteps(stepList); setActive(0);

    try {
      setActive(0);
      const html = await fetchProxy(u);
      setActive(1);
      let car;
      if (isOtomoto) car = parseOtomoto(html, u);
      else if (isOlx) car = parseOlx(html);
      else throw new Error("Nieobsługiwany portal. Wspierane portale: otomoto.pl i olx.pl");

      if (isOtomoto) {
        setActive(2);
        car.vin = await fetchVin(car._adId, html);
      }
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
                { ico: "🔑", lbl: "Numer VIN", val: data.vin, hi: !!data.vin },
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
            </div>

            <div className="actions">
              <button className="act-btn primary" onClick={() => window.print()}>🖨 DRUKUJ / PDF</button>
              <button className="act-btn" onClick={dlJSON}>⬇ EKSPORTUJ JSON</button>
              <button className="act-btn" onClick={() => window.open(data.listingUrl, "_blank")}>↗ OGŁOSZENIE</button>
            </div>

            <div className="src-bar">
              <span>Źródło</span>
              <a href={data.listingUrl} target="_blank" rel="noreferrer">{data.listingUrl}</a>
            </div>

            {data.portal === "otomoto.pl" && !data.vin && (
              <div className="note">
                <strong>ℹ VIN niedostępny</strong> — Otomoto ładuje VIN dynamicznie przez JavaScript
                po kliknięciu "Wyświetl VIN". Parser HTML nie może wykonać tej akcji.
                Otwórz ogłoszenie bezpośrednio w przeglądarce.
              </div>
            )}

            <div className="info-note">
              <strong>ℹ Jak działa parser</strong> — Strona pobierana jest przez publiczne CORS proxy
              (allorigins.win → corsproxy.io → codetabs.com) i parsowana lokalnie. Żadne dane nie
              trafiają do zewnętrznych serwerów. Działa bez AI i bez klucza API.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
