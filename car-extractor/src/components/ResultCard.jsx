import { useState } from "react";
import VerifyPanel from "./VerifyPanel.jsx";
import CepikResult from "./CepikResult.jsx";
import { buildExportPayload } from "../utils/normalize.js";

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
  year: "year", fuelType: "fuelType", engineDisplacement: "engineDisplacement",
  enginePower: "enginePower", mileage: "mileage", firstRegistration: "firstRegistration",
  brand: "brand", model: "model",
};

function buildComparisonLookup(cepik) {
  const checks = cepik?.comparison?.checks;
  if (!Array.isArray(checks)) return {};
  const map = {};
  for (const c of checks) {
    const key = COMPARISON_TO_UI[c?.field];
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
  const left = check.listing != null ? JSON.stringify(check.listing) : "brak";
  const right = check.cepi != null ? JSON.stringify(check.cepi) : "brak";
  return `Ogłoszenie: ${left} | CEPiK: ${right}`;
}

export default function ResultCard({
  data, cepik, savedSearchId, saveMsg, saveBusy,
  me, cepikLoading, cepikErr,
  onUpdateField, onVerify, onSave,
}) {
  const [activeTab, setActiveTab] = useState("specs");
  const [showDebug, setShowDebug] = useState(false);
  const compLookup = buildComparisonLookup(cepik);

  const dlJSON = () => {
    const name = [data.brand, data.model, data.year].filter(Boolean).join("-");
    const payload = buildExportPayload(data, cepik);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    a.download = `raport-${name || "pojazd"}-${Date.now()}.json`;
    a.click();
  };

  const verificationBadge = cepik ? (() => {
    const checks = cepik.comparison?.checks || [];
    const warns = checks.filter(c => c.status === "warning").length;
    if (warns > 0) return { cls: "red", label: `⚠ ${warns} rozbieżności` };
    return { cls: "green", label: "✓ Zweryfikowane" };
  })() : null;

  return (
    <div className="result">
      {/* ─── HERO ─── */}
      <div className="car-hero">
        {data.images?.[0]
          ? <img src={data.images[0]} alt="Zdjęcie ogłoszenia" className="car-hero-image" />
          : <div className="car-hero-image-placeholder">VX</div>
        }
        <div className="car-hero-content">
          <div className="car-hero-info">
            {data.portal && <div className="ch-src">ŹRÓDŁO: {data.portal}</div>}
            <div className="ch-brand-row">
              <div className="ch-brand">{data.brand ?? "NIEZNANA MARKA"}</div>
              {compLookup.brand && (
                <span className={`cmp-badge ${compLookup.brand.status}`} title={checkTooltip(compLookup.brand)}>
                  {checkIcon(compLookup.brand.status)}
                </span>
              )}
            </div>
            <div className="ch-model-row">
              <div className="ch-model">{data.model ?? "NIEZNANY MODEL"}</div>
              {compLookup.model && (
                <span className={`cmp-badge ${compLookup.model.status}`} title={checkTooltip(compLookup.model)}>
                  {checkIcon(compLookup.model.status)}
                </span>
              )}
            </div>
            {data.variant && <div className="ch-variant">{data.variant}</div>}
            {verificationBadge && (
              <div className={`verification-badge ${verificationBadge.cls}`}>{verificationBadge.label}</div>
            )}
          </div>
          {data.price && (
            <div className="car-hero-price">
              <div className="price-val">
                <span className="price-cur">{data.currency ?? "PLN"}</span>
                {data.price.toLocaleString("pl-PL")}
              </div>
              <div className="price-note">CENA BRUTTO</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="result-tabs">
        {[
          { key: "specs", label: "Specyfikacja" },
          { key: "photos", label: `Zdjęcia${data.images?.length ? ` (${data.images.length})` : ""}` },
          { key: "desc", label: "Opis" },
          { key: "seller", label: "Sprzedający" },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`result-tab ${activeTab === tab.key ? "on" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SPECS TAB ─── */}
      {activeTab === "specs" && (
        <div className="result-tab-content">
          <div className="specs">
            {FIELDS.map(f => {
              const raw = data[f.key];
              const val = f.fmt ? f.fmt(raw) : raw;
              const unit = f.uFn ? f.uFn(data) : f.u;
              const nil = val == null || val === "";
              const check = compLookup[f.key];
              return (
                <div className="spec" key={f.key} title={checkTooltip(check)}>
                  <div className="spec-lbl-row">
                    <div className="spec-lbl">{f.lbl}</div>
                    {check && (
                      <span
                        className={`cmp-badge ${check.status}`}
                        title={checkTooltip(check)}
                        style={{ width: 16, height: 16, fontSize: 10 }}
                      >
                        {checkIcon(check.status)}
                      </span>
                    )}
                  </div>
                  <div className={`spec-val ${nil ? "nil" : ""}`}>
                    {nil ? "—" : <>{val}{unit && <span className="u">{unit}</span>}</>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verify Panel */}
          <VerifyPanel
            me={me}
            data={data}
            onUpdateField={onUpdateField}
            onVerify={onVerify}
            cepikLoading={cepikLoading}
            cepikErr={cepikErr}
            cepik={cepik}
          />

          {/* CEPiK Result */}
          {cepik && <CepikResult cepik={cepik} />}
        </div>
      )}

      {/* ─── PHOTOS TAB ─── */}
      {activeTab === "photos" && (
        <div className="result-tab-content">
          {data.images?.length > 0 ? (
            <div className="gallery">
              {data.images.map((img, i) => (
                <a className="gallery-item" key={i} href={img} target="_blank" rel="noreferrer">
                  <img src={img} alt={`Zdjęcie ${i + 1}`} loading="lazy" />
                </a>
              ))}
            </div>
          ) : (
            <div className="note" style={{ borderRadius: 0 }}>Brak zdjęć w ogłoszeniu.</div>
          )}
        </div>
      )}

      {/* ─── DESCRIPTION TAB ─── */}
      {activeTab === "desc" && (
        <div className="result-tab-content">
          {data.description ? (
            <div className="desc-box">
              <div className="desc-lbl">Opis ogłoszenia</div>
              <div className="desc-txt">{data.description}</div>
            </div>
          ) : (
            <div className="note" style={{ borderRadius: 0 }}>Brak opisu ogłoszenia.</div>
          )}
        </div>
      )}

      {/* ─── SELLER TAB ─── */}
      {activeTab === "seller" && (
        <div className="result-tab-content">
          <div className="identity">
            <div className="id-card">
              <div className="id-ico">👤</div>
              <div>
                <div className="id-lbl">Sprzedający</div>
                <div className={`id-val ${!data.seller ? "nil" : ""}`}>{data.seller ?? "Niedostępne"}</div>
              </div>
            </div>
            <div className="id-card">
              <div className="id-ico">📍</div>
              <div>
                <div className="id-lbl">Lokalizacja</div>
                <div className={`id-val ${!data.location ? "nil" : ""}`}>{data.location ?? "Niedostępne"}</div>
              </div>
            </div>
            <div className="id-card">
              <div className="id-ico">🪪</div>
              <div>
                <div className="id-lbl">Nr rejestracyjny</div>
                <div className={`id-val ${!data.licensePlate ? "nil" : ""}`}>{data.licensePlate ?? "Niedostępne"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION BAR ─── */}
      <div className="action-bar">
        {/* Secondary actions — left cluster */}
        <div className="action-bar-secondary">
          <button type="button" className="act-btn" onClick={() => window.open(data.listingUrl, "_blank")} title="Otwórz ogłoszenie">
            ↗ Ogłoszenie
          </button>
          <button type="button" className="act-btn" onClick={dlJSON} title="Pobierz raport JSON">
            ⬇ JSON
          </button>
          <button type="button" className="act-btn" onClick={() => window.print()} title="Drukuj / zapisz PDF">
            🖨 Drukuj
          </button>
        </div>

        <div className="action-bar-spacer" />

        {/* Status label */}
        {saveMsg && (
          <div className="action-bar-status">
            <div className="action-bar-status-text">
              {saveMsg}
              {savedSearchId && <span className="meta-pill">#{savedSearchId}</span>}
            </div>
          </div>
        )}

        {/* Primary save CTA — rightmost */}
        <button
          type="button"
          className="act-btn-save"
          disabled={!me || saveBusy}
          onClick={() => onSave({ cepik })}
          title={!me ? "Zaloguj się, aby zapisać" : saveMsg ? "Zapisz ponownie" : "Zapisz w historii"}
        >
          {saveBusy ? "…" : saveMsg ? "↺ Zapisz ponownie" : "💾 Zapisz"}
        </button>
      </div>

      <div className="src-bar">
        <span>Źródło</span>
        <a href={data.listingUrl} target="_blank" rel="noreferrer">{data.listingUrl}</a>
      </div>

      <div className="note">
        <strong>ℹ Jak działa</strong> — Pobieranie przez{" "}
        <a href="https://r.jina.ai" target="_blank" rel="noreferrer" style={{ color: "var(--amber)" }}>r.jina.ai</a>.{" "}
        Weryfikacja gov idzie przez backend FastAPI → moj.gov.pl.
      </div>

      {data.__debug && (
        <div className="note">
          <strong>🛠 Debug parsera</strong>
          <button type="button" className="debug-toggle" onClick={() => setShowDebug(v => !v)}>
            {showDebug ? "Ukryj" : "Pokaż debug"}
          </button>
          {showDebug && (
            <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", fontSize: 11 }}>
              {JSON.stringify(data.__debug, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
