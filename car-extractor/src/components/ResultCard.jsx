import { useState, useEffect } from "react";
import VerifyPanel from "./VerifyPanel.jsx";
import CepikResult from "./CepikResult.jsx";
import { buildExportPayload } from "../utils/normalize.js";

const FIELDS = [
  { key: "year",               lbl: "Rok" },
  { key: "mileage",            lbl: "Przebieg",    u: "km",  fmt: v => v?.toLocaleString("pl-PL") },
  { key: "countryOfOrigin",    lbl: "Kraj pochodzenia" },
  { key: "engineDisplacement", lbl: "Pojemność",   u: "cm³", fmt: v => v?.toLocaleString("pl-PL") },
  { key: "enginePower",        lbl: "Moc",         uFn: d => d.enginePowerUnit || "KM" },
  { key: "fuelType",           lbl: "Paliwo" },
  { key: "transmission",       lbl: "Skrzynia" },
  { key: "drivetrain",         lbl: "Napęd" },
  { key: "bodyType",           lbl: "Nadwozie" },
  // { key: "color",              lbl: "Kolor" },
  // { key: "doors",              lbl: "Drzwi" },
  // { key: "seats",              lbl: "Miejsca" },
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

/* ─── LIGHTBOX ─────────────────────────────────────────── */
function Lightbox({ images, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  const handleKey = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="lightbox-overlay" onClick={onClose} onKeyDown={handleKey} tabIndex={0} role="dialog" aria-label="Przeglądarka zdjęć">
      <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Zamknij">✕</button>
        <img src={images[idx]} alt={`Zdjęcie ${idx + 1}`} className="lightbox-img" />
        {images.length > 1 && (
          <>
            <button type="button" className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Poprzednie">‹</button>
            <button type="button" className="lightbox-nav lightbox-next" onClick={next} aria-label="Następne">›</button>
            <div className="lightbox-counter">{idx + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── HERO IMAGE ────────────────────────────────────────── */
function HeroImage({ images, verificationBadge, brand, model, price, currency, portal }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainImage = images?.[0];

  return (
    <>
      <div className="car-hero-v2">
        {/* Full-bleed image */}
        <div className="car-hero-img-wrap" onClick={mainImage ? () => setLightboxOpen(true) : undefined}
             style={{ cursor: mainImage ? "zoom-in" : "default" }}>
          {mainImage
            ? <img src={mainImage} alt="Zdjęcie pojazdu" className="car-hero-img-full" />
            : <div className="car-hero-img-placeholder"><span className="vx-logo">VX</span></div>
          }
          {/* Gradient overlay for text legibility */}
          <div className="car-hero-overlay" />
        </div>

        {/* Overlaid content */}
        <div className="car-hero-overlay-content">
          {/* Top row: portal badge + verification score */}
          <div className="car-hero-top-row">
            {portal && (
              <div className="car-hero-portal-badge">{portal.toUpperCase()}</div>
            )}
            {verificationBadge && (
              <div className={`car-hero-score-badge ${verificationBadge.cls}`}>
                {verificationBadge.label}
              </div>
            )}
          </div>

          {/* Bottom row: brand/model/price */}
          <div className="car-hero-bottom-row">
            <div className="car-hero-title-block">
              <div className="car-hero-brand">{brand ?? "Nieznana marka"}</div>
              <div className="car-hero-model">{model ?? "Nieznany model"}</div>
            </div>
            {price && (
              <div className="car-hero-price-block">
                <div className="car-hero-price-val">
                  <span className="car-hero-price-cur">{currency ?? "PLN"}</span>
                  {price.toLocaleString("pl-PL")}
                </div>
                <div className="car-hero-price-note">CENA BRUTTO</div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip if multiple images */}
        {images?.length > 1 && (
          <div className="car-hero-thumbstrip">
            {images.slice(0, 6).map((img, i) => (
              <button
                key={i}
                type="button"
                className="car-hero-thumb"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Zdjęcie ${i + 1}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
            {images.length > 6 && (
              <button type="button" className="car-hero-thumb car-hero-thumb-more"
                onClick={() => setLightboxOpen(true)}>
                +{images.length - 6}
              </button>
            )}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox images={images} initialIndex={0} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export default function ResultCard({
  data, cepik, savedSearchId, saveMsg, saveBusy,
  me, cepikLoading, cepikErr, vinLoading,
  onUpdateField, onVerify, onSave,
}) {
  const [activeTab, setActiveTab] = useState("specs");
  const [showDebug, setShowDebug] = useState(false);
  const [galleryLightbox, setGalleryLightbox] = useState(null); // index or null
  const compLookup = buildComparisonLookup(cepik);
  const hasCepik = Boolean(cepik);

  const cepikTabDisabledTitle =
    "Najpierw przeprowadź weryfikację przyciskiem „Weryfikuj z gov.pl” w zakładce Specyfikacja.";

  useEffect(() => {
    if (activeTab === "cepik" && !hasCepik) setActiveTab("specs");
  }, [activeTab, hasCepik]);

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
    if (warns > 0) return { cls: "red", label: `⚠ ${warns} rozbieżn.` };
    return { cls: "green", label: "✓ Zgodne z CEPiK" };
  })() : null;

  return (
    <div className="result">

      {/* ─── HERO V2 ─── */}
      <HeroImage
        images={data.images}
        verificationBadge={verificationBadge}
        brand={data.brand}
        model={data.model}
        price={data.price}
        currency={data.currency}
        portal={data.portal}
      />

      {/* Variant subtitle below hero if present */}
      {data.variant && (
        <div className="car-variant-bar">{data.variant}</div>
      )}

      {/* ─── TABS ─── */}
      <div className="result-tabs">
        {[
          { key: "specs", label: "Specyfikacja", disabled: false },
          { key: "photos", label: `Zdjęcia${data.images?.length ? ` (${data.images.length})` : ""}`, disabled: false },
          { key: "desc", label: "Opis", disabled: false },
          { key: "seller", label: "Sprzedający", disabled: false },
          { key: "cepik", label: "CEPiK", disabled: !hasCepik },
        ].map(tab => (
          <div
            key={tab.key}
            className={`result-tab-cell ${tab.disabled ? "is-disabled" : ""}`}
            title={tab.disabled ? cepikTabDisabledTitle : undefined}
          >
            <button
              type="button"
              className={`result-tab ${activeTab === tab.key ? "on" : ""}`}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              aria-disabled={tab.disabled}
            >
              {tab.label}
            </button>
          </div>
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

          <VerifyPanel
            me={me}
            data={data}
            onUpdateField={onUpdateField}
            onVerify={onVerify}
            cepikLoading={cepikLoading}
            cepikErr={cepikErr}
            vinLoading={vinLoading}
          />
        </div>
      )}

      {/* ─── CEPIK TAB (po weryfikacji) ─── */}
      {activeTab === "cepik" && hasCepik && (
        <div className="result-tab-content">
          <CepikResult cepik={cepik} />
        </div>
      )}

      {/* ─── PHOTOS TAB ─── */}
      {activeTab === "photos" && (
        <div className="result-tab-content">
          {data.images?.length > 0 ? (
            <>
              <div className="gallery-v2">
                {data.images.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    className="gallery-v2-item"
                    onClick={() => setGalleryLightbox(i)}
                    aria-label={`Otwórz zdjęcie ${i + 1}`}
                  >
                    <img src={img} alt={`Zdjęcie ${i + 1}`} loading="lazy" />
                    <div className="gallery-v2-zoom">⤢</div>
                  </button>
                ))}
              </div>
              {galleryLightbox !== null && (
                <Lightbox
                  images={data.images}
                  initialIndex={galleryLightbox}
                  onClose={() => setGalleryLightbox(null)}
                />
              )}
            </>
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

        {saveMsg && (
          <div className="action-bar-status">
            <div className="action-bar-status-text">
              {saveMsg}
              {savedSearchId && <span className="meta-pill">#{savedSearchId}</span>}
            </div>
          </div>
        )}

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
        Weryfikacja CEPiK przez backend FastAPI → moj.gov.pl.
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
