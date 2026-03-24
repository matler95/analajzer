function checkIcon(status) {
  if (status === "ok") return "✓";
  if (status === "warning") return "⚠";
  return "○";
}

export default function CepikResult({ cepik }) {
  if (!cepik) return null;

  const checks = cepik.comparison?.checks || [];
  const okCount = checks.filter(c => c.status === "ok").length;
  const warnCount = checks.filter(c => c.status === "warning").length;
  const total = checks.filter(c => c.status !== "check").length;
  const odo = cepik.odometerReadings || [];

  return (
    <div className="cepik-result">
      <div className="cepik-score-card">
        <div>
          <div className="cepik-score-num">{okCount}<span style={{ fontSize: "18px", color: "var(--sub)" }}>/{total}</span></div>
          <div className="cepik-score-label">Pól zgodnych</div>
        </div>
        {warnCount > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--red)" }}>
            ⚠ {warnCount} {warnCount === 1 ? "rozbieżność" : "rozbieżności"}
          </div>
        )}
        {cepik.meta?.cacheHit != null && (
          <div className="meta-pill" style={{ marginLeft: warnCount > 0 ? 8 : "auto" }}>
            {cepik.meta.cacheHit ? "cache" : "świeże dane"}
          </div>
        )}
      </div>

      <div className="cepik-disclaimer">
        ⚠️ Dane z oficjalnego rejestru CEPiK (moj.gov.pl). Rozbieżności mogą wynikać z opóźnień aktualizacji lub błędów edycji.
      </div>

      {checks.length > 0 && (
        <div className="cepik-checks">
          <div className="cepik-check-row" style={{ background: "var(--card2)", fontFamily: "var(--ff-m)", fontSize: 9, letterSpacing: "1px", color: "var(--amber)", textTransform: "uppercase" }}>
            <span></span>
            <span>Pole</span>
            <span>Ogłoszenie</span>
            <span>CEPiK</span>
          </div>
          {checks.map((c, i) => (
            <div key={i} className={`cepik-check-row ${c.status}`}>
              <span className="cepik-check-icon" style={{ color: c.status === "ok" ? "var(--green)" : c.status === "warning" ? "var(--red)" : "var(--amber)" }}>
                {checkIcon(c.status)}
              </span>
              <span className="cepik-check-field">{c.field}</span>
              <span className="cepik-check-val">{c.listing != null ? String(c.listing) : "—"}</span>
              <span className="cepik-check-msg">
                {c.cepi != null ? String(c.cepi) : ""}
                {c.message && <span style={{ color: "var(--sub)", marginLeft: 4, fontSize: 9 }}>({c.message})</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {odo.length > 0 && (
        <>
          <div className="cepik-section-title">Historia przebiegu</div>
          <div className="odo-timeline">
            {[...odo].reverse().map((r, i) => (
              <div key={i} className="odo-row">
                <span className="odo-date">{r.date || r.checkDate || "—"}</span>
                <span className="odo-val">
                  {r.mileage != null
                    ? Number(r.mileage).toLocaleString("pl-PL") + " km"
                    : r.value != null
                      ? Number(r.value).toLocaleString("pl-PL") + " km"
                      : "—"}
                </span>
              </div>
            ))}
          </div>
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
                  {ev.type || ev.description || "Zdarzenie"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
