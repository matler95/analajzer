import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "../api.js";
import {
  normalizeLicensePlate, normalizeVin, normalizeDateForCepik,
  isValidLicensePlate, isValidVin,
} from "../utils/normalize.js";

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function getCepikStatus(row) {
  const ver = row.verification;
  if (ver) {
    if (ver.warning_count > 0) return "issues";
    if (ver.ok_count > 0) return "ok";
    return "check";
  }
  const snap = row.snapshot_json || {};
  const plate = row.manual_license_plate || snap.licensePlate;
  const vin   = row.manual_vin || snap.vin;
  const fr    = row.manual_first_registration || snap.firstRegistration;
  const ok    = plate && isValidLicensePlate(normalizeLicensePlate(plate))
             && vin   && isValidVin(normalizeVin(vin))
             && fr    && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr));
  return ok ? "pending" : "no_data";
}

function getMissingCepikFields(row) {
  const snap = row.snapshot_json || {};
  const missing = [];
  const plate = row.manual_license_plate || snap.licensePlate;
  const vin   = row.manual_vin || snap.vin;
  const fr    = row.manual_first_registration || snap.firstRegistration;
  if (!plate || !isValidLicensePlate(normalizeLicensePlate(plate || ""))) missing.push("nr rej.");
  if (!vin   || !isValidVin(normalizeVin(vin || "")))                     missing.push("VIN");
  if (!fr    || !/^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr || ""))) missing.push("data 1. rej.");
  return missing;
}

/** Compute group-level stats: price, mileage, per generation */
function computeGroupStats(rows) {
  const prices   = rows.map(r => r.snapshot_json?.price).filter(v => v > 0);
  const mileages = rows.map(r => r.snapshot_json?.mileage).filter(v => v > 0);

  const avg   = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const med   = arr => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };
  const min  = arr => arr.length ? Math.min(...arr) : null;
  const max  = arr => arr.length ? Math.max(...arr) : null;

  // Group by generation field parsed from otomoto Generacja spec
  const byGen = {};
  rows.forEach(r => {
    const gen = r.snapshot_json?.generation || "Nieznana generacja";
    if (!byGen[gen]) byGen[gen] = [];
    byGen[gen].push(r);
  });

  const generations = Object.entries(byGen).map(([genName, genRows]) => {
    const gPrices   = genRows.map(r => r.snapshot_json?.price).filter(v => v > 0);
    const gMileages = genRows.map(r => r.snapshot_json?.mileage).filter(v => v > 0);
    return {
      name: genName, count: genRows.length,
      avgPrice: avg(gPrices), medPrice: med(gPrices),
      avgMileage: avg(gMileages), minMileage: min(gMileages), maxMileage: max(gMileages),
    };
  });

  return {
    count:       rows.length,
    avgPrice:    avg(prices),
    medPrice:    med(prices),
    minPrice:    min(prices),
    maxPrice:    max(prices),
    avgMileage:  avg(mileages),
    minMileage:  min(mileages),
    maxMileage:  max(mileages),
    generations: generations.sort((a, b) => b.count - a.count),
  };
}

/** Deal badge: compare price and mileage against group medians */
function getDealBadge(row, stats) {
  if (!stats) return null;
  const price   = row.snapshot_json?.price;
  const mileage = row.snapshot_json?.mileage;
  if (!price && !mileage) return null;

  const priceScore   = price   && stats.medPrice   ? (stats.medPrice - price)   / stats.medPrice   : 0;
  const mileageScore = mileage && stats.avgMileage ? (stats.avgMileage - mileage) / stats.avgMileage : 0;
  const score = priceScore * 0.6 + mileageScore * 0.4;

  if (score > 0.15) return { cls: "deal-badge--great",  label: "Świetna okazja", icon: "🔥" };
  if (score > 0.05) return { cls: "deal-badge--good",   label: "Dobra cena",     icon: "✓" };
  if (score < -0.15) return { cls: "deal-badge--pricey", label: "Powyżej rynku",  icon: "↑" };
  return { cls: "deal-badge--avg", label: "Cena rynkowa", icon: "≈" };
}

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("pl-PL");
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════ */
function StatusBadge({ status, missingFields }) {
  const MAP = {
    ok:      { cls: "vdb-badge--ok",      icon: "✓", label: "CEPiK OK"    },
    issues:  { cls: "vdb-badge--issues",  icon: "⚠", label: "Uwagi"       },
    check:   { cls: "vdb-badge--check",   icon: "?", label: "Sprawdź"     },
    no_data: { cls: "vdb-badge--nodata",  icon: "✗", label: "Brak danych" },
    pending: { cls: "vdb-badge--pending", icon: "○", label: "Nie zwerif." },
  };
  const { cls, icon, label } = MAP[status] || MAP.no_data;
  const title = status === "no_data" && missingFields?.length
    ? `Brakuje: ${missingFields.join(", ")}` : label;
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

/* ═══════════════════════════════════════════════════════════
   INLINE FIELD EDITOR (reusable, like HistoryDrawer)
   ═══════════════════════════════════════════════════════════ */
function InlineField({ label, value, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  const [err, setErr]         = useState(null);

  const normalize = useCallback((v) => {
    if (fieldKey === "vin")              return normalizeVin(v);
    if (fieldKey === "licensePlate")     return normalizeLicensePlate(v);
    if (fieldKey === "firstRegistration") return normalizeDateForCepik(v);
    return v.trim();
  }, [fieldKey]);

  const validate = useCallback((v) => {
    if (fieldKey === "vin")              return isValidVin(v);
    if (fieldKey === "licensePlate")     return isValidLicensePlate(v);
    if (fieldKey === "firstRegistration") return /^\d{4}-\d{2}-\d{2}$/.test(v);
    return true;
  }, [fieldKey]);

  const startEdit = () => {
    setDraft(value ? normalize(value) : "");
    setErr(null);
    setEditing(true);
  };

  const save = async () => {
    const n = normalize(draft);
    if (draft && !validate(n)) { setErr("Niepoprawna wartość"); return; }
    const res = await onSave(n || null);
    if (res?.error) { setErr(res.error); return; }
    setEditing(false);
  };

  const displayVal = value ? normalize(value) : null;
  const isOk = displayVal && validate(displayVal);

  return (
    <div className="vdb-inline-field">
      <div className="vdb-inline-field-lbl">{label}</div>
      {editing ? (
        <div className="vdb-inline-edit">
          <input
            className="vdb-inline-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            {...(fieldKey === "firstRegistration" ? { type: "date" } : {})}
            maxLength={fieldKey === "vin" ? 17 : 20}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          />
          <button type="button" className="vdb-inline-save" onClick={save}>✓</button>
          <button type="button" className="vdb-inline-cancel" onClick={() => setEditing(false)}>✕</button>
          {err && <span className="vdb-inline-err">{err}</span>}
        </div>
      ) : (
        <button
          type="button"
          className={`vdb-inline-val ${!displayVal ? "nil" : isOk ? "ok" : "warn"}`}
          onClick={startEdit}
          title="Kliknij aby edytować"
        >
          <span className="vdb-inline-edit-ico">✎</span>
          {displayVal || "brak"}
          {displayVal && (isOk
            ? <span className="vdb-inline-status ok">✓</span>
            : <span className="vdb-inline-status warn">⚠</span>)}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VEHICLE ROW
   ═══════════════════════════════════════════════════════════ */
function VehicleRow({ row, onOpen, onDelete, onPatch, onVerify, stats, verifyBusy }) {
  const [expanded, setExpanded] = useState(false);
  const snap   = row.snapshot_json || {};
  const img    = snap.images?.[0];
  const title  = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";
  const cepikStatus  = getCepikStatus(row);
  const missingFields = cepikStatus === "no_data" ? getMissingCepikFields(row) : [];
  const dealBadge    = getDealBadge(row, stats);
  const isNew        = snap.__isNew === true;
  const isArchived   = snap.__archived === true;
  const priceDiff    = snap.__priceDiff;
  const priceHistory = snap.__priceHistory || [];

  const effPlate   = row.manual_license_plate  ?? snap.licensePlate   ?? null;
  const effVin     = row.manual_vin            ?? snap.vin            ?? null;
  const effFirstReg = row.manual_first_registration ?? snap.firstRegistration ?? null;
  const canVerify  = Boolean(
    effPlate && isValidLicensePlate(normalizeLicensePlate(effPlate)) &&
    effVin   && isValidVin(normalizeVin(effVin)) &&
    effFirstReg && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(effFirstReg))
  );

  const specParts = [];
  if (snap.mileage)  specParts.push(`${fmt(snap.mileage)} km`);
  if (snap.enginePower) specParts.push(`${snap.enginePower} KM`);
  if (snap.fuelType)    specParts.push(snap.fuelType);
  if (snap.transmission) specParts.push(snap.transmission);

  const handleSaveField = useCallback(async (apiKey, val) => {
    const res = await onPatch(row.id, apiKey, val);
    return res;
  }, [onPatch, row.id]);

  return (
    <div className={`vdb-row ${expanded ? "vdb-row--expanded" : ""} ${isArchived ? "vdb-row--archived" : ""}`}>
      {/* ── main row ── */}
      <div className="vdb-row-main">
        {/* Clickable image/title area */}
        <div className="vdb-row-click" onClick={() => setExpanded(v => !v)}>
          <div className="vdb-row-img-wrap">
            {img
              ? <img src={img} alt="" className="vdb-row-img" loading="lazy" />
              : <div className="vdb-row-img vdb-row-img--empty">VX</div>}
            {isNew     && <span className="vdb-row-flag new">NOWY</span>}
            {isArchived && <span className="vdb-row-flag archived">ARCHIWUM</span>}
          </div>

          <div className="vdb-row-info">
            <div className="vdb-row-title">{title}</div>
            {specParts.length > 0 && (
              <div className="vdb-row-sub">{specParts.join(" · ")}</div>
            )}
            {snap.__filterName && (
              <div className="vdb-row-filter">📁 {snap.__filterName}</div>
            )}
            <div className="vdb-row-date">
              {new Date(row.created_at).toLocaleDateString("pl-PL")}
            </div>
          </div>
        </div>

        <div className="vdb-row-right">
          <div className="vdb-row-price-col">
            {snap.price != null && (
              <>
                <div className="vdb-row-price">
                  {fmt(snap.price)}
                  <span className="vdb-row-cur"> {snap.currency || "PLN"}</span>
                </div>
                {priceDiff != null && (
                  <div className={`vdb-price-diff ${priceDiff < 0 ? "down" : "up"}`}>
                    {priceDiff < 0 ? "▼" : "▲"} {fmt(Math.abs(priceDiff))} PLN
                    {priceHistory.length > 0 && (
                      <span className="vdb-price-prev" title={`Poprzednia: ${fmt(priceHistory[priceHistory.length - 1]?.price)} PLN`}>
                        (było {fmt(priceHistory[priceHistory.length - 1]?.price)})
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
            {dealBadge && (
              <div className={`deal-badge ${dealBadge.cls}`}>
                {dealBadge.icon} {dealBadge.label}
              </div>
            )}
          </div>

          <div className="vdb-row-badges">
            <StatusBadge status={cepikStatus} missingFields={missingFields} />
          </div>

          <div className="vdb-row-actions">
            <button
              type="button"
              className="vdb-act-btn vdb-act-btn--expand"
              onClick={() => setExpanded(v => !v)}
              title={expanded ? "Zwiń" : "Rozwiń"}
            >{expanded ? "▲" : "▼"}</button>
            <button
              type="button"
              className="vdb-act-btn vdb-act-btn--open"
              onClick={() => onOpen(row.id)}
              title="Otwórz"
            >➔</button>
            <button
              type="button"
              className="vdb-act-btn vdb-act-btn--del"
              onClick={() => onDelete(row.id)}
              title="Usuń"
            >🗑</button>
          </div>
        </div>
      </div>

      {/* ── expanded ── */}
      {expanded && (
        <div className="vdb-row-details">
          {/* Image strip */}
          {snap.images?.length > 1 && (
            <div className="vdb-detail-imgs">
              {snap.images.slice(0, 8).map((u, i) => (
                <img key={i} src={u} alt="" className="vdb-detail-img" loading="lazy" />
              ))}
            </div>
          )}

          {/* Specs */}
          <div className="vdb-detail-specs">
            {[
              { lbl: "Rok",       val: snap.year },
              { lbl: "Przebieg",  val: snap.mileage  != null ? `${fmt(snap.mileage)} km`  : null },
              { lbl: "Moc",       val: snap.enginePower != null ? `${snap.enginePower} KM` : null },
              { lbl: "Pojemność", val: snap.engineDisplacement != null ? `${fmt(snap.engineDisplacement)} cm³` : null },
              { lbl: "Paliwo",    val: snap.fuelType },
              { lbl: "Skrzynia",  val: snap.transmission },
              { lbl: "Napęd",     val: snap.drivetrain },
              { lbl: "Nadwozie",  val: snap.bodyType },
              { lbl: "Kraj",      val: snap.countryOfOrigin },
              { lbl: "Generacja", val: snap.generation || null },
            ].filter(s => s.val != null && s.val !== "").map(({ lbl, val }) => (
              <div key={lbl} className="vdb-detail-spec">
                <div className="vdb-detail-spec-lbl">{lbl}</div>
                <div className="vdb-detail-spec-val">{val}</div>
              </div>
            ))}
          </div>

          {/* Price history */}
          {priceHistory.length > 0 && (
            <div className="vdb-detail-price-hist">
              <div className="vdb-detail-section-title">Historia ceny</div>
              <div className="vdb-price-hist-list">
                {priceHistory.map((ph, i) => (
                  <div key={i} className="vdb-price-hist-item">
                    <span className="vdb-price-hist-price">{fmt(ph.price)} PLN</span>
                    {ph.recordedAt && (
                      <span className="vdb-price-hist-date">
                        {new Date(ph.recordedAt).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </div>
                ))}
                <div className="vdb-price-hist-item current">
                  <span className="vdb-price-hist-price">{fmt(snap.price)} PLN</span>
                  <span className="vdb-price-hist-date">teraz</span>
                </div>
              </div>
            </div>
          )}

          {/* CEPiK edit fields */}
          <div className="vdb-detail-cepik">
            <div className="vdb-detail-cepik-header">
              <div className="vdb-detail-cepik-title">Dane do CEPiK</div>
              {missingFields.length > 0 && (
                <div className="vdb-cepik-missing-alert">
                  Brakuje: <strong>{missingFields.join(", ")}</strong> — weryfikacja niemożliwa
                </div>
              )}
            </div>
            <div className="vdb-detail-cepik-fields">
              <InlineField
                label="Nr rejestracyjny"
                value={effPlate}
                fieldKey="licensePlate"
                onSave={val => handleSaveField("manual_license_plate", val)}
              />
              <InlineField
                label="VIN"
                value={effVin}
                fieldKey="vin"
                onSave={val => handleSaveField("manual_vin", val)}
              />
              <InlineField
                label="Data 1. rejestracji"
                value={effFirstReg}
                fieldKey="firstRegistration"
                onSave={val => handleSaveField("manual_first_registration", val)}
              />
            </div>

            <div className="vdb-detail-cepik-actions">
              <button
                type="button"
                className={`vdb-verify-btn ${canVerify ? "" : "disabled"}`}
                disabled={!canVerify || verifyBusy}
                onClick={() => canVerify && onVerify(row)}
                title={canVerify ? "Weryfikuj w CEPiK" : `Brakuje: ${missingFields.join(", ")}`}
              >
                {verifyBusy ? "Weryfikuję…" : "🔎 Weryfikuj w CEPiK"}
              </button>
              {!canVerify && missingFields.length > 0 && (
                <span className="vdb-verify-hint">
                  Uzupełnij: {missingFields.join(", ")}
                </span>
              )}
            </div>

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

          {/* Seller/location */}
          {(snap.seller || snap.location) && (
            <div className="vdb-detail-meta">
              {snap.seller  && <span>👤 {snap.seller}</span>}
              {snap.location && <span>📍 {snap.location}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GROUP STATS PANEL
   ═══════════════════════════════════════════════════════════ */
function GroupStats({ stats, filter }) {
  const [showGens, setShowGens] = useState(false);
  if (!stats || stats.count === 0) return null;
  const lastRunAt = filter?.lastRunAt;
  return (
    <div className="vdb-group-stats">
      <div className="vdb-group-stats-row">
        <div className="vdb-stat-tile">
          <div className="vdb-stat-tile-lbl">Śr. cena</div>
          <div className="vdb-stat-tile-val">{fmt(stats.avgPrice)} PLN</div>
        </div>
        <div className="vdb-stat-tile">
          <div className="vdb-stat-tile-lbl">Mediana ceny</div>
          <div className="vdb-stat-tile-val">{fmt(stats.medPrice)} PLN</div>
        </div>
        <div className="vdb-stat-tile">
          <div className="vdb-stat-tile-lbl">Zakres cen</div>
          <div className="vdb-stat-tile-val">{fmt(stats.minPrice)}–{fmt(stats.maxPrice)}</div>
        </div>
        <div className="vdb-stat-tile">
          <div className="vdb-stat-tile-lbl">Śr. przebieg</div>
          <div className="vdb-stat-tile-val">{fmt(stats.avgMileage)} km</div>
        </div>
        <div className="vdb-stat-tile">
          <div className="vdb-stat-tile-lbl">Min/max przebieg</div>
          <div className="vdb-stat-tile-val">{fmt(stats.minMileage)}–{fmt(stats.maxMileage)} km</div>
        </div>
        {lastRunAt && (
          <div className="vdb-stat-tile">
            <div className="vdb-stat-tile-lbl">Ostatni skan</div>
            <div className="vdb-stat-tile-val" style={{ fontSize: 10 }}>
              {new Date(lastRunAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}
      </div>

      {stats.generations?.length > 1 && (
        <>
          <button
            type="button"
            className="vdb-gens-toggle"
            onClick={() => setShowGens(v => !v)}
          >
            {showGens ? "▲" : "▼"} Statystyki wg generacji ({stats.generations.length})
          </button>
          {showGens && (
            <div className="vdb-gens-table">
              <div className="vdb-gens-header">
                <span>Generacja</span><span>Szt.</span><span>Śr. cena</span>
                <span>Mediana</span><span>Śr. przebieg</span>
              </div>
              {stats.generations.map((g, i) => (
                <div key={i} className="vdb-gens-row">
                  <span className="vdb-gens-name">{g.name}</span>
                  <span>{g.count}</span>
                  <span>{fmt(g.avgPrice)} PLN</span>
                  <span>{fmt(g.medPrice)} PLN</span>
                  <span>{fmt(g.avgMileage)} km</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER GROUP SECTION (collapsible)
   ═══════════════════════════════════════════════════════════ */
function FilterGroup({
  groupKey, items, filter, onOpen, onDelete, onPatch, onVerify, verifyBusy,
  activeStatusFilter, searchQuery,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => computeGroupStats(items), [items]);

  const newCount      = items.filter(r => r.snapshot_json?.__isNew).length;
  const archivedCount = items.filter(r => r.snapshot_json?.__archived).length;
  const issuesCount   = items.filter(r => getCepikStatus(r) === "issues").length;

  const displayName = groupKey === "__manual"
    ? "📋 Ręczne wyszukiwanie"
    : groupKey === "__none"
      ? "Bez filtru"
      : groupKey;

  return (
    <div className={`vdb-filter-group ${collapsed ? "vdb-filter-group--collapsed" : ""}`}>
      {/* Group header — always visible */}
      <div className="vdb-filter-group-hdr" onClick={() => setCollapsed(v => !v)}>
        <div className="vdb-filter-group-hdr-left">
          <span className="vdb-filter-group-chevron">{collapsed ? "▶" : "▼"}</span>
          <span className="vdb-filter-group-name">{displayName}</span>
          <span className="vdb-filter-group-count">{items.length}</span>
          {newCount > 0 && (
            <span className="vdb-filter-group-badge new">{newCount} nowych</span>
          )}
          {archivedCount > 0 && (
            <span className="vdb-filter-group-badge archived">{archivedCount} archiwum</span>
          )}
          {issuesCount > 0 && (
            <span className="vdb-filter-group-badge issues">{issuesCount} uwag</span>
          )}
        </div>
        {collapsed && stats.avgPrice && (
          <div className="vdb-filter-group-collapsed-meta">
            śr. {fmt(stats.avgPrice)} PLN · {fmt(stats.avgMileage)} km
            {filter?.lastRunAt && (
              <span> · {new Date(filter.lastRunAt).toLocaleDateString("pl-PL")}</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {!collapsed && (
        <>
          <GroupStats stats={stats} filter={filter} />
          <div className="vdb-list">
            {items.map(row => (
              <VehicleRow
                key={row.id}
                row={row}
                onOpen={onOpen}
                onDelete={onDelete}
                onPatch={onPatch}
                onVerify={onVerify}
                stats={stats}
                verifyBusy={verifyBusy[row.id]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function VehicleDatabaseTab({ me, onOpenItem, filters = [] }) {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [verifyBusy, setVerifyBusy]     = useState({});

  const loadVehicles = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const res = await apiFetch("/searches");
      if (res.ok) setVehicles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  // Handle manual saves (from search tab) → they go to "manual" group
  // When a search is saved without __source, mark it "manual"
  const ensureManualSource = useCallback(async (row) => {
    if (!row.snapshot_json?.__source) {
      await apiFetch(`/searches/${row.id}`, {
        method: "PATCH",
        body: {
          snapshot_json: {
            ...row.snapshot_json,
            __source: "manual",
            __isNew: false,
          },
        },
      });
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Usunąć ten pojazd z bazy?")) return;
    const res = await apiFetch(`/searches/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  }, []);

  const handleOpen = useCallback((id) => { onOpenItem?.(id); }, [onOpenItem]);

  const handlePatch = useCallback(async (id, key, val) => {
    const res = await apiFetch(`/searches/${id}`, {
      method: "PATCH",
      body: { [key]: val },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { error: j.detail || "Nie udało się zapisać" };
    }
    // Refresh the row in local state
    const updated = await apiFetch(`/searches/${id}`);
    if (updated.ok) {
      const row = await updated.json();
      setVehicles(prev => prev.map(v => v.id === id ? row : v));
    }
    return { ok: true };
  }, []);

  const handleVerify = useCallback(async (row) => {
    const snap  = row.snapshot_json || {};
    const plate = normalizeLicensePlate(row.manual_license_plate || snap.licensePlate || "");
    const vin   = normalizeVin(row.manual_vin || snap.vin || "");
    const fr    = normalizeDateForCepik(row.manual_first_registration || snap.firstRegistration || "");

    setVerifyBusy(b => ({ ...b, [row.id]: true }));
    try {
      const res = await apiFetch("/cepik/verify", {
        method: "POST",
        body: {
          search_id: row.id,
          registration_number: plate,
          vin_number: vin,
          first_registration_date: fr,
          listing_snapshot: snap,
          force_refresh: false,
        },
      });
      if (res.ok) {
        // Refresh row
        const updated = await apiFetch(`/searches/${row.id}`);
        if (updated.ok) {
          const updRow = await updated.json();
          setVehicles(prev => prev.map(v => v.id === row.id ? updRow : v));
        }
      }
    } finally {
      setVerifyBusy(b => ({ ...b, [row.id]: false }));
    }
  }, []);

  // ── Filtering & grouping ────────────────────────────────
  const filtered = useMemo(() => {
    let list = vehicles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => {
        const s = v.snapshot_json || {};
        return [s.brand, s.model, s.year, s.__filterName].filter(Boolean).join(" ").toLowerCase().includes(q);
      });
    }
    if (filterStatus !== "all") {
      list = list.filter(v => getCepikStatus(v) === filterStatus);
    }
    return list;
  }, [vehicles, filterStatus, searchQuery]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const v of filtered) {
      const src = v.snapshot_json?.__source;
      const key = src === "manual" ? "__manual"
                : (v.snapshot_json?.__filterName || "__none");
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    // Sort: manual last, rest alphabetical
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "__manual") return 1;
      if (b === "__manual") return -1;
      if (a === "__none") return 1;
      if (b === "__none") return -1;
      return a.localeCompare(b, "pl");
    });
  }, [filtered]);

  const counts = useMemo(() => {
    const c = { ok: 0, issues: 0, check: 0, no_data: 0, pending: 0 };
    for (const v of vehicles) { const s = getCepikStatus(v); c[s] = (c[s] || 0) + 1; }
    return c;
  }, [vehicles]);

  const newCount      = useMemo(() => vehicles.filter(v => v.snapshot_json?.__isNew).length, [vehicles]);
  const archivedCount = useMemo(() => vehicles.filter(v => v.snapshot_json?.__archived).length, [vehicles]);

  if (!me) {
    return <div className="vdb-tab"><div className="vdb-login-note">Zaloguj się, aby korzystać z bazy pojazdów.</div></div>;
  }

  return (
    <div className="vdb-tab">
      {/* Header */}
      <div className="vdb-header">
        <div>
          <div className="section-label">Baza pojazdów</div>
          <div className="vdb-total">
            {vehicles.length} pojazdów
            {newCount > 0 && <span className="vdb-total-new"> · {newCount} nowych</span>}
            {archivedCount > 0 && <span className="vdb-total-archived"> · {archivedCount} archiwum</span>}
          </div>
        </div>
        <button type="button" className="vdb-refresh-btn" onClick={loadVehicles} disabled={loading} title="Odśwież">
          {loading ? "…" : "↻"}
        </button>
      </div>

      {/* Status pills */}
      {vehicles.length > 0 && (
        <div className="vdb-summary">
          {[
            { key: "all",     label: "Wszystkie",  val: vehicles.length },
            { key: "ok",      label: "CEPiK OK",   val: counts.ok },
            { key: "issues",  label: "Uwagi",       val: counts.issues },
            { key: "pending", label: "Nie zwerif.", val: counts.pending },
            { key: "no_data", label: "Brak danych", val: counts.no_data },
          ].map(({ key, label, val }) => (
            <button key={key} type="button"
              className={`vdb-filter-pill ${filterStatus === key ? "vdb-filter-pill--active" : ""} vdb-filter-pill--${key}`}
              onClick={() => setFilterStatus(key)}>
              <span>{label}</span><span className="vdb-pill-count">{val}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {vehicles.length > 0 && (
        <div className="vdb-controls">
          <input
            className="vdb-search"
            placeholder="Szukaj marki, modelu, filtru…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Content */}
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
            <br />Ręcznie przeanalizowane ogłoszenia też tu trafią po zapisaniu.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vdb-empty"><div className="vdb-empty-title">Brak wyników dla wybranych filtrów</div></div>
      ) : (
        <div className="vdb-groups">
          {grouped.map(([groupKey, items]) => {
            const matchedFilter = filters.find(f => f.name === groupKey);
            return (
              <FilterGroup
                key={groupKey}
                groupKey={groupKey}
                items={items}
                filter={matchedFilter}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onPatch={handlePatch}
                onVerify={handleVerify}
                verifyBusy={verifyBusy}
                activeStatusFilter={filterStatus}
                searchQuery={searchQuery}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
