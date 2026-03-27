import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../api.js";
import {
  normalizeLicensePlate,
  normalizeVin,
  normalizeDateForCepik,
  isValidLicensePlate,
  isValidVin,
} from "../utils/normalize.js";

/* ─── helpers ─────────────────────────────────────────────── */
function getCepikStatus(row) {
  const ver = row.verification;
  if (ver) {
    if (ver.warning_count > 0) return "issues";
    if (ver.ok_count > 0) return "ok";
    return "check";
  }
  const snap = row.snapshot_json || {};
  const plate = row.manual_license_plate || snap.licensePlate;
  const vin = row.manual_vin || snap.vin;
  const fr = row.manual_first_registration || snap.firstRegistration;
  const hasPlate = plate && isValidLicensePlate(normalizeLicensePlate(plate));
  const hasVin = vin && isValidVin(normalizeVin(vin));
  const hasFr = fr && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr));
  if (hasPlate && hasVin && hasFr) return "pending";
  return "no_data";
}

/** Returns list of missing field labels for CEPiK check */
function getMissingCepikFields(row) {
  const snap = row.snapshot_json || {};
  const missing = [];
  const plate = row.manual_license_plate || snap.licensePlate;
  const vin = row.manual_vin || snap.vin;
  const fr = row.manual_first_registration || snap.firstRegistration;

  if (!plate || !isValidLicensePlate(normalizeLicensePlate(plate || ""))) {
    missing.push("nr rej.");
  }
  if (!vin || !isValidVin(normalizeVin(vin || ""))) {
    missing.push("VIN");
  }
  const frNorm = normalizeDateForCepik(fr || "");
  if (!fr || !/^\d{4}-\d{2}-\d{2}$/.test(frNorm)) {
    missing.push("data 1. rej.");
  }
  return missing;
}

function StatusBadge({ status, missingFields }) {
  const map = {
    ok:      { cls: "vdb-badge--ok",      icon: "✓", label: "CEPiK OK" },
    issues:  { cls: "vdb-badge--issues",  icon: "⚠", label: "Uwagi" },
    check:   { cls: "vdb-badge--check",   icon: "?", label: "Sprawdź" },
    no_data: { cls: "vdb-badge--nodata",  icon: "✗", label: "Brak danych" },
    pending: { cls: "vdb-badge--pending", icon: "○", label: "Nie zwerif." },
  };
  const { cls, icon, label } = map[status] || map.no_data;
  const title = status === "no_data" && missingFields?.length > 0
    ? `Brakuje: ${missingFields.join(", ")}`
    : label;

  return (
    <div className={`vdb-badge ${cls}`} title={title}>
      <span className="vdb-badge-icon">{icon}</span>
      <span className="vdb-badge-label">{label}</span>
      {status === "no_data" && missingFields?.length > 0 && (
        <span className="vdb-badge-missing">({missingFields.join(", ")})</span>
      )}
    </div>
  );
}

/* ─── VehicleRow (expanded) ─────────────────────────────────── */
function VehicleRow({ row, onOpen, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const snap = row.snapshot_json || {};
  const img = snap.images?.[0];
  const title = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";
  const cepikStatus = getCepikStatus(row);
  const missingFields = cepikStatus === "no_data" ? getMissingCepikFields(row) : [];
  const filterName = snap.__filterName;

  const specParts = [];
  if (snap.mileage) specParts.push(`${Number(snap.mileage).toLocaleString("pl-PL")} km`);
  if (snap.enginePower) specParts.push(`${snap.enginePower} KM`);
  if (snap.fuelType) specParts.push(snap.fuelType);
  if (snap.transmission) specParts.push(snap.transmission);

  const price = snap.price;

  const effPlate = row.manual_license_plate ?? snap.licensePlate ?? null;
  const effVin = row.manual_vin ?? snap.vin ?? null;
  const effFirstReg = row.manual_first_registration ?? snap.firstRegistration ?? null;

  return (
    <div className={`vdb-row ${expanded ? "vdb-row--expanded" : ""}`}>
      {/* ── main row ── */}
      <div className="vdb-row-main" onClick={() => setExpanded(v => !v)}>
        <div className="vdb-row-img-wrap">
          {img
            ? <img src={img} alt="" className="vdb-row-img" loading="lazy" />
            : <div className="vdb-row-img vdb-row-img--empty">VX</div>
          }
        </div>

        <div className="vdb-row-info">
          <div className="vdb-row-title">{title}</div>
          {specParts.length > 0 && (
            <div className="vdb-row-sub">{specParts.join(" · ")}</div>
          )}
          {filterName && (
            <div className="vdb-row-filter">📁 {filterName}</div>
          )}
          <div className="vdb-row-date">
            {new Date(row.created_at).toLocaleDateString("pl-PL")}
          </div>
        </div>

        <div className="vdb-row-price-wrap">
          {price != null && (
            <div className="vdb-row-price">
              {Number(price).toLocaleString("pl-PL")}
              <span className="vdb-row-cur"> {snap.currency || "PLN"}</span>
            </div>
          )}
          <StatusBadge status={cepikStatus} missingFields={missingFields} />
        </div>

        <div className="vdb-row-actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="vdb-act-btn vdb-act-btn--expand"
            onClick={() => setExpanded(v => !v)}
            title={expanded ? "Zwiń" : "Rozwiń szczegóły"}
          >
            {expanded ? "▲" : "▼"}
          </button>
          <button
            type="button"
            className="vdb-act-btn vdb-act-btn--open"
            onClick={() => onOpen(row.id)}
            title="Otwórz ogłoszenie"
          >
            ➔
          </button>
          <button
            type="button"
            className="vdb-act-btn vdb-act-btn--del"
            onClick={() => onDelete(row.id)}
            title="Usuń z bazy"
          >
            🗑
          </button>
        </div>
      </div>

      {/* ── expanded details ── */}
      {expanded && (
        <div className="vdb-row-details">
          {/* Images strip */}
          {snap.images?.length > 1 && (
            <div className="vdb-detail-imgs">
              {snap.images.slice(0, 6).map((img2, i) => (
                <img key={i} src={img2} alt="" className="vdb-detail-img" loading="lazy" />
              ))}
            </div>
          )}

          {/* Specs grid */}
          <div className="vdb-detail-specs">
            {[
              { lbl: "Rok", val: snap.year },
              { lbl: "Przebieg", val: snap.mileage != null ? `${Number(snap.mileage).toLocaleString("pl-PL")} km` : null },
              { lbl: "Moc", val: snap.enginePower != null ? `${snap.enginePower} KM` : null },
              { lbl: "Pojemność", val: snap.engineDisplacement != null ? `${Number(snap.engineDisplacement).toLocaleString("pl-PL")} cm³` : null },
              { lbl: "Paliwo", val: snap.fuelType },
              { lbl: "Skrzynia", val: snap.transmission },
              { lbl: "Napęd", val: snap.drivetrain },
              { lbl: "Nadwozie", val: snap.bodyType },
              { lbl: "Kraj", val: snap.countryOfOrigin },
            ].map(({ lbl, val }) => val != null && val !== "" ? (
              <div key={lbl} className="vdb-detail-spec">
                <div className="vdb-detail-spec-lbl">{lbl}</div>
                <div className="vdb-detail-spec-val">{val}</div>
              </div>
            ) : null)}
          </div>

          {/* CEPiK fields */}
          <div className="vdb-detail-cepik">
            <div className="vdb-detail-cepik-title">Dane do CEPiK</div>
            <div className="vdb-detail-cepik-fields">
              <CepikFieldDisplay
                label="Tablice"
                value={effPlate}
                normalized={effPlate ? normalizeLicensePlate(effPlate) : null}
                isValid={effPlate ? isValidLicensePlate(normalizeLicensePlate(effPlate)) : false}
                missing={!effPlate || !isValidLicensePlate(normalizeLicensePlate(effPlate || ""))}
              />
              <CepikFieldDisplay
                label="VIN"
                value={effVin}
                normalized={effVin ? normalizeVin(effVin) : null}
                isValid={effVin ? isValidVin(normalizeVin(effVin)) : false}
                missing={!effVin || !isValidVin(normalizeVin(effVin || ""))}
              />
              <CepikFieldDisplay
                label="1. rejestracja"
                value={effFirstReg}
                normalized={effFirstReg ? normalizeDateForCepik(effFirstReg) : null}
                isValid={effFirstReg ? /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(effFirstReg)) : false}
                missing={!effFirstReg || !/^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(effFirstReg || ""))}
              />
            </div>

            {/* CEPiK verification summary */}
            {row.verification && (
              <div className="vdb-detail-ver-summary">
                <span className="vdb-detail-ver-ok">✓ {row.verification.ok_count} zgodnych</span>
                {row.verification.warning_count > 0 && (
                  <span className="vdb-detail-ver-warn">⚠ {row.verification.warning_count} rozbieżności</span>
                )}
                {row.verification.created_at && (
                  <span className="vdb-detail-ver-date">
                    {new Date(row.verification.created_at).toLocaleDateString("pl-PL")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Seller / location */}
          {(snap.seller || snap.location) && (
            <div className="vdb-detail-meta">
              {snap.seller && <span>👤 {snap.seller}</span>}
              {snap.location && <span>📍 {snap.location}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CepikFieldDisplay({ label, value, normalized, isValid, missing }) {
  return (
    <div className={`vdb-cepik-field ${missing ? "vdb-cepik-field--missing" : isValid ? "vdb-cepik-field--ok" : ""}`}>
      <div className="vdb-cepik-field-lbl">{label}</div>
      <div className="vdb-cepik-field-val">
        {normalized || value || <span className="vdb-cepik-field-nil">brak</span>}
        {missing && <span className="vdb-cepik-field-warn">⚠</span>}
        {!missing && isValid && <span className="vdb-cepik-field-ok-ico">✓</span>}
      </div>
    </div>
  );
}

/* ─── Group header ─────────────────────────────────────────── */
function FilterGroupHeader({ name, count }) {
  return (
    <div className="vdb-group-header">
      <span className="vdb-group-name">{name || "Inne"}</span>
      <span className="vdb-group-count">{count}</span>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export default function VehicleDatabaseTab({ me, onOpenItem }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [groupByFilter, setGroupByFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadVehicles = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const res = await apiFetch("/searches");
      if (res.ok) {
        const all = await res.json();
        setVehicles(all.filter(r => r.snapshot_json?.__source === "auto"));
      }
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Usunąć ten pojazd z bazy?")) return;
    const res = await apiFetch(`/searches/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  }, []);

  const handleOpen = useCallback((id) => {
    onOpenItem?.(id);
  }, [onOpenItem]);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => {
        const snap = v.snapshot_json || {};
        const title = [snap.brand, snap.model, snap.year, snap.__filterName].filter(Boolean).join(" ").toLowerCase();
        return title.includes(q);
      });
    }
    if (filter !== "all") {
      list = list.filter(v => getCepikStatus(v) === filter);
    }
    return list;
  }, [vehicles, filter, searchQuery]);

  const grouped = useMemo(() => {
    if (!groupByFilter) return null;
    const groups = {};
    for (const v of filtered) {
      const key = v.snapshot_json?.__filterName || "__none";
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], "pl"));
  }, [filtered, groupByFilter]);

  const counts = useMemo(() => {
    const c = { ok: 0, issues: 0, check: 0, no_data: 0, pending: 0 };
    for (const v of vehicles) {
      const s = getCepikStatus(v);
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [vehicles]);

  if (!me) {
    return (
      <div className="vdb-tab">
        <div className="vdb-login-note">Zaloguj się, aby korzystać z bazy pojazdów.</div>
      </div>
    );
  }

  return (
    <div className="vdb-tab">
      {/* ─── Header ─── */}
      <div className="vdb-header">
        <div>
          <div className="section-label">Baza pojazdów</div>
          <div className="vdb-total">{vehicles.length} pojazdów z automatycznego skanowania</div>
        </div>
        <button
          type="button"
          className="vdb-refresh-btn"
          onClick={loadVehicles}
          disabled={loading}
          title="Odśwież"
        >
          {loading ? "…" : "↻"}
        </button>
      </div>

      {/* ─── Status pills ─── */}
      {vehicles.length > 0 && (
        <div className="vdb-summary">
          {[
            { key: "all",     label: "Wszystkie",  val: vehicles.length },
            { key: "ok",      label: "CEPiK OK",   val: counts.ok },
            { key: "issues",  label: "Uwagi",       val: counts.issues },
            { key: "pending", label: "Nie zwerif.", val: counts.pending },
            { key: "no_data", label: "Brak danych", val: counts.no_data },
          ].map(({ key, label, val }) => (
            <button
              key={key}
              type="button"
              className={`vdb-filter-pill ${filter === key ? "vdb-filter-pill--active" : ""} vdb-filter-pill--${key}`}
              onClick={() => setFilter(key)}
            >
              <span>{label}</span>
              <span className="vdb-pill-count">{val}</span>
            </button>
          ))}
        </div>
      )}

      {/* ─── Controls ─── */}
      {vehicles.length > 0 && (
        <div className="vdb-controls">
          <input
            className="vdb-search"
            placeholder="Szukaj marki, modelu, filtru…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className={`vdb-group-toggle ${groupByFilter ? "vdb-group-toggle--active" : ""}`}
            onClick={() => setGroupByFilter(v => !v)}
            title="Grupuj według filtru"
          >
            ≡ Grupuj
          </button>
        </div>
      )}

      {/* ─── Content ─── */}
      {loading ? (
        <div className="vdb-loading">
          <div className="vdb-loading-spin" />
          <span>Ładowanie bazy pojazdów…</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="vdb-empty">
          <div className="vdb-empty-ico">🚗</div>
          <div className="vdb-empty-title">Baza pojazdów jest pusta</div>
          <div className="vdb-empty-desc">
            Przejdź do zakładki <strong>Filtry</strong>, skonfiguruj wyszukiwanie i uruchom skanowanie.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vdb-empty">
          <div className="vdb-empty-title">Brak wyników dla wybranych filtrów</div>
        </div>
      ) : grouped ? (
        grouped.map(([groupKey, items]) => (
          <div key={groupKey} className="vdb-group">
            <FilterGroupHeader name={groupKey === "__none" ? "Bez filtru" : groupKey} count={items.length} />
            <div className="vdb-list">
              {items.map(row => (
                <VehicleRow key={row.id} row={row} onOpen={handleOpen} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="vdb-list">
          {filtered.map(row => (
            <VehicleRow key={row.id} row={row} onOpen={handleOpen} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
