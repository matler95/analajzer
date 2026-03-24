/**
 * Normalize and validate identifiers used for CEPiK lookups.
 */

export function normalizeDateForCepik(s) {
  if (!s) return "";
  const t = String(s).trim();
  const plMonthMap = {
    stycznia: "01", lutego: "02", marca: "03", kwietnia: "04",
    maja: "05", czerwca: "06", lipca: "07", sierpnia: "08",
    września: "09", wrzesnia: "09", października: "10", pazdziernika: "10",
    listopada: "11", grudnia: "12",
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

export function normalizeVin(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, "");
}

export function isValidVin(input) {
  const s = normalizeVin(input);
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(s);
}

export function normalizeLicensePlate(input) {
  const s = String(input || "")
    .toUpperCase()
    .replace(/\u00a0/g, " ")
    .trim();
  return s.replace(/[\s-]+/g, "");
}

export function isValidLicensePlate(input) {
  const s = normalizeLicensePlate(input);
  return /^[A-Z0-9]{5,8}$/.test(s);
}

export function normListingUrl(u) {
  return String(u || "").trim().replace(/\/+$/, "");
}

/** FastAPI: detail can be string, array of {loc,msg,type}, or object */
export function formatFastApiDetail(detail) {
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
        try { return JSON.stringify(e); } catch { return ""; }
      })
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof detail === "object" && detail.msg != null) return String(detail.msg);
  try { return JSON.stringify(detail); } catch { return "Błąd serwera"; }
}

export function stripDebug(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const { __debug, ...rest } = obj;
  return rest;
}

export function buildExportPayload(data, cepikResult) {
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

export function mergeSearchRecord(row) {
  const snap = row.snapshot_json || {};
  return {
    ...snap,
    listingUrl: row.listing_url || snap.listingUrl,
    vin: row.manual_vin ?? snap.vin ?? null,
    firstRegistration: row.manual_first_registration ?? snap.firstRegistration ?? null,
    licensePlate: row.manual_license_plate ?? snap.licensePlate ?? null,
  };
}
