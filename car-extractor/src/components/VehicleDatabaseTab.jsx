import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "../api.js";
import {
  normalizeLicensePlate, normalizeVin, normalizeDateForCepik,
  isValidLicensePlate, isValidVin,
} from "../utils/normalize.js";
import UndoToast, { UNDO_DURATION_MS } from "./UndoToast.jsx";
import DbStatsPanel from "./DbStatsPanel.jsx";
import PriceSparkline from "./PriceSparkline.jsx";
import BulkActionBar from "./BulkActionBar.jsx";
import { useExport } from "../hooks/useExport.js";

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const COLLAPSED_KEY = "analajzer_vdb_collapsed_v1";

function loadCollapsedState() {
  try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "{}"); }
  catch { return {}; }
}

function saveCollapsedState(state) {
  try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

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

function computeGroupStats(rows) {
  const prices   = rows.map(r => r.snapshot_json?.price).filter(v => v > 0);
  const mileages = rows.map(r => r.snapshot_json?.mileage).filter(v => v > 0);
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const med = arr => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };
  return {
    count: rows.length,
    avgPrice: avg(prices),
    medPrice: med(prices),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    avgMileage: avg(mileages),
  };
}

function getDealBadge(row, stats) {
  if (!stats) return null;
  const price   = row.snapshot_json?.price;
  const mileage = row.snapshot_json?.mileage;
  if (!price && !mileage) return null;
  const priceScore   = price   && stats.medPrice   ? (stats.medPrice - price)   / stats.medPrice   : 0;
  const mileageScore = mileage && stats.avgMileage ? (stats.avgMileage - mileage) / stats.avgMileage : 0;
  const score = priceScore * 0.6 + mileageScore * 0.4;
  if (score > 0.15) return { cls: "deal-badge--great",  label: "Okazja",        icon: "🔥" };
  if (score > 0.05) return { cls: "deal-badge--good",   label: "Dobra cena",    icon: "✓"  };
  if (score < -0.15) return { cls: "deal-badge--pricey", label: "Powyżej rynku", icon: "↑"  };
  return null;
}

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("pl-PL");
}

function getImgFingerprint(imgUrl) {
  if (!imgUrl) return null;
  try {
    let u = imgUrl.split("?")[0];
    u = u.split(";")[0];
    u = u.replace(/\/+$/, "");
    const m = u.match(/\/([a-f0-9\-]{30,}(?:\/[^/]+)?)$/);
    if (m) return m[1].toLowerCase();
    const parts = u.split("/").filter(Boolean);
    return parts.slice(-2).join("/").toLowerCase();
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════ */

function StatusBadge({ status }) {
  const MAP = {
    ok:      { cls: "vdb-badge--ok",      icon: "✓", label: "CEPiK OK"    },
    issues:  { cls: "vdb-badge--issues",  icon: "⚠", label: "Uwagi"       },
    check:   { cls: "vdb-badge--check",   icon: "?", label: "Sprawdź"     },
    no_data: { cls: "vdb-badge--nodata",  icon: "–", label: "Brak danych" },
    pending: { cls: "vdb-badge--pending", icon: "○", label: "Nie zwerif." },
  };
  const { cls, icon, label } = MAP[status] || MAP.no_data;
  return (
    <span className={`vdb-badge ${cls}`}>
      <span className="vdb-badge-icon">{icon}</span>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   INLINE FIELD
   ═══════════════════════════════════════════════════════════ */

function InlineField({ label, value, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  const [err, setErr]         = useState(null);

  const normalize = useCallback((v) => {
    if (!v) return "";
    if (fieldKey === "vin")               return normalizeVin(v);
    if (fieldKey === "licensePlate")      return normalizeLicensePlate(v);
    if (fieldKey === "firstRegistration") return normalizeDateForCepik(v);
    return String(v).trim();
  }, [fieldKey]);

  const validate = useCallback((v) => {
    if (!v) return "empty";
    if (fieldKey === "vin")               return isValidVin(v) ? "ok" : "invalid";
    if (fieldKey === "licensePlate")      return isValidLicensePlate(v) ? "ok" : "invalid";
    if (fieldKey === "firstRegistration") return /^\d{4}-\d{2}-\d{2}$/.test(v) ? "ok" : "invalid";
    return "ok";
  }, [fieldKey]);

  const displayVal   = value ? normalize(value) : null;
  const displayState = validate(displayVal || "");

  const startEdit = () => { setDraft(displayVal || ""); setErr(null); setEditing(true); };

  const save = async () => {
    const n = normalize(draft);
    if (draft && validate(n || draft) === "invalid") { setErr("Niepoprawna wartość"); return; }
    const res = await onSave(n || null);
    if (res?.error) { setErr(res.error); return; }
    setEditing(false);
  };

  return (
    <div className="vdb-field">
      <div className="vdb-field-lbl">{label}</div>
      {editing ? (
        <div className="vdb-field-edit-wrap">
          <input
            className="vdb-field-input"
            value={draft}
            onChange={e => { setDraft(e.target.value); setErr(null); }}
            {...(fieldKey === "firstRegistration" ? { type: "date" } : {})}
            maxLength={fieldKey === "vin" ? 17 : 20}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            placeholder={fieldKey === "vin" ? "17 znaków" : fieldKey === "licensePlate" ? "np. WX12345" : ""}
          />
          <div className="vdb-field-btns">
            <button type="button" className="vdb-field-btn-save" onClick={save}>Zapisz</button>
            <button type="button" className="vdb-field-btn-cancel" onClick={() => setEditing(false)}>Anuluj</button>
          </div>
          {err && <div className="vdb-field-err">{err}</div>}
        </div>
      ) : (
        <button
          type="button"
          className={`vdb-field-val vdb-field-val--${displayVal ? displayState : "nil"}`}
          onClick={startEdit}
        >
          <span className="vdb-field-text">{displayVal || "kliknij aby uzupełnić"}</span>
          <span className="vdb-field-indicator">
            {displayVal && displayState === "ok"      && <span className="vdb-fi-ok">✓</span>}
            {displayVal && displayState === "invalid" && <span className="vdb-fi-warn">⚠</span>}
            <span className="vdb-fi-edit">✎</span>
          </span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VEHICLE CARD
   ═══════════════════════════════════════════════════════════ */

function VehicleCard({ row, dups = [], onOpen, onDelete, onPatch, onVerify, stats, verifyBusy, pendingDelete, selected, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const snap        = row.snapshot_json || {};
  const url         = row.listing_url || snap.listingUrl || "";
  const isOlx       = url.includes("olx.pl");

  const hasOto = !isOlx || dups.some(d => !(d.listing_url || d.snapshot_json?.listingUrl || "").includes("olx.pl"));
  const hasOlx = isOlx  || dups.some(d =>  (d.listing_url || d.snapshot_json?.listingUrl || "").includes("olx.pl"));
  const isBoth      = hasOto && hasOlx;
  const portalLabel = isBoth ? "OTO + OLX" : isOlx ? "OLX" : "Otomoto";
  const portalCls   = isBoth ? "ft-portal-tag--both" : isOlx ? "ft-portal-tag--olx" : "ft-portal-tag--otomoto";

  const img         = snap.images?.[0];
  const title       = [snap.brand, snap.model].filter(Boolean).join(" ") || "Pojazd";
  const cepikStatus = getCepikStatus(row);
  const missing     = cepikStatus === "no_data" ? getMissingCepikFields(row) : [];
  const dealBadge   = getDealBadge(row, stats);
  const isNew       = snap.__isNew === true;
  const isArchived  = snap.__archived === true;
  const priceDiff   = snap.__priceDiff;
  const priceHist   = snap.__priceHistory || [];

  const effPlate   = row.manual_license_plate  ?? snap.licensePlate   ?? null;
  const effVin     = row.manual_vin            ?? snap.vin            ?? null;
  const effFirstReg = row.manual_first_registration ?? snap.firstRegistration ?? null;

  const canVerify = Boolean(
    effPlate && isValidLicensePlate(normalizeLicensePlate(effPlate)) &&
    effVin   && isValidVin(normalizeVin(effVin)) &&
    effFirstReg && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(effFirstReg))
  );

  const specParts = [
    snap.year,
    snap.mileage ? `${fmt(snap.mileage)} km` : null,
    snap.fuelType,
    snap.transmission,
  ].filter(Boolean);

  const handleSaveField = useCallback(async (apiKey, val) => {
    return await onPatch(row.id, apiKey, val);
  }, [onPatch, row.id]);

  const handleDelete = useCallback(() => {
    if (!delConfirm) {
      setDelConfirm(true);
      setTimeout(() => setDelConfirm(false), 2500);
      return;
    }
    onDelete(row.id);
  }, [delConfirm, onDelete, row.id]);

  const specItems = [
    { lbl: "Rok",       val: snap.year },
    { lbl: "Przebieg",  val: snap.mileage ? `${fmt(snap.mileage)} km` : null },
    { lbl: "Moc",       val: snap.enginePower ? `${snap.enginePower} KM` : null },
    { lbl: "Pojemność", val: snap.engineDisplacement ? `${fmt(snap.engineDisplacement)} cm³` : null },
    { lbl: "Paliwo",    val: snap.fuelType },
    { lbl: "Skrzynia",  val: snap.transmission },
    { lbl: "Napęd",     val: snap.drivetrain },
    { lbl: "Nadwozie",  val: snap.bodyType },
    { lbl: "Kraj",      val: snap.countryOfOrigin },
    { lbl: "Generacja", val: snap.generation },
  ].filter(x => x.val != null && x.val !== "");

  return (
    <div className={[
      "vdbc",
      expanded    ? "vdbc--open"     : "",
      isArchived  ? "vdbc--archived" : "",
      isNew       ? "vdbc--new"      : "",
      pendingDelete ? "vdbc--pending-delete" : "",
      selected    ? "vdbc--selected" : "",
    ].filter(Boolean).join(" ")}>

      <div className="vdbc-hdr" onClick={() => setExpanded(v => !v)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setExpanded(v => !v)}>

        {/* Selection checkbox — click stops propagation so it doesn't toggle expand */}
        {onToggleSelect && (
          <div
            className="vdbc-checkbox-wrap"
            onClick={e => { e.stopPropagation(); onToggleSelect(row.id); }}
          >
            <div className={`vdbc-checkbox ${selected ? "vdbc-checkbox--checked" : ""}`} aria-label={selected ? "Odznacz" : "Zaznacz"}>
              {selected && <span aria-hidden="true">✓</span>}
            </div>
          </div>
        )}

        <div className="vdbc-thumb">
          {img
            ? <img src={img} alt="" className="vdbc-img" loading="lazy" />
            : <div className="vdbc-img-empty">VX</div>}
          {isNew      && <span className="vdbc-flag vdbc-flag--new">NOWY</span>}
          {isArchived && <span className="vdbc-flag vdbc-flag--arch">ARCH.</span>}
          {pendingDelete && <span className="vdbc-flag vdbc-flag--deleting">USUWA…</span>}
        </div>

        <div className="vdbc-info">
          <div className="vdbc-title">{title}</div>
          {specParts.length > 0 && (
            <div className="vdbc-spec-line">{specParts.join(" · ")}</div>
          )}
          {snap.__filterName && (
            <div className="vdbc-filter-tag">{snap.__filterName}</div>
          )}
          <div className="vdbc-pills">
            <StatusBadge status={cepikStatus} />
            {dealBadge && (
              <span className={`vdbc-deal ${dealBadge.cls}`}>{dealBadge.icon} {dealBadge.label}</span>
            )}
            <span className={`ft-portal-tag ${portalCls}`}>{portalLabel}</span>
          </div>
        </div>

        <div className="vdbc-aside" onClick={e => e.stopPropagation()}>
          {snap.price != null && (
            <div className="vdbc-price-block">
              <div className="vdbc-price">
                {fmt(snap.price)}
                <span className="vdbc-cur"> {snap.currency || "PLN"}</span>
              </div>
              {priceDiff != null && (
                <div className={`vdbc-diff ${priceDiff < 0 ? "vdbc-diff--down" : "vdbc-diff--up"}`}>
                  {priceDiff < 0 ? "▼" : "▲"} {fmt(Math.abs(priceDiff))} PLN
                </div>
              )}
              {/* Sparkline — only rendered when there's actual history to show */}
              {priceHist.length > 0 && (
                <PriceSparkline priceHistory={priceHist} currentPrice={snap.price} />
              )}
            </div>
          )}
          <div className="vdbc-actions">
            <button
              type="button"
              className="vdbc-btn vdbc-btn--open"
              onClick={() => onOpen(row.id)}
              title="Otwórz w analizatorze"
            >↗ Otwórz</button>
            <button
              type="button"
              className={`vdbc-btn vdbc-btn--del ${delConfirm ? "vdbc-btn--confirm" : ""}`}
              onClick={handleDelete}
              title="Usuń z bazy"
              disabled={pendingDelete}
            >{delConfirm ? "Na pewno?" : "🗑"}</button>
          </div>
        </div>

        <div className="vdbc-chevron" aria-hidden="true">{expanded ? "▲" : "▼"}</div>
      </div>

      {expanded && (
        <div className="vdbc-body">
          {snap.images?.length > 1 && (
            <div className="vdbc-imgstrip">
              {snap.images.slice(0, 8).map((u, i) => (
                <img key={i} src={u} alt="" className="vdbc-strip-img" loading="lazy" />
              ))}
            </div>
          )}

          {specItems.length > 0 && (
            <div className="vdbc-specs">
              {specItems.map(({ lbl, val }) => (
                <div key={lbl} className="vdbc-spec">
                  <div className="vdbc-spec-lbl">{lbl}</div>
                  <div className="vdbc-spec-val">{val}</div>
                </div>
              ))}
            </div>
          )}

          {priceHist.length > 0 && (
            <div className="vdbc-section">
              <div className="vdbc-section-hdr">Historia ceny</div>
              <div className="vdbc-price-chain">
                {[...priceHist, { price: snap.price, recordedAt: null }].map((ph, i, arr) => (
                  <div key={i} className={`vdbc-chain-item ${i === arr.length - 1 ? "vdbc-chain-item--now" : ""}`}>
                    <span className="vdbc-chain-price">{fmt(ph.price)} PLN</span>
                    <span className="vdbc-chain-date">
                      {ph.recordedAt ? new Date(ph.recordedAt).toLocaleDateString("pl-PL") : "teraz"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="vdbc-section vdbc-cepik-section">
            <div className="vdbc-section-hdr">
              Weryfikacja CEPiK
              {missing.length > 0 && (
                <span className="vdbc-missing-tag">brakuje: {missing.join(", ")}</span>
              )}
              {cepikStatus === "ok" && <span className="vdbc-verified-tag">✓ Zweryfikowany</span>}
              {cepikStatus === "issues" && <span className="vdbc-issues-tag">⚠ Rozbieżności</span>}
            </div>

            <div className="vdbc-fields">
              <InlineField label="Nr rejestracyjny" value={effPlate} fieldKey="licensePlate"
                onSave={val => handleSaveField("manual_license_plate", val)} />
              <InlineField label="VIN" value={effVin} fieldKey="vin"
                onSave={val => handleSaveField("manual_vin", val)} />
              <InlineField label="Data 1. rejestracji" value={effFirstReg} fieldKey="firstRegistration"
                onSave={val => handleSaveField("manual_first_registration", val)} />
            </div>

            <div className="vdbc-verify-row">
              <button
                type="button"
                className={`vdbc-verify-btn ${!canVerify || verifyBusy ? "vdbc-verify-btn--disabled" : ""}`}
                disabled={!canVerify || verifyBusy}
                onClick={() => canVerify && !verifyBusy && onVerify(row)}
              >
                {verifyBusy ? "⏳ Weryfikuję…" : "🔎 Weryfikuj w CEPiK"}
              </button>
              {!canVerify && missing.length > 0 && (
                <span className="vdbc-verify-hint">Uzupełnij: {missing.join(", ")}</span>
              )}
            </div>

            {row.verification && (
              <div className="vdbc-ver-summary">
                <span className="vdbc-ver-ok">✓ {row.verification.ok_count} zgodnych</span>
                {row.verification.warning_count > 0 && (
                  <span className="vdbc-ver-warn">⚠ {row.verification.warning_count} rozbieżności</span>
                )}
                {row.verification.created_at && (
                  <span className="vdbc-ver-date">
                    {new Date(row.verification.created_at).toLocaleDateString("pl-PL")}
                  </span>
                )}
              </div>
            )}
          </div>

          {(snap.seller || snap.location) && (
            <div className="vdbc-meta-footer">
              {snap.seller  && <span>👤 {snap.seller}</span>}
              {snap.location && <span>📍 {snap.location}</span>}
            </div>
          )}

          {dups.length > 0 && (
            <div className="vdbc-dup-section">
              <div className="vdbc-dup-title">Ogłoszenia na innych portalach</div>
              <div className="vdbc-dup-links">
                <a href={url} target="_blank" rel="noreferrer"
                  className={`vdbc-dup-link ${isOlx ? "vdbc-dup-link--olx" : "vdbc-dup-link--oto"}`}>
                  <span className="vdbc-dup-link-dot" />
                  {isOlx ? "OLX" : "Otomoto"}
                  <span className="vdbc-dup-link-arr">↗</span>
                </a>
                {dups.map(dup => {
                  const dupUrl = dup.listing_url || dup.snapshot_json?.listingUrl || "";
                  const dupOlx = dupUrl.includes("olx.pl");
                  return (
                    <a key={dup.id} href={dupUrl} target="_blank" rel="noreferrer"
                      className={`vdbc-dup-link ${dupOlx ? "vdbc-dup-link--olx" : "vdbc-dup-link--oto"}`}>
                      <span className="vdbc-dup-link-dot" />
                      {dupOlx ? "OLX" : "Otomoto"}
                      <span className="vdbc-dup-link-arr">↗</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GROUP STATS
   ═══════════════════════════════════════════════════════════ */

function GroupStats({ stats, filter }) {
  if (!stats || stats.count === 0) return null;
  const metrics = [
    { lbl: "Śr. cena",     val: stats.avgPrice    ? `${fmt(stats.avgPrice)} PLN`  : null },
    { lbl: "Mediana",      val: stats.medPrice    ? `${fmt(stats.medPrice)} PLN`  : null },
    { lbl: "Śr. przebieg", val: stats.avgMileage  ? `${fmt(stats.avgMileage)} km` : null },
    { lbl: "Szt.",         val: String(stats.count) },
  ].filter(m => m.val);

  return (
    <div className="vdb-stats-bar">
      {metrics.map(m => (
        <div key={m.lbl} className="vdb-stats-item">
          <div className="vdb-stats-val">{m.val}</div>
          <div className="vdb-stats-lbl">{m.lbl}</div>
        </div>
      ))}
      {filter?.lastRunAt && (
        <div className="vdb-stats-item vdb-stats-item--ts">
          <div className="vdb-stats-val">
            {new Date(filter.lastRunAt).toLocaleString("pl-PL", {
              day: "2-digit", month: "2-digit",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
          <div className="vdb-stats-lbl">Ostatni skan</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER GROUP — now receives collapsed/onToggle from parent
   so state persists across tab switches (stored in localStorage)
   ═══════════════════════════════════════════════════════════ */

function FilterGroup({ groupKey, items, filter, collapsed, onToggle, onOpen, onDelete, onPatch, onVerify, verifyBusy, pendingDeleteIds, selectedIds, onToggleSelect }) {
  const stats = useMemo(() => computeGroupStats(items), [items]);

  const newCount      = items.filter(r => r.snapshot_json?.__isNew).length;
  const archivedCount = items.filter(r => r.snapshot_json?.__archived).length;
  const issuesCount   = items.filter(r => getCepikStatus(r) === "issues").length;

  const displayName = groupKey === "__manual" ? "Ręczne wyszukiwanie"
    : groupKey === "__none" ? "Bez filtru" : groupKey;

  const dedupedItems = useMemo(() => {
    const fpMap = new Map();
    const noFp  = [];

    for (const row of items) {
      const fp = getImgFingerprint(row.snapshot_json?.images?.[0]);
      if (!fp) { noFp.push(row); continue; }
      if (!fpMap.has(fp)) fpMap.set(fp, []);
      fpMap.get(fp).push(row);
    }

    const scored = (row) => {
      let s = 0;
      if (row.verification?.ok_count > 0)               s += 1000;
      const snap = row.snapshot_json || {};
      const vin  = row.manual_vin || snap.vin;
      if (vin)                                           s += 100;
      const url  = row.listing_url || snap.listingUrl || "";
      if (!url.includes("olx.pl"))                       s += 10;
      return s;
    };

    const result = [];
    for (const [, rows] of fpMap) {
      if (rows.length === 1) {
        result.push({ primary: rows[0], dups: [] });
      } else {
        const sorted = [...rows].sort((a, b) => scored(b) - scored(a));
        result.push({ primary: sorted[0], dups: sorted.slice(1) });
      }
    }
    for (const row of noFp) result.push({ primary: row, dups: [] });
    return result;
  }, [items]);

  // Show merge count when deduplication hid items
  const mergedCount = dedupedItems.reduce((n, d) => n + d.dups.length, 0);

  return (
    <div className={`vdb-group ${collapsed ? "vdb-group--collapsed" : ""}`}>
      <div className="vdb-group-hdr" onClick={onToggle}>
        <span className="vdb-group-chevron">{collapsed ? "▶" : "▼"}</span>
        <span className="vdb-group-name">{displayName}</span>
        <span className="vdb-group-count">{items.length}</span>

        {/* Dedup badge — tells users cross-portal duplicates were merged */}
        {mergedCount > 0 && (
          <span className="vdb-gbadge vdb-gbadge--merged" title={`${mergedCount} ogłoszeń połączono jako duplikaty cross-portalu`}>
            {mergedCount} × 2 portale
          </span>
        )}

        <div className="vdb-group-badges">
          {newCount > 0      && <span className="vdb-gbadge vdb-gbadge--new">{newCount} nowych</span>}
          {archivedCount > 0 && <span className="vdb-gbadge vdb-gbadge--arch">{archivedCount} archiwum</span>}
          {issuesCount > 0   && <span className="vdb-gbadge vdb-gbadge--issues">{issuesCount} uwag</span>}
        </div>

        {collapsed && stats.avgPrice && (
          <div className="vdb-group-collapsed-meta">
            śr. {fmt(stats.avgPrice)} PLN · {fmt(stats.avgMileage)} km
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <GroupStats stats={stats} filter={filter} />
          <div className="vdb-card-list">
            {dedupedItems.map(({ primary, dups: dupRows }) => (
              <VehicleCard
                key={primary.id}
                row={primary}
                dups={dupRows}
                onOpen={onOpen}
                onDelete={onDelete}
                onPatch={onPatch}
                onVerify={onVerify}
                stats={stats}
                verifyBusy={verifyBusy[primary.id]}
                pendingDelete={pendingDeleteIds.has(primary.id)}
                selected={selectedIds?.has(primary.id)}
                onToggleSelect={onToggleSelect}
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
  const [vehicles,      setVehicles]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [verifyBusy,    setVerifyBusy]    = useState({});
  const [batchVerifyBusy, setBatchVerifyBusy] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // handleSelectAll / handleClearSelection defined after `filtered` memo below

  // Group collapse state — persisted in localStorage so it survives tab switches
  const [collapsedGroups, setCollapsedGroups] = useState(loadCollapsedState);

  // Undo-delete: optimistically remove rows but delay actual API call by 5s
  const [undoStack,       setUndoStack]    = useState([]); // [{id, label, row}]
  const pendingTimersRef  = useRef({});                    // { id: timeoutId }

  const toggleGroup = useCallback((key) => {
    setCollapsedGroups(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  const pendingDeleteIds = useMemo(
    () => new Set(undoStack.map(u => u.id)),
    [undoStack]
  );

  const { exportCsv, exportJson } = useExport();

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

  /* ── Undo-delete: schedule deletion, allow cancellation ── */
  const handleDelete = useCallback((id) => {
    const row = vehicles.find(v => v.id === id);
    if (!row) return;

    const snap = row.snapshot_json || {};
    const label = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";

    // Optimistically hide in current list (still visible with "pending" style)
    setUndoStack(prev => [...prev.filter(u => u.id !== id), { id, label, row }]);

    // Schedule actual DELETE after 5 seconds
    const timer = setTimeout(async () => {
      await apiFetch(`/searches/${id}`, { method: "DELETE" });
      setVehicles(prev => prev.filter(v => v.id !== id));
      setUndoStack(prev => prev.filter(u => u.id !== id));
      delete pendingTimersRef.current[id];
    }, UNDO_DURATION_MS);

    pendingTimersRef.current[id] = timer;
  }, [vehicles]);

  /* ── Undo: cancel timer and restore row ── */
  const handleUndoDelete = useCallback((id) => {
    const timer = pendingTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete pendingTimersRef.current[id];
    }
    setUndoStack(prev => prev.filter(u => u.id !== id));
    // Row was never actually removed from vehicles — just un-pending it
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleOpen = useCallback((id) => { onOpenItem?.(id); }, [onOpenItem]);

  const handlePatch = useCallback(async (id, key, val) => {
    const res = await apiFetch(`/searches/${id}`, { method: "PATCH", body: { [key]: val } });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { error: j.detail || "Nie udało się zapisać" };
    }
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

  /* ── Filter & group ── */
  const filtered = useMemo(() => {
    // Exclude pending-deleted rows from the view
    let list = vehicles.filter(v => !pendingDeleteIds.has(v.id));
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
  }, [vehicles, filterStatus, searchQuery, pendingDeleteIds]);

  // ── Selection handlers (defined after `filtered`) ──
  const handleSelectAll      = useCallback(() => setSelectedIds(new Set(filtered.map(v => v.id))), [filtered]);
  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Verifiable IDs = selected rows that have plate + vin + firstReg
  const verifiableSelectedIds = useMemo(() => {
    return filtered
      .filter(v => selectedIds.has(v.id))
      .filter(v => {
        const s = v.snapshot_json || {};
        const plate = v.manual_license_plate || s.licensePlate;
        const vin   = v.manual_vin           || s.vin;
        const fr    = v.manual_first_registration || s.firstRegistration;
        return (
          plate && isValidLicensePlate(normalizeLicensePlate(plate)) &&
          vin   && isValidVin(normalizeVin(vin)) &&
          fr    && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr))
        );
      })
      .map(v => v.id);
  }, [filtered, selectedIds]);

  // Batch delete — reuses undo-delete flow for each selected id
  const handleBatchDelete = useCallback(() => {
    const ids = [...selectedIds];
    ids.forEach(id => handleDelete(id));
    setSelectedIds(new Set());
  }, [selectedIds, handleDelete]);

  // Batch CEPiK verify — sequential with a short delay to avoid rate-limiting
  const handleBatchVerify = useCallback(async () => {
    if (!verifiableSelectedIds.length) return;
    setBatchVerifyBusy(true);
    for (const id of verifiableSelectedIds) {
      const row = vehicles.find(v => v.id === id);
      if (row) await handleVerify(row);
      // Brief pause between requests to respect CEPiK rate limit
      await new Promise(r => setTimeout(r, 800));
    }
    setBatchVerifyBusy(false);
    setSelectedIds(new Set());
  }, [verifiableSelectedIds, vehicles, handleVerify]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const v of filtered) {
      const src = v.snapshot_json?.__source;
      const key = src === "manual" ? "__manual" : (v.snapshot_json?.__filterName || "__none");
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "__manual") return 1;
      if (b === "__manual") return -1;
      if (a === "__none")   return 1;
      if (b === "__none")   return -1;
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
    return (
      <div className="vdb-tab">
        <div className="vdb-login-gate">
          <div className="vdb-login-icon">🔒</div>
          <div className="vdb-login-title">Zaloguj się</div>
          <div className="vdb-login-desc">Baza pojazdów wymaga konta. Zaloguj się aby przeglądać wyniki skanowania.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vdb-tab">

      {/* Header */}
      <div className="vdb-header">
        <div className="vdb-header-left">
          <div className="section-label">Baza pojazdów</div>
          <div className="vdb-total">
            {vehicles.length} pojazdów
            {newCount > 0      && <span className="vdb-total-new"> · {newCount} nowych</span>}
            {archivedCount > 0 && <span className="vdb-total-arch"> · {archivedCount} archiwum</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Export buttons — only shown when there are vehicles */}
          {vehicles.length > 0 && (
            <>
              <button
                type="button"
                className="vdb-export-btn"
                onClick={() => exportCsv(vehicles)}
                title="Eksportuj wszystkie do CSV"
              >
                ⬇ CSV
              </button>
              <button
                type="button"
                className="vdb-export-btn"
                onClick={() => exportJson(vehicles)}
                title="Eksportuj wszystkie do JSON"
              >
                ⬇ JSON
              </button>
            </>
          )}
          {/* Collapse all / expand all */}
          {grouped.length > 1 && (
            <button
              type="button"
              className="vdb-refresh-btn"
              onClick={() => {
                const allCollapsed = grouped.every(([k]) => collapsedGroups[k]);
                const next = {};
                grouped.forEach(([k]) => { next[k] = !allCollapsed; });
                setCollapsedGroups(next);
                saveCollapsedState(next);
              }}
              title={grouped.every(([k]) => collapsedGroups[k]) ? "Rozwiń wszystkie" : "Zwiń wszystkie"}
            >
              {grouped.every(([k]) => collapsedGroups[k]) ? "⊞" : "⊟"}
            </button>
          )}
          <button
            type="button"
            className="vdb-refresh-btn"
            onClick={loadVehicles}
            disabled={loading}
            title="Odśwież"
          >
            <span className={loading ? "vdb-refresh-spin" : ""}>↻</span>
            {loading ? "Ładuję…" : "Odśwież"}
          </button>
        </div>
      </div>

      {/* Global portfolio stats */}
      {vehicles.length > 0 && <DbStatsPanel vehicles={vehicles} />}

      {/* Search + Status filters */}
      {vehicles.length > 0 && (
        <div className="vdb-controls">
          <div className="vdb-search-wrap">
            <span className="vdb-search-ico">🔍</span>
            <input
              className="vdb-search"
              placeholder="Szukaj marki, modelu, filtru…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="vdb-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          <div className="vdb-status-pills">
            {[
              { key: "all",     label: "Wszystkie",    val: vehicles.length },
              { key: "ok",      label: "✓ OK",          val: counts.ok,      show: counts.ok > 0 },
              { key: "issues",  label: "⚠ Uwagi",       val: counts.issues,  show: counts.issues > 0 },
              { key: "pending", label: "○ Nie zwerif.", val: counts.pending, show: counts.pending > 0 },
              { key: "no_data", label: "– Brak danych", val: counts.no_data, show: counts.no_data > 0 },
            ].filter(p => p.show !== false).map(({ key, label, val }) => (
              <button
                key={key}
                type="button"
                className={`vdb-pill vdb-pill--${key} ${filterStatus === key ? "vdb-pill--active" : ""}`}
                onClick={() => setFilterStatus(key)}
              >
                {label}
                <span className="vdb-pill-count">{val}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && vehicles.length === 0 ? (
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
            Ręcznie przeanalizowane ogłoszenia też tu trafią po zapisaniu.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vdb-empty">
          <div className="vdb-empty-title">Brak wyników</div>
          <div className="vdb-empty-desc">Zmień filtry lub wyczyść wyszukiwanie.</div>
        </div>
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
                collapsed={!!collapsedGroups[groupKey]}
                onToggle={() => toggleGroup(groupKey)}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onPatch={handlePatch}
                onVerify={handleVerify}
                verifyBusy={verifyBusy}
                pendingDeleteIds={pendingDeleteIds}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            );
          })}
        </div>
      )}

      {/* Bulk action bar — floats above undo stack */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalVisible={filtered.length}
        verifiableIds={verifiableSelectedIds}
        verifyBusy={batchVerifyBusy}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearSelection}
        onBatchDelete={handleBatchDelete}
        onBatchVerify={handleBatchVerify}
      />

      {/* Undo delete toast — fixed position bottom-left */}
      <UndoToast stack={undoStack} onUndo={handleUndoDelete} />
    </div>
  );
}
