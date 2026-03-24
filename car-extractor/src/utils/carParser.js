/**
 * Car listing parser — fetches via Jina AI and extracts structured data
 * from markdown output.
 */

/* ─── FETCH ──────────────────────────────────────────────── */

export function detectPortal(url) {
  if (/otomoto\.pl/i.test(url)) return "otomoto";
  if (/olx\.pl/i.test(url)) return "olx";
  return "unknown";
}

export async function fetchPage(url) {
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
    { Accept: "text/plain", "x-respond-with": "markdown" },
    { Accept: "text/plain", "x-target-selector": "main,article,body", "x-respond-with": "markdown" },
    { Accept: "text/plain", "x-target-selector": "script#__NEXT_DATA__", "x-respond-with": "markdown" },
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

/* ─── PARSER HELPERS ─────────────────────────────────────── */

const toNum = v => {
  if (v == null) return null;
  const original = String(v).toLowerCase();
  let s = String(v)
    .replace(/\u00a0/g, " ")
    .replace(/[^\d,.\s]/g, "")
    .replace(/\s+/g, "");
  if (!s) return null;
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    s = s.replace(/[.,]/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(".") && !s.includes(",")) {
    s = /\.\d{1,2}$/.test(s) ? s : s.replace(/\./g, "");
  } else if (s.includes(".") && s.includes(",")) {
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
    const table = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
    if (table) add(table[1], table[2]);
    const inline = line.match(/^(?:\*{1,2})?([^:*|]{2,80}?)(?:\*{1,2})?\s*:\s*(.{1,120})$/);
    if (inline) add(inline[1], inline[2]);
    const lblOnly = line.match(/^(?:\*{1,2})?([^:*|]{2,80}?)(?:\*{1,2})?$/);
    if (lblOnly && lines[i + 1]) {
      const next = lines[i + 1].trim();
      if (next && !/^(#|\*|-|\|)/.test(next) && !/:$/.test(next) && next.length <= 120) {
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

function field(md, ...labels) {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`\\*{1,2}${esc}\\*{0,2}\\s*:?\\*{0,2}\\s+([^\\n*|]{1,80})`, "i"),
      new RegExp(`^${esc}\\s*:\\s*([^\\n|]{1,80})`, "im"),
      new RegExp(`^${esc}\\s*$\\n([^\\n#|*]{1,80})`, "im"),
      new RegExp(`\\|\\s*${esc}\\s*\\|\\s*([^|\\n]{1,80})\\s*\\|`, "i"),
    ];
    for (const re of patterns) {
      const val = clean(md.match(re)?.[1]);
      if (val && val.toLowerCase() !== label.toLowerCase()) return val;
    }
  }
  return null;
}

function fieldNum(md, ...labels) {
  const v = field(md, ...labels);
  if (v) {
    const n = toNum(v.replace(/\s*(km|cm3|cm³|KM|HP|kW)\b.*/i, ""));
    if (n != null) return n;
  }
  return null;
}

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
  const nearLabel = md.match(/Przebieg[\s:|\-*]*\n?\s*([0-9][\d\s.,\u00a0]*(?:\s*tys\.?)?)\s*km\b/i);
  if (nearLabel?.[1]) candidates.push(toNum(nearLabel[1]));
  candidates.push(findNumUnit(md, "km\\b"));
  const valid = candidates.filter(n => Number.isFinite(n));
  if (!valid.length) return null;
  return Math.max(...valid);
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
  let m = md.match(/(?:^|\n)#{1,3}\s*(?:Opis|Description)[^\n]*\n([\s\S]*?)(?=\n#{1,3}|\n(?:Opis ogłoszenia|Opis|Description)|$)/i);
  if (m) {
    const desc = normalize(m[1]);
    if (desc) return desc;
  }
  m = md.match(/(?:^|\n)(?:Opis ogłoszenia|Opis|Description)\s*[:]?\s*\n([\s\S]*?)(?=\n#{1,3}|\n(?:Opis ogłoszenia|Opis|Description)|$)/i);
  if (m) {
    const desc = normalize(m[1]);
    if (desc) return desc;
  }
  for (const block of md.split(/\n{2,}/)) {
    const t = block.trim();
    if (t.length > 60 && !/^[*#|]/.test(t) && !/^\*\*(Marka|Model|Rok|Przebieg|Moc|Paliwo|Cena)/i.test(t)) {
      const fallback = normalize(t);
      if (fallback) return fallback;
    }
  }
  return null;
}

function extractLocationFromMarkdown(md) {
  const text = String(md ?? "");
  const patterns = [
    /\[([A-ZŁŚŻŹĆÓ][^\]\n]{2,60},\s*[A-ZŁŚŻŹĆÓ][^\]\n]{2,60})\]\((?:https?:\/\/)?(?:www\.)?otomoto\.pl\/[^\)]*\)/i,
    /Znajd[źz]\s+na\s+mapie[\s\S]{0,220}\[([A-ZŁŚŻŹĆÓ][^\]\n]{2,60},\s*[A-ZŁŚŻŹĆÓ][^\]\n]{2,60})\]\(/i,
    /\b([A-ZŁŚŻŹĆÓ][a-ząćęłńóśźż]+,\s*[A-ZŁŚŻŹĆÓ][A-Za-ząćęłńóśźż \-]{2,60})\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const v = clean(m?.[1]);
    if (v) return v;
  }
  return null;
}

/* ─── MAIN PARSER ────────────────────────────────────────── */

export function parseMd(md, url) {
  const kv = buildKvMap(md);
  const title = extractTitle(md);
  const titleTokens = (title ?? "")
    .split(/\s+/)
    .filter(t => !/^[12]\d{3}$/.test(t) && t.length > 1);
  const tBrand = clean(titleTokens[0]);
  const tModel = clean(titleTokens[1]);

  const brand = clean(fromKv(kv, "Marka pojazdu", "Marka", "Make") ?? field(md, "Marka pojazdu", "Marka", "Make") ?? tBrand);
  const model = clean(fromKv(kv, "Model pojazdu", "Model") ?? field(md, "Model pojazdu", "Model") ?? tModel);

  let variant = null;
  if (title && brand && model) {
    const v = title
      .replace(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(/\|.*$/, "").replace(/\s+/g, " ").trim();
    if (v.length > 1 && v.length < 60) variant = v;
  }

  const priceRaw = field(md, "Cena", "Price");
  const price = priceRaw
    ? toNum(priceRaw.replace(/\s*(PLN|zł|EUR|USD).*/i, ""))
    : findNumUnit(md, "(?:PLN|zł)");
  const currency = /\bEUR\b/.test(md.slice(0, 3000)) ? "EUR" : "PLN";
  const year =
    fieldNum(md, "Rok produkcji", "Rok", "Year") ??
    (() => { const m = md.match(/Rok\s+produkcji[^0-9]{0,20}([12]\d{3})/i); return m ? +m[1] : null; })();

  const drivetrainKv = fromKv(kv, "Napęd", "Rodzaj napędu", "Drive");
  const drivetrainField = field(md, "Napęd", "Rodzaj napędu", "Drive");
  const licensePlateKv = fromKv(kv, "Numer rejestracyjny pojazdu", "Numer rejestracyjny", "License plate");
  const licensePlateField = field(md, "Numer rejestracyjny pojazdu", "Numer rejestracyjny", "License plate");
  const locationKv = fromKv(kv, "Lokalizacja", "Miasto", "Location", "City");
  const locationField = field(md, "Lokalizacja", "Miasto", "Location", "City");
  const locationMap = extractLocationFromMarkdown(md);
  const sellerKv = fromKv(kv, "Sprzedający", "Informacje o sprzedającym", "Seller");
  const sellerField = field(md, "Sprzedający", "Informacje o sprzedającym", "Seller");
  const sellerSection = (() => {
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
    fuelType:     fromKv(kv, "Rodzaj paliwa", "Paliwo", "Fuel type") ?? field(md, "Rodzaj paliwa", "Paliwo", "Fuel type"),
    transmission: fromKv(kv, "Skrzynia biegów", "Skrzynia", "Transmission", "Gearbox") ?? field(md, "Skrzynia biegów", "Skrzynia", "Transmission", "Gearbox"),
    drivetrain:   drivetrainKv ?? drivetrainField,
    bodyType:     fromKv(kv, "Typ nadwozia", "Nadwozie", "Body type") ?? field(md, "Typ nadwozia", "Nadwozie", "Body type"),
    color:        fromKv(kv, "Kolor", "Kolor nadwozia", "Color") ?? field(md, "Kolor", "Kolor nadwozia", "Color"),
    doors:        fieldNum(fromKv(kv, "Liczba drzwi", "Drzwi", "Doors")) ?? fieldNum(md, "Liczba drzwi", "Drzwi", "Doors"),
    seats:        fieldNum(fromKv(kv, "Liczba miejsc", "Miejsca", "Seats")) ?? fieldNum(md, "Liczba miejsc", "Miejsca", "Seats"),
    firstRegistration: cleanDate(firstRegistrationKv ?? firstRegistrationField),
    licensePlate: licensePlateKv ?? licensePlateField,
    vin: null,
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
      kvKeysSample: Object.keys(kv).slice(0, 80),
    },
  };
}
