import { useState, useCallback, useMemo } from "react";
import {
  OTOMOTO_BRANDS,
  getModelsForBrand,
  PORTALS,
  UNIFIED_BODY_TYPES,
  UNIFIED_FUEL_TYPES,
  UNIFIED_GEARBOX_TYPES,
  buildOlxUrl,
  buildOtomotoUrlFull,
} from "../utils/otomotoData.js";
import { FILTER_TEMPLATES, instantiateTemplate } from "../utils/filterTemplates.js";

/* ─── TemplateGallery ────────────────────────────────────────── */
function TemplateGallery({ onAdd, existingNames }) {
  const [added, setAdded] = useState(new Set());

  const handleAdd = (tpl) => {
    const config = instantiateTemplate(tpl);
    onAdd(config);
    setAdded(prev => new Set([...prev, tpl.id]));
  };

  return (
    <div className="ft-templates">
      <div className="ft-section-title" style={{ marginBottom: 10 }}>
        <span>Szybki start — gotowe konfiguracje</span>
      </div>
      <div className="ft-tpl-grid">
        {FILTER_TEMPLATES.map(tpl => {
          const alreadyAdded = added.has(tpl.id) || existingNames.includes(tpl.label);
          return (
            <button
              key={tpl.id}
              type="button"
              className={`ft-tpl-card ${alreadyAdded ? "ft-tpl-card--added" : ""}`}
              onClick={() => !alreadyAdded && handleAdd(tpl)}
              disabled={alreadyAdded}
              title={alreadyAdded ? "Już dodano" : tpl.description}
            >
              <span className="ft-tpl-emoji" aria-hidden="true">{tpl.emoji}</span>
              <div className="ft-tpl-body">
                <div className="ft-tpl-label">{tpl.label}</div>
                <div className="ft-tpl-desc">{tpl.description}</div>
              </div>
              <div className="ft-tpl-action">
                {alreadyAdded ? "✓" : "+"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── helpers ──────────────────────────────────────────────── */
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
        <button type="button" className="ft-bm-remove" onClick={() => onRemove(index)} title="Usuń markę">✕</button>
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
        <input className="ft-input" type="number" placeholder="od"
          value={values[keyFrom]} onChange={e => onChange(keyFrom, e.target.value)} />
        <span className="ft-range-sep">–</span>
        <input className="ft-input" type="number" placeholder="do"
          value={values[keyTo]} onChange={e => onChange(keyTo, e.target.value)} />
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
          <button key={p.value} type="button"
            className={`ft-portal-btn ${value === p.value ? "ft-portal-btn--active" : ""}`}
            onClick={() => onChange(p.value)}
          >
            {p.value === "otomoto" && <span className="ft-portal-dot ft-portal-dot--otomoto" />}
            {p.value === "olx"     && <span className="ft-portal-dot ft-portal-dot--olx" />}
            {p.value === "both"    && (<><span className="ft-portal-dot ft-portal-dot--otomoto" /><span className="ft-portal-dot ft-portal-dot--olx" /></>)}
            {p.label}
          </button>
        ))}
      </div>
      {value === "both" && (
        <div className="ft-portal-note ft-portal-note--info">
          Każda marka generuje 2 adresy URL — po jednym na portal.
        </div>
      )}
    </div>
  );
}

/* ─── FilterForm — shared by Add and Edit ────────────────────── */
function FilterForm({ initial, onSave, onClose, isEdit }) {
  const [name,     setName]     = useState(initial?.name ?? "");
  const [portal,   setPortal]   = useState(initial?.portal ?? "otomoto");
  const [vehicles, setVehicles] = useState(
    initial?.vehicles?.length ? initial.vehicles : [{ ...EMPTY_VEHICLE_ENTRY }]
  );
  const [params,   setParams]   = useState(
    initial?.params ? { ...EMPTY_PARAMS, ...initial.params } : { ...EMPTY_PARAMS }
  );
  const [err, setErr] = useState(null);

  const updateVehicle = useCallback((idx, patch) => {
    setVehicles(prev => prev.map((v, i) => i === idx ? { ...v, ...patch } : v));
  }, []);

  const addVehicle    = () => { if (vehicles.length < 5) setVehicles(p => [...p, { ...EMPTY_VEHICLE_ENTRY }]); };
  const removeVehicle = (idx) => setVehicles(p => p.filter((_, i) => i !== idx));
  const setParam      = useCallback((key, value) => setParams(p => ({ ...p, [key]: value })), []);

  const buildAllUrlEntries = useCallback(() => {
    const validVehicles = vehicles.filter(v => v.brand);
    const entries = [];
    for (const v of validVehicles) {
      const commonParams = { ...params, brand: v.brand, model: v.model };
      if (portal === "otomoto" || portal === "both")
        entries.push({ url: buildOtomotoUrlFull(commonParams), portal: "otomoto", brand: v.brand, model: v.model });
      if (portal === "olx" || portal === "both")
        entries.push({ url: buildOlxUrl(commonParams), portal: "olx", brand: v.brand, model: v.model });
    }
    return entries;
  }, [vehicles, params, portal]);

  const previewEntries = useMemo(() => buildAllUrlEntries(), [buildAllUrlEntries]);

  const handleSubmit = () => {
    if (!name.trim())                                    { setErr("Podaj nazwę filtru"); return; }
    if (!vehicles.filter(v => v.brand).length)           { setErr("Wybierz co najmniej jedną markę"); return; }
    setErr(null);
    const urlEntries = buildAllUrlEntries();
    const searchUrls = urlEntries.map(e => e.url);
    onSave({
      name: name.trim(),
      portal,
      vehicles: vehicles.filter(v => v.brand),
      params,
      searchUrls,
      searchUrl: searchUrls[0],
    });
    onClose();
  };

  const availableBodyTypes = UNIFIED_BODY_TYPES.filter(b =>
    portal === "otomoto" ? b.otoSlug !== null : portal === "olx" ? b.olxSlug !== null : true
  );
  const availableFuelTypes = UNIFIED_FUEL_TYPES.filter(f =>
    portal === "otomoto" ? f.otoSlug !== null : portal === "olx" ? f.olxSlug !== null : true
  );

  return (
    <div className={`ft-add-form ${isEdit ? "ft-add-form--edit" : ""}`}>
      <div className="ft-add-title">{isEdit ? "Edytuj filtr" : "Nowy filtr wyszukiwania"}</div>

      <div className="ft-field ft-field--full">
        <label className="ft-label">Nazwa filtru</label>
        <input className="ft-input" placeholder="np. Rodzinne kombi, Sportowe coupe do 60k"
          value={name} onChange={e => setName(e.target.value)} maxLength={60} autoFocus />
      </div>

      <PortalToggle value={portal} onChange={setPortal} />

      <div className="ft-section-title">
        <span>Marki i modele</span>
        <span className="ft-section-hint">Każda marka skanowana osobno</span>
      </div>

      <div className="ft-bm-list">
        {vehicles.map((v, i) => (
          <BrandModelRow key={i} entry={v} index={i}
            onUpdate={updateVehicle} onRemove={removeVehicle} showRemove={vehicles.length > 1} />
        ))}
      </div>

      {vehicles.length < 5 && (
        <button type="button" className="ft-add-brand-btn" onClick={addVehicle}>+ Dodaj kolejną markę</button>
      )}

      <div className="ft-section-title" style={{ marginTop: 20 }}><span>Parametry</span></div>

      <div className="ft-params-grid">
        <div className="ft-field">
          <label className="ft-label">Typ nadwozia</label>
          <select className="ft-select" value={params.bodyType} onChange={e => setParam("bodyType", e.target.value)}>
            <option value="">— dowolny —</option>
            {availableBodyTypes.map(b => <option key={b.slug} value={b.slug}>{b.label}</option>)}
          </select>
        </div>
        <div className="ft-field">
          <label className="ft-label">Skrzynia biegów</label>
          <select className="ft-select" value={params.gearbox} onChange={e => setParam("gearbox", e.target.value)}>
            <option value="">— dowolna —</option>
            {UNIFIED_GEARBOX_TYPES.map(g => <option key={g.slug} value={g.slug}>{g.label}</option>)}
          </select>
        </div>
        <div className="ft-field">
          <label className="ft-label">Rodzaj paliwa</label>
          <select className="ft-select" value={params.fuelType} onChange={e => setParam("fuelType", e.target.value)}>
            <option value="">— dowolny —</option>
            {availableFuelTypes.map(f => <option key={f.slug} value={f.slug}>{f.label}</option>)}
          </select>
        </div>
        <RangeField label="Rok produkcji" keyFrom="yearFrom" keyTo="yearTo" values={params} onChange={setParam} />
        <RangeField label="Cena" unit="PLN" keyFrom="priceFrom" keyTo="priceTo" values={params} onChange={setParam} />
        <RangeField label="Przebieg" unit="km" keyFrom="mileageFrom" keyTo="mileageTo" values={params} onChange={setParam} />
        <RangeField label="Moc" unit="KM" keyFrom="powerFrom" keyTo="powerTo" values={params} onChange={setParam} />
      </div>

      {previewEntries.length > 0 && (
        <div className="ft-preview">
          <div className="ft-preview-title">Podgląd adresów URL ({previewEntries.length})</div>
          {previewEntries.map((entry, i) => (
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
          {isEdit ? "Zapisz zmiany" : "Dodaj filtr"}
        </button>
        <button type="button" className="ft-cancel-btn" onClick={onClose}>Anuluj</button>
      </div>
    </div>
  );
}

/* ─── FilterCard ─────────────────────────────────────────────── */
function FilterCard({ filter, isJobRunning, isThisRunning, onRun, onRemove, onUpdate }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing,       setEditing]       = useState(false);

  const handleRemove = () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); return; }
    onRemove(filter.id);
  };

  // When edit is saved: merge the new data with the existing filter record
  // so lastRunAt, lastRunCount and id are preserved
  const handleSaveEdit = useCallback((updates) => {
    onUpdate(filter.id, {
      ...updates,
      // Preserve run history — editing params doesn't wipe the scan record
      lastRunAt:          filter.lastRunAt,
      lastRunCount:       filter.lastRunCount,
      lastRunNewCount:    filter.lastRunNewCount,
      lastRunArchivedCount: filter.lastRunArchivedCount,
    });
  }, [onUpdate, filter]);

  const vehicleLabel = useMemo(() => {
    if (filter.vehicles?.length > 0) {
      return filter.vehicles.map(v => {
        const brand  = OTOMOTO_BRANDS.find(b => b.slug === v.brand);
        const models = getModelsForBrand(v.brand);
        const model  = models.find(m => m.slug === v.model);
        return (model?.label ?? v.model) ? `${brand?.label ?? v.brand} ${model?.label ?? v.model}`.trim() : (brand?.label ?? v.brand);
      }).join(" + ");
    }
    return filter.searchUrl || "Brak URL";
  }, [filter]);

  const paramsLabel = useMemo(() => {
    if (!filter.params) return null;
    const p = filter.params;
    const parts = [];
    if (p.yearFrom  || p.yearTo)    parts.push(`${p.yearFrom || "?"}–${p.yearTo || "?"}`);
    if (p.priceFrom || p.priceTo)   parts.push(`${p.priceFrom ? Number(p.priceFrom).toLocaleString("pl-PL") : "?"}–${p.priceTo ? Number(p.priceTo).toLocaleString("pl-PL") : "?"} PLN`);
    if (p.mileageTo)                parts.push(`do ${Number(p.mileageTo).toLocaleString("pl-PL")} km`);
    if (p.gearbox)                  parts.push(UNIFIED_GEARBOX_TYPES.find(g => g.slug === p.gearbox)?.label ?? p.gearbox);
    if (p.fuelType)                 parts.push(UNIFIED_FUEL_TYPES.find(f => f.slug === p.fuelType)?.label ?? p.fuelType);
    if (p.bodyType)                 parts.push(UNIFIED_BODY_TYPES.find(b => b.slug === p.bodyType)?.label ?? p.bodyType);
    return parts.length ? parts.join(" · ") : null;
  }, [filter.params]);

  const urlCount    = filter.searchUrls?.length ?? 1;
  const portalLabel = filter.portal === "both" ? "OTO + OLX" : filter.portal === "olx" ? "OLX" : "Otomoto";
  const portalCls   = filter.portal === "both" ? "ft-portal-tag--both" : filter.portal === "olx" ? "ft-portal-tag--olx" : "ft-portal-tag--otomoto";

  if (editing) {
    return (
      <FilterForm
        initial={filter}
        isEdit
        onSave={handleSaveEdit}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={`filter-card ${isThisRunning ? "filter-card--running" : ""}`}>
      <div className="filter-card-body">
        <div className="filter-card-head">
          <div className="filter-card-name">{filter.name}</div>
          <div className="ft-card-tags">
            <span className={`ft-portal-tag ${portalCls}`}>{portalLabel}</span>
            {urlCount > 1 && <span className="ft-multi-badge">{urlCount} URL</span>}
          </div>
        </div>

        <div className="filter-card-vehicle-label">{vehicleLabel}</div>
        {paramsLabel && <div className="filter-card-params">{paramsLabel}</div>}

        <div className="filter-card-meta">
          {filter.lastRunAt ? (
            <>
              <span className="filter-card-meta-item">Ostatnie: <strong>{formatDate(filter.lastRunAt)}</strong></span>
              {filter.lastRunCount != null && (
                <span className="filter-card-meta-item">Znaleziono: <strong>{filter.lastRunCount}</strong></span>
              )}
            </>
          ) : (
            <span className="filter-card-meta-item filter-card-meta-never">Nigdy nie uruchomiono</span>
          )}
        </div>
      </div>

      <div className="filter-card-actions">
        <button type="button" className="filter-run-btn"
          onClick={() => onRun(filter)}
          disabled={isJobRunning || (!filter.searchUrl && !filter.searchUrls?.length)}
          title={isJobRunning ? "Inne zadanie jest w toku" : "Uruchom skanowanie"}
        >
          {isThisRunning ? <span className="filter-run-spinner" aria-hidden="true" /> : "▶"}
          <span>{isThisRunning ? "W toku…" : "Uruchom"}</span>
        </button>

        {/* Edit button — opens FilterForm inline */}
        <button type="button" className="filter-edit-btn"
          onClick={() => setEditing(true)}
          title="Edytuj filtr"
        >✎</button>

        <button type="button"
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

/* ─── FiltersTab ────────────────────────────────────────────── */
export default function FiltersTab({
  filters, isJobRunning, currentJobFilterId, onAdd, onRemove, onRun, onUpdate, me,
}) {
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const existingFilterNames = filters.map(f => f.label ?? f.name ?? "");

  return (
    <div className="filters-tab">
      <div className="filters-tab-header">
        <div className="filters-tab-title-row">
          <div>
            <div className="section-label">Filtry wyszukiwania</div>
            <div className="filters-tab-desc">
              Skonfiguruj parametry — aplikacja zbuduje URL dla Otomoto i/lub OLX,
              przeskanuje ogłoszenia i wykona weryfikację CEPiK tam, gdzie dostępny VIN.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {!showAddForm && (
              <>
                <button type="button" className="filter-tpl-btn"
                  onClick={() => setShowTemplates(v => !v)}
                  title="Gotowe konfiguracje">
                  ⚡ Szybki start
                </button>
                <button type="button" className="filter-new-btn" onClick={() => setShowAddForm(true)}>
                  + Nowy filtr
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showTemplates && !showAddForm && (
        <TemplateGallery onAdd={onAdd} existingNames={existingFilterNames} />
      )}

      {showAddForm && (
        <FilterForm onSave={onAdd} onClose={() => setShowAddForm(false)} isEdit={false} />
      )}

      {!me && (
        <div className="filter-login-note">
          ⚠ Zaloguj się, aby uruchamiać automatyczne skanowanie i zapisywać wyniki.
        </div>
      )}

      {filters.length === 0 && !showAddForm && !showTemplates ? (
        <div className="filters-empty">
          <div className="filters-empty-ico">🔍</div>
          <div className="filters-empty-title">Brak zapisanych filtrów</div>
          <div className="filters-empty-desc">
            Kliknij <strong>⚡ Szybki start</strong> aby dodać gotową konfigurację, lub{" "}
            <strong>+ Nowy filtr</strong> aby zbudować własną od podstaw.
          </div>
        </div>
      ) : filters.length > 0 ? (
        <div className="filter-list">
          {filters.map(f => (
            <FilterCard
              key={f.id}
              filter={f}
              isJobRunning={isJobRunning}
              isThisRunning={isJobRunning && currentJobFilterId === f.id}
              onRun={onRun}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : null}

      <div className="filter-info-box">
        <div className="filter-info-title">Jak działa automatyczne skanowanie?</div>
        <ol className="filter-info-list">
          <li>Aplikacja buduje URL dla wybranego portalu (Otomoto, OLX lub obu).</li>
          <li>Filtry są automatycznie tłumaczone na odpowiednie parametry każdego portalu.</li>
          <li>Dla filtrów z wieloma markami — skanuje każdą markę osobno (po kolei).</li>
          <li>Liczba stron jest ustalana automatycznie.</li>
          <li>Dla każdego ogłoszenia pobiera dane przez Jina AI i parsuje je.</li>
          <li>Jeśli ogłoszenie (Otomoto) zawiera VIN, przeprowadza weryfikację w CEPiK.</li>
          <li>Wyniki trafiają do zakładki „Baza pojazdów".</li>
        </ol>
      </div>
    </div>
  );
}
