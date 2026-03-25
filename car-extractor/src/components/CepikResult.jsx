import { useMemo, useState } from "react";
import OdometerChart, { parseKmFlexible } from "./OdometerChart.jsx";

function mismatchCountLabel(n) {
  if (n === 1) return "pole niezgodne z CEPiK";
  if (n >= 2 && n <= 4) return "pola niezgodne z CEPiK";
  return "pól niezgodnych z CEPiK";
}

function parseDateFlexible(input) {
  if (input == null || input === "") return null;
  if (typeof input === "number" && Number.isFinite(input)) return input;
  const s = String(input).trim();
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isFinite(t)) return t;
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const tt = d.getTime();
    return Number.isFinite(tt) ? tt : null;
  }
  return null;
}

function formatPlDate(ms) {
  if (!Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return null;
  }
}

function extractDetailValue(eventRaw, detailNameRe) {
  const details = eventRaw?.eventDetails;
  if (!Array.isArray(details)) return null;
  const re = detailNameRe instanceof RegExp ? detailNameRe : new RegExp(String(detailNameRe), "i");
  const found = details.find(d => typeof d?.name === "string" && re.test(d.name));
  const v = found?.value ?? found?.val ?? null;
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function extractValidUntilFromEventName(eventRaw) {
  const eventName = eventRaw?.eventName;
  if (!eventName) return null;
  const m = String(eventName).match(/ważne do\s*([0-9]{1,2})[.\-\/]([0-9]{1,2})[.\-\/]([0-9]{4})/i);
  if (!m) return null;
  const dd = String(m[1]).padStart(2, "0");
  const mm = String(m[2]).padStart(2, "0");
  const yyyy = String(m[3]);
  const iso = `${yyyy}-${mm}-${dd}`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function getOdoKm(r) {
  const km = parseKmFlexible(r?.mileage ?? r?.value);
  return km != null ? km : null;
}

function computeOdoMetrics(odoReadings, productionYear) {
  const arr = Array.isArray(odoReadings) ? odoReadings : [];

  const points = arr
    .map((r, idx) => {
      const km = getOdoKm(r);
      if (km == null) return null;
      const t = parseDateFlexible(r?.date ?? r?.checkDate ?? null);
      return { km, t, idx };
    })
    .filter(Boolean);

  const countReadings = arr.length;
  if (points.length === 0) return { countReadings, avgAnnualKmPerYear: null, lastKm: null, lastDateMs: null };

  // Wybierz „ostatni” odczyt: po dacie jeśli są, w przeciwnym razie po indeksie.
  const pointsWithDates = points.filter(p => Number.isFinite(p.t));
  let last = null;
  if (pointsWithDates.length > 0) {
    last = [...pointsWithDates].sort((a, b) => b.t - a.t || b.idx - a.idx)[0];
  } else {
    last = [...points].sort((a, b) => b.idx - a.idx)[0];
  }

  const lastKm = last?.km ?? null;
  const lastDateMs = last && Number.isFinite(last.t) ? last.t : null;

  const yearNum = productionYear != null ? Number(productionYear) : NaN;
  let avgAnnualKmPerYear = null;
  if (Number.isFinite(yearNum) && yearNum > 0 && lastKm != null && lastDateMs != null) {
    // Założenie: w momencie produkcji przebieg = 0
    const productionStartMs = Date.parse(`${yearNum}-01-01`);
    if (Number.isFinite(productionStartMs) && lastDateMs > productionStartMs) {
      const years = (lastDateMs - productionStartMs) / (1000 * 60 * 60 * 24 * 365.25);
      if (Number.isFinite(years) && years > 0) {
        avgAnnualKmPerYear = lastKm / years;
      }
    }
  }

  return {
    countReadings,
    avgAnnualKmPerYear,
    lastKm,
    lastDateMs,
  };
}

function computeInspectionMetrics(events) {
  const arr = Array.isArray(events) ? events : [];
  const isInspection = (ev) => {
    const rawType = ev?.raw?.eventType ?? ev?.type ?? ev?.eventType ?? "";
    return /badanie-techniczne-okresowe/i.test(String(rawType || ""));
  };

  const inspections = arr.filter(isInspection);
  const countInspections = inspections.length;

  const withDates = inspections
    .map((ev, idx) => {
      const t = parseDateFlexible(ev?.date ?? ev?.raw?.eventDate ?? null);
      return { ev, idx, t };
    })
    .filter(x => x.ev && (Number.isFinite(x.t) || x.idx != null));

  const sorted = withDates.sort((a, b) => {
    const aOk = Number.isFinite(a.t);
    const bOk = Number.isFinite(b.t);
    if (aOk && bOk) return b.t - a.t;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return a.idx - b.idx;
  });

  const lastInspection = sorted[0]?.ev;
  const lastInspectionDateMs = sorted[0] ? sorted[0].t : null;
  const lastResult = lastInspection ? extractDetailValue(lastInspection.raw, /wynik badania/i) : null;

  let validUntilMs = null;
  for (const s of sorted) {
    const ev = s.ev;
    const vu = extractValidUntilFromEventName(ev?.raw);
    if (vu != null) {
      validUntilMs = vu;
      break;
    }
  }

  return {
    countInspections,
    lastInspectionDateMs: Number.isFinite(lastInspectionDateMs) ? lastInspectionDateMs : null,
    lastResult,
    validUntilMs,
  };
}

function extractOdoKmFromEventRaw(eventRaw) {
  const details = eventRaw?.eventDetails;
  if (!Array.isArray(details)) return null;
  const found = details.find(d => typeof d?.name === "string" && /drogomierz|stan drogomierza/i.test(d.name));
  const km = parseKmFlexible(found?.value);
  return km != null ? km : null;
}

export default function CepikResult({ cepik }) {
  if (!cepik) return null;

  const checks = cepik.comparison?.checks || [];
  const mismatches = checks.filter(c => c.status === "warning");
  const okCount = checks.filter(c => c.status === "ok").length;
  const odo = cepik.odometerReadings || [];

  const allComparedOk = mismatches.length === 0 && okCount > 0;
  const noMismatchIncomplete =
    mismatches.length === 0 && okCount === 0 && checks.length > 0;

  const [eventsExpanded, setEventsExpanded] = useState(false);

  const eventsSortedDesc = useMemo(() => {
    const src = Array.isArray(cepik.events) ? cepik.events : [];
    const withIdx = src.map((ev, idx) => ({ ev, idx }));
    const parseT = (d) => {
      const t = Date.parse(d);
      return Number.isFinite(t) ? t : NaN;
    };

    withIdx.sort((a, b) => {
      const ta = parseT(a.ev?.date);
      const tb = parseT(b.ev?.date);
      const aOk = Number.isFinite(ta);
      const bOk = Number.isFinite(tb);
      if (aOk && bOk) return tb - ta; // newest first
      if (aOk && !bOk) return -1;
      if (!aOk && bOk) return 1;
      return a.idx - b.idx; // fallback: original order
    });

    return withIdx.map(x => x.ev);
  }, [cepik.events]);

  const visibleEvents = eventsExpanded ? eventsSortedDesc : eventsSortedDesc.slice(0, 5);
  const showEventsToggle = eventsSortedDesc.length > 5;

  const productionYear = cepik?.technicalData?.year;
  const odoMetrics = useMemo(() => computeOdoMetrics(odo, productionYear), [odo, productionYear]);
  const inspectionMetrics = useMemo(() => computeInspectionMetrics(cepik.events), [cepik.events]);

  const metricTiles = useMemo(() => {
    const avg = odoMetrics.avgAnnualKmPerYear;
    const avgStr = Number.isFinite(avg) ? `${Math.round(avg).toLocaleString("pl-PL")} km/rok` : null;

    const totalOwners = cepik?.technicalData?.totalOwners;
    const totalCoOwners = cepik?.technicalData?.totalCoOwners;
    const ownersTotal =
      totalOwners != null && totalCoOwners != null
        ? Number(totalOwners) + Number(totalCoOwners)
        : totalOwners != null
          ? Number(totalOwners)
          : null;
    const ownersStr =
      ownersTotal != null
        ? totalCoOwners != null && Number(totalCoOwners) > 0
          ? `${ownersTotal.toLocaleString("pl-PL")} (${Number(totalOwners)} + ${Number(totalCoOwners)} współwłaśc.)`
          : `${ownersTotal.toLocaleString("pl-PL")}`
        : null;

    const validOc = cepik?.technicalData?.validOcInsurance;
    const validOcStr = validOc === true ? "✓" : validOc === false ? "✗" : null;

    const insuranceExpiryMs = parseDateFlexible(cepik?.technicalData?.insuranceExpiryDate);
    const insuranceExpiryStr = insuranceExpiryMs ? formatPlDate(insuranceExpiryMs) : null;

    const registrationProvince = cepik?.technicalData?.registrationProvince;

    const rolledBackCount = Array.isArray(odo)
      ? odo.filter(r => r?.rolledBack === true).length
      : 0;
    const rolledBackStr = rolledBackCount > 0 ? `tak (${rolledBackCount})` : "nie";

    const lastResultStr = inspectionMetrics.lastResult;
    const nextTestStr = formatPlDate(inspectionMetrics.validUntilMs);

    return {
      przebieg: { avgAnnual: avgStr },
      zasoby: {
        owners: ownersStr,
        validOc: validOcStr,
        insuranceExpiry: insuranceExpiryStr,
        registrationProvince: registrationProvince || null,
        rolledBack: rolledBackStr,
      },
      techniczne: {
        lastResult: lastResultStr,
        nextTest: nextTestStr,
      },
    };
  }, [odoMetrics, inspectionMetrics, cepik?.technicalData, odo]);

  return (
    <div className="cepik-result">
      <div className="cepik-score-card">
        {mismatches.length > 0 ? (
          <div>
            <div className="cepik-score-num" style={{ color: "var(--red)" }}>
              {mismatches.length}
            </div>
            <div className="cepik-score-label">{mismatchCountLabel(mismatches.length)}</div>
          </div>
        ) : allComparedOk ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color: "var(--green)" }}>✓</span>
            <div>
              <div
                className="cepik-score-label"
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  textTransform: "none",
                  letterSpacing: "0",
                }}
              >
                Wszystkie porównane pola są zgodne z CEPiK
              </div>
            </div>
          </div>
        ) : noMismatchIncomplete ? (
          <div>
            <div
              className="cepik-score-label"
              style={{
                fontSize: 12,
                color: "var(--sub)",
                textTransform: "none",
                letterSpacing: "0",
              }}
            >
              Brak rozbieżności. Część pól nie została porównana (brak danych w ogłoszeniu lub w odpowiedzi CEPiK).
            </div>
          </div>
        ) : (
          <div
            className="cepik-score-label"
            style={{ fontSize: 11, color: "var(--sub)", textTransform: "none", letterSpacing: "0" }}
          >
            Porównanie z CEPiK
          </div>
        )}
        {cepik.meta?.cacheHit != null && (
          <div className="meta-pill" style={{ marginLeft: "auto" }}>
            {cepik.meta.cacheHit ? "cache" : "świeże dane"}
          </div>
        )}
      </div>


      {mismatches.length > 0 && (
        <div className="cepik-checks">
          <div
            className="cepik-check-row"
            style={{
              background: "var(--card2)",
              fontFamily: "var(--ff-m)",
              fontSize: 9,
              letterSpacing: "1px",
              color: "var(--amber)",
              textTransform: "uppercase",
            }}
          >
            <span></span>
            <span>Pole</span>
            <span>Ogłoszenie</span>
            <span>CEPiK</span>
          </div>
          {mismatches.map((c, i) => (
            <div key={i} className="cepik-check-row warning">
              <span className="cepik-check-icon" style={{ color: "var(--red)" }}>
                ⚠
              </span>
              <span className="cepik-check-field">{c.field}</span>
              <span className="cepik-check-val">{c.listing != null ? String(c.listing) : "—"}</span>
              <span className="cepik-check-msg">
                {c.cepi != null ? String(c.cepi) : ""}
                {c.message && (
                  <span style={{ color: "var(--sub)", marginLeft: 4, fontSize: 9 }}>({c.message})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {odo.length > 0 && (
        <>
          <div className="cepik-section-title">Historia przebiegu</div>
          <OdometerChart readings={odo} />
        </>
      )}

      {cepik.events?.length > 0 && (
        <>
          <div className="cepik-section-title">Zdarzenia</div>
          <div className="odo-timeline">
            {visibleEvents.map((ev, i) => {
              const base = ev.raw?.eventName || ev.type || ev.description || "Zdarzenie";
              const resultVal = extractDetailValue(ev.raw, /wynik badania/i);
              const odoKm = extractOdoKmFromEventRaw(ev.raw);
              return (
                <div key={i} className="odo-row">
                  <span className="odo-date">{ev.date || "—"}</span>
                  <span className="odo-val" style={{ fontSize: 11, color: "var(--sub)", fontWeight: 400 }}>
                    {base}
                    {resultVal && (
                      <span style={{ color: "var(--text)", fontWeight: 600 }}> · Wynik: {resultVal}</span>
                    )}
                    {odoKm != null && (
                      <span style={{ color: "var(--text)", fontWeight: 600 }}> · {odoKm.toLocaleString("pl-PL")} km</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {showEventsToggle && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="cepik-events-toggle"
                onClick={() => setEventsExpanded(v => !v)}
              >
                {eventsExpanded ? "Zwiń" : "Pokaż wszystkie"}
              </button>
            </div>
          )}

          <div className="cepik-section-title">Metryki CEPiK</div>

          <div className="cepik-section-title" style={{ marginTop: 10, marginBottom: 6, color: "var(--amber)" }}>
            Przebieg
          </div>
          <div className="specs">
            <div className="spec">
              <div className="spec-lbl">Średnioroczny przebieg</div>
              <div className={`spec-val ${metricTiles?.przebieg?.avgAnnual == null ? "nil" : ""}`}>
                {metricTiles?.przebieg?.avgAnnual ?? "—"}
              </div>
            </div>
          </div>

          <div className="cepik-section-title" style={{ marginTop: 14, marginBottom: 6, color: "var(--amber)" }}>
            Właściciele i ubezpieczenie
          </div>
          <div className="specs">
            {[
              { key: "owners", lbl: "Łączna liczba właścicieli", val: metricTiles?.zasoby?.owners },
              { key: "validOc", lbl: "OC aktualne", val: metricTiles?.zasoby?.validOc },
              { key: "insuranceExpiry", lbl: "OC ważne do", val: metricTiles?.zasoby?.insuranceExpiry },
              { key: "registrationProvince", lbl: "Woj. rejestracji", val: metricTiles?.zasoby?.registrationProvince },
              { key: "rolledBack", lbl: "Cofnięcie licznika", val: metricTiles?.zasoby?.rolledBack },
            ].map(t => {
              const nil = t.val == null || t.val === "";
              return (
                <div className="spec" key={t.key}>
                  <div className="spec-lbl">{t.lbl}</div>
                  <div className={`spec-val ${nil ? "nil" : ""}`}>{nil ? "—" : t.val}</div>
                </div>
              );
            })}
          </div>

          <div className="cepik-section-title" style={{ marginTop: 14, marginBottom: 6, color: "var(--amber)" }}>
            Badanie techniczne
          </div>
          <div className="specs">
            {[
              { key: "lastResult", lbl: "Wynik ostatniego badania", val: metricTiles?.techniczne?.lastResult },
              { key: "nextTest", lbl: "Następne badanie (ważne do)", val: metricTiles?.techniczne?.nextTest },
            ].map(t => {
              const nil = t.val == null || t.val === "";
              return (
                <div className="spec" key={t.key}>
                  <div className="spec-lbl">{t.lbl}</div>
                  <div className={`spec-val ${nil ? "nil" : ""}`}>{nil ? "—" : t.val}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="cepik-disclaimer">
        ⚠️ Dane z oficjalnego rejestru CEPiK (moj.gov.pl). Rozbieżności mogą wynikać z opóźnień aktualizacji lub błędów edycji.
      </div>

    </div>
  );
}
