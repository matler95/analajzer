import OdometerChart from "./OdometerChart.jsx";

function mismatchCountLabel(n) {
  if (n === 1) return "pole niezgodne z CEPiK";
  if (n >= 2 && n <= 4) return "pola niezgodne z CEPiK";
  return "pól niezgodnych z CEPiK";
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
            {cepik.events.slice(0, 8).map((ev, i) => (
              <div key={i} className="odo-row">
                <span className="odo-date">{ev.date || "—"}</span>
                <span className="odo-val" style={{ fontSize: 11, color: "var(--sub)", fontWeight: 400 }}>
                  {ev.raw?.eventName || ev.type || ev.description || "Zdarzenie"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {cepik.events?.length > 0 && (
        <>
          <div className="cepik-section-title">Dodatkowe informacje</div>
          <div className="odo-timeline">
            {cepik.events.slice(0, 8).map((ev, i) => (
              <div key={i} className="odo-row">
                <span className="odo-date">{ev.date || "—"}</span>
                <span className="odo-val" style={{ fontSize: 11, color: "var(--sub)", fontWeight: 400 }}>
                  {ev.raw?.eventName || ev.type || ev.description || "Zdarzenie"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="cepik-disclaimer">
        ⚠️ Dane z oficjalnego rejestru CEPiK (moj.gov.pl). Rozbieżności mogą wynikać z opóźnień aktualizacji lub błędów edycji.
      </div>

    </div>
  );
}
