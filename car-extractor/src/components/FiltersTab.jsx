import { useState, useCallback, useMemo } from "react";
import {
  OTOMOTO_BRANDS, BODY_TYPES, GEARBOX_TYPES, FUEL_TYPES,
  getModelsForBrand, buildOtomotoUrl,
  buildOlxUrl, PORTALS,
} from "../utils/otomotoData.js";

/* ─── helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return null; }
}

const EMPTY_VEHICLE_ENTRY = { brand: "", model: "" };
const EMPTY_PARAMS = {
  bodyType: "", gearbox: "", fuelType: "",
  priceFrom: "", priceTo: "",
  yearFrom: "", yearTo: "",
  mileageFrom: "", mileageTo: "",
  powerFrom: "", powerTo: "",
};

/* ─── BrandModelRow ─────────────────────────────────────────── */
function BrandModelRow({ entry, index, onUpdate, onRemove, showRemove }) {
  const models = useMemo(() => getModelsForBrand(entry.brand), [entry.brand]);
  return (
    <div className="ft-bm-row">
      <div className="ft-field">
        <label className="ft-label">Marka {index + 1}</label>
        <select
          className="ft-select"
          value={entry.brand}
          onChange={e => onUpdate(index, { brand: e.target.value, model: "" })}
        >
          <option value="">— wybierz markę —</option>
          {OTOMOTO_BRANDS.map(b => (
            <option key={b.slug} value={b.slug}>{b.label}</option>
          ))}
        </select>
      </div>

      <div className="ft-field">
        <label className="ft-label">Model</label>
        <select
          className="ft-select"
          value={entry.model}
          onChange={e => onUpdate(index, { model: e.target.value })}
          disabled={!entry.brand || models.length === 0}
        >
          <option value="">— wszystkie modele —</option>
          {models.map(m => (
            <option key={m.slug} value={m.slug}>{m.label}</option>
          ))}
        </select>
      </div>

      {showRemove && (
        <button
          type="button"
          className="ft-bm-remove"
          onClick={() => onRemove(index)}
          title="Usuń markę"
        >✕</button>
      )}
    </div>
  );
}

/* ─── RangeField ─────────────────────────────────────────────── */
function RangeField({ label, unit, keyFrom, keyTo, values, onChange }) {
  return (
    <div className="ft-range-group">
      <div className="ft-range-label">
        {label}{unit && <span className="ft-range-unit"> ({unit})</span>}
      </div>
      <div className="ft-range-inputs">
        <input
          className="ft-input"
          type="number"
          placeholder="od"
          value={values[keyFrom]}
          onChange={e => onChange(keyFrom, e.target.value)}
        />
        <span className="ft-range-sep">–</span>
        <input
          className="ft-input"
          type="number"
          placeholder="do"
          value={values[keyTo]}
          onChange={e => onChange(keyTo, e.target.value)}
        />
      </div>
    </div>
  );
}

/* ─── PortalToggle ───────────────────────────────────────────── */
function PortalToggle({ value, onChange }) {
  return (
    <div className="ft-portal-wrap">
      <div className="ft-label">Portal</div>
      <div className="ft-portal-group">
        {PORTALS.map(p => (
          <button
            key={p.value}
            type="button"
            className={`ft-portal-btn ${value === p.value ? "ft-portal-btn--active" : ""}`}
            onClick={() => onChange(p.value)}
          >
            {p.value === "otomoto" && <span className="ft-portal-dot ft-portal-dot--otomoto" />}
            {p.value === "olx"     && <span className="ft-portal-dot ft-portal-dot--olx" />}
            {p.value === "both"    && (
              <>
                <span className="ft-portal-dot ft-portal-dot--otomoto" />
                <span className="ft-portal-dot ft-portal-dot--olx" />
              </>
            )}
            {p.label}
          </button>
        ))}
      </div>
      {value === "olx" && (
        <div className="ft-portal-note">
          Filtry nadwozia, skrzyni i paliwa nie są obsługiwane przez OLX — zostaną zignorowane przy budowaniu linku.
        </div>
      )}
      {value === "both" && (
        <div className="ft-portal-note ft-portal-note--info">
          Skanowanie odbędzie się na obu portalach — każda marka generuje 2 adresy URL.
          Filtry nadwozia/skrzyni/paliwa dotyczą wyłącznie Otomoto.
        </div>
      )}
    </div>
  );
}

/* ─── AddFilterForm ──────────────────────────────────────────── */
function AddFilterForm({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [portal, setPortal] = useState("otomoto");
  const [vehicles, setVehicles] = useState([{ ...EMPTY_VEHICLE_ENTRY }]);
  const [params, setParams] = useState({ ...EMPTY_PARAMS });
  const [err, setErr] = useState(null);

  const updateVehicle = useCallback((idx, patch) => {
    setVehicles(prev => prev.map((v, i) => i === idx ? { ...v, ...patch } : v));
  }, []);

  const addVehicle = () => {
    if (vehicles.length >= 5) return;
    setVehicles(prev => [...prev, { ...EMPTY_VEHICLE_ENTRY }]);
  };

  const removeVehicle = (idx) => {
    setVehicles(prev => prev.filter((_, i) => i !== idx));
  };

  const setParam = useCallback((key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  /** Build all search URLs based on portal selection + vehicles */
  const buildAllUrls = useCallback(() => {
    const validVehicles = vehicles.filter(v => v.brand);
    const urls = [];
    for (const v of validVehicles) {
      if (portal === "otomoto" || portal === "both") {
        urls.push({ url: buildOtomotoUrl({ ...params, brand: v.brand, model: v.model }), portal: "otomoto", brand: v.brand, model: v.model });
      }
      if (portal === "olx" || portal === "both") {
        urls.push({ url: buildOlxUrl({ ...params, brand: v.brand }), portal: "olx", brand: v.brand });
      }
    }
    return urls;
  }, [vehicles, params, portal]);

  const previewUrls = useMemo(() => buildAllUrls(), [buildAllUrls]);

  const handleSubmit = () => {
    if (!name.trim()) { setErr("Podaj nazwę filtru"); return; }
    const validVehicles = vehicles.filter(v => v.brand);
    if (validVehicles.length === 0) { setErr("Wybierz co najmniej jedną markę"); return; }
    setErr(null);

    const urlEntries = buildAllUrls();
    const searchUrls = urlEntries.map(e => e.url);

    onAdd({
      name: name.trim(),
      portal,
      vehicles: validVehicles,
      params,
      searchUrls,
      searchUrl: searchUrls[0],
    });
    onClose();
  };

  return (
    <div className="ft-add-form">
      <div className="ft-add-title">Nowy filtr wyszukiwania</div>

      {/* Filter name */}
      <div className="ft-field ft-field--full">
        <label className="ft-label">Nazwa filtru</label>
        <input
          className="ft-input"
          placeholder="np. Rodzinne kombi, Sportowe coupe do 60k"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          autoFocus
        />
      </div>

      {/* ── PORTAL ── */}
      <PortalToggle value={portal} onChange={setPortal} />

      {/* ── BRANDS & MODELS ── */}
      <div className="ft-section-title">
        <span>Marki i modele</span>
        <span className="ft-section-hint">Możesz wybrać wiele marek — każda będzie skanowana osobno</span>
      </div>

      <div className="ft-bm-list">
        {vehicles.map((v, i) => (
          <BrandModelRow
            key={i}
            entry={v}
            index={i}
            onUpdate={updateVehicle}
            onRemove={removeVehicle}
            showRemove={vehicles.length > 1}
          />
        ))}
      </div>

      {vehicles.length < 5 && (
        <button type="button" className="ft-add-brand-btn" onClick={addVehicle}>
          + Dodaj kolejną markę
        </button>
      )}

      {/* ── PARAMETERS ── */}
      <div className="ft-section-title" style={{ marginTop: 20 }}>
        <span>Parametry</span>
        {portal !== "otomoto" && (
          <span className="ft-section-hint">Filtry nadwozia/skrzyni/paliwa dotyczą tylko Otomoto</span>
        )}
      </div>

      <div className="ft-params-grid">

        {/* Dropdowns — Otomoto-only */}
        {(portal === "otomoto" || portal === "both") && (
          <>
            <div className="ft-field">
              <label className="ft-label">Typ nadwozia</label>
              <select className="ft-select" value={params.bodyType} onChange={e => setParam("bodyType", e.target.value)}>
                <option value="">— dowolny —</option>
                {BODY_TYPES.map(b => <option key={b.slug} value={b.slug}>{b.label}</option>)}
              </select>
            </div>

            <div className="ft-field">
              <label className="ft-label">Skrzynia biegów</label>
              <select className="ft-select" value={params.gearbox} onChange={e => setParam("gearbox", e.target.value)}>
                <option value="">— dowolna —</option>
                {GEARBOX_TYPES.map(g => <option key={g.slug} value={g.slug}>{g.label}</option>)}
              </select>
            </div>

            <div className="ft-field">
              <label className="ft-label">Rodzaj paliwa</label>
              <select className="ft-select" value={params.fuelType} onChange={e => setParam("fuelType", e.target.value)}>
                <option value="">— dowolny —</option>
                {FUEL_TYPES.map(f => <option key={f.slug} value={f.slug}>{f.label}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Ranges — all portals */}
        <RangeField label="Rok produkcji" keyFrom="yearFrom" keyTo="yearTo" values={params} onChange={setParam} />
        <RangeField label="Cena" unit="PLN" keyFrom="priceFrom" keyTo="priceTo" values={params} onChange={setParam} />
        <RangeField label="Przebieg" unit="km" keyFrom="mileageFrom" keyTo="mileageTo" values={params} onChange={setParam} />
        <RangeField label="Moc" unit="KM" keyFrom="powerFrom" keyTo="powerTo" values={params} onChange={setParam} />
      </div>

      {/* Preview URLs */}
      {previewUrls.length > 0 && (
        <div className="ft-preview">
          <div className="ft-preview-title">
            Podgląd adresów URL ({previewUrls.length})
          </div>
          {previewUrls.map((entry, i) => (
            <div key={i} className="ft-preview-url">
              <span className={`ft-preview-portal-badge ft-preview-portal-badge--${entry.portal}`}>
                {entry.portal === "otomoto" ? "OTO" : "OLX"}
              </span>
              <a href={entry.url} target="_blank" rel="noreferrer" className="ft-preview-link">{entry.url}</a>
            </div>
          ))}
        </div>
      )}

      {err && <div className="ft-err">⚠ {err}</div>}

      <div className="ft-add-footer">
        <button type="button" className="ft-submit-btn" onClick={handleSubmit}>
          Dodaj filtr
        </button>
        <button type="button" className="ft-cancel-btn" onClick={onClose}>
          Anuluj
        </button>
      </div>
    </div>
  );
}

/* ─── FilterCard ─────────────────────────────────────────────── */
function FilterCard({ filter, isJobRunning, isThisRunning, onRun, onRemove }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRemove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
      return;
    }
    onRemove(filter.id);
  };

  const vehicleLabel = useMemo(() => {
    if (filter.vehicles?.length > 0) {
      return filter.vehicles.map(v => {
        const brand = OTOMOTO_BRANDS.find(b => b.slug === v.brand);
        const models = getModelsForBrand(v.brand);
        const model = models.find(m => m.slug === v.model);
        const brandLabel = brand?.label ?? v.brand ?? "?";
        const modelLabel = model?.label ?? v.model ?? "";
        return modelLabel ? `${brandLabel} ${modelLabel}` : brandLabel;
      }).join(" + ");
    }
    return filter.searchUrl || "Brak URL";
  }, [filter]);

  const paramsLabel = useMemo(() => {
    if (!filter.params) return null;
    const p = filter.params;
    const parts = [];
    if (p.yearFrom || p.yearTo) parts.push(`${p.yearFrom || "?"}–${p.yearTo || "?"}`);
    if (p.priceFrom || p.priceTo) parts.push(`${p.priceFrom ? Number(p.priceFrom).toLocaleString("pl-PL") : "?"}–${p.priceTo ? Number(p.priceTo).toLocaleString("pl-PL") : "?"} PLN`);
    if (p.mileageTo) parts.push(`do ${Number(p.mileageTo).toLocaleString("pl-PL")} km`);
    if (p.gearbox) parts.push(GEARBOX_TYPES.find(g => g.slug === p.gearbox)?.label ?? p.gearbox);
    if (p.fuelType) parts.push(FUEL_TYPES.find(f => f.slug === p.fuelType)?.label ?? p.fuelType);
    if (p.bodyType) parts.push(BODY_TYPES.find(b => b.slug === p.bodyType)?.label ?? p.bodyType);
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [filter.params]);

  const urlCount = filter.searchUrls?.length ?? 1;
  const portalLabel = filter.portal === "both"    ? "OTO + OLX"
                    : filter.portal === "olx"      ? "OLX"
                    : "Otomoto";
  const portalCls   = filter.portal === "both"    ? "ft-portal-tag--both"
                    : filter.portal === "olx"      ? "ft-portal-tag--olx"
                    : "ft-portal-tag--otomoto";

  return (
    <div className={`filter-card ${isThisRunning ? "filter-card--running" : ""}`}>
      <div className="filter-card-body">
        <div className="filter-card-head">
          <div className="filter-card-name">{filter.name}</div>
          <div className="ft-card-tags">
            <span className={`ft-portal-tag ${portalCls}`}>{portalLabel}</span>
            {urlCount > 1 && (
              <span className="ft-multi-badge">{urlCount} URL</span>
            )}
          </div>
        </div>

        <div className="filter-card-vehicle-label">{vehicleLabel}</div>
        {paramsLabel && <div className="filter-card-params">{paramsLabel}</div>}

        <div className="filter-card-meta">
          {filter.lastRunAt ? (
            <>
              <span className="filter-card-meta-item">
                Ostatnie: <strong>{formatDate(filter.lastRunAt)}</strong>
              </span>
              {filter.lastRunCount != null && (
                <span className="filter-card-meta-item">
                  Znaleziono: <strong>{filter.lastRunCount}</strong>
                </span>
              )}
            </>
          ) : (
            <span className="filter-card-meta-item filter-card-meta-never">
              Nigdy nie uruchomiono
            </span>
          )}
        </div>
      </div>

      <div className="filter-card-actions">
        <button
          type="button"
          className="filter-run-btn"
          onClick={() => onRun(filter)}
          disabled={isJobRunning || (!filter.searchUrl && !filter.searchUrls?.length)}
          title={isJobRunning ? "Inne zadanie jest w toku" : "Uruchom skanowanie"}
        >
          {isThisRunning ? (
            <span className="filter-run-spinner" aria-hidden="true" />
          ) : "▶"}
          <span>{isThisRunning ? "W toku…" : "Uruchom"}</span>
        </button>

        <button
          type="button"
          className={`filter-del-btn ${confirmDelete ? "filter-del-btn--confirm" : ""}`}
          onClick={handleRemove}
          title={confirmDelete ? "Kliknij ponownie aby potwierdzić" : "Usuń filtr"}
        >
          {confirmDelete ? "Potwierdź ✗" : "🗑"}
        </button>
      </div>
    </div>
  );
}

/* ─── FiltersTab (main export) ─────────────────────────────── */
export default function FiltersTab({ filters, isJobRunning, currentJobFilterId, onAdd, onRemove, onRun, me }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="filters-tab">
      <div className="filters-tab-header">
        <div className="filters-tab-title-row">
          <div>
            <div className="section-label">Filtry wyszukiwania</div>
            <div className="filters-tab-desc">
              Skonfiguruj parametry wyszukiwania — aplikacja automatycznie zbuduje URL dla wybranego portalu,
              przeskanuje ogłoszenia i opcjonalnie wykona weryfikację CEPiK.
            </div>
          </div>
          {!showAddForm && (
            <button type="button" className="filter-new-btn" onClick={() => setShowAddForm(true)}>
              + Nowy filtr
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddFilterForm onAdd={onAdd} onClose={() => setShowAddForm(false)} />
      )}

      {!me && (
        <div className="filter-login-note">
          ⚠ Zaloguj się, aby uruchamiać automatyczne skanowanie i zapisywać wyniki.
        </div>
      )}

      {filters.length === 0 && !showAddForm ? (
        <div className="filters-empty">
          <div className="filters-empty-ico">🔍</div>
          <div className="filters-empty-title">Brak zapisanych filtrów</div>
          <div className="filters-empty-desc">
            Kliknij „+ Nowy filtr", aby skonfigurować pierwsze wyszukiwanie.
          </div>
        </div>
      ) : (
        <div className="filter-list">
          {filters.map(f => (
            <FilterCard
              key={f.id}
              filter={f}
              isJobRunning={isJobRunning}
              isThisRunning={isJobRunning && currentJobFilterId === f.id}
              onRun={onRun}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <div className="filter-info-box">
        <div className="filter-info-title">Jak działa automatyczne skanowanie?</div>
        <ol className="filter-info-list">
          <li>Aplikacja buduje URL dla wybranego portalu (Otomoto, OLX lub obu).</li>
          <li>Dla filtrów z wieloma markami — skanuje każdą markę osobno (po kolei).</li>
          <li>Liczba stron jest ustalana automatycznie na podstawie liczby wyników.</li>
          <li>Dla każdego ogłoszenia pobiera dane przez Jina AI i parsuje je.</li>
          <li>Jeśli ogłoszenie na Otomoto zawiera VIN, przeprowadza weryfikację w CEPiK.</li>
          <li>Wyniki trafiają do zakładki „Baza pojazdów".</li>
        </ol>
      </div>
    </div>
  );
}
