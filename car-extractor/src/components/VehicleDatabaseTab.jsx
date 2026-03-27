import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../api.js";

function getCepikStatus(row) {
  const ver = row.verification;
  if (!ver) {
    // Check if we have enough data for CEPiK
    const snap = row.snapshot_json || {};
    const hasData = (row.manual_vin || snap.vin) && (row.manual_license_plate || snap.licensePlate) && (row.manual_first_registration || snap.firstRegistration);
    return hasData ? "pending" : "no_data";
  }
  if (ver.warning_count > 0) return "issues";
  if (ver.ok_count > 0) return "ok";
  return "check";
}

function StatusBadge({ status }) {
  const map = {
    ok: { cls: "vdb-badge--ok", icon: "✓", label: "CEPiK OK" },
    issues: { cls: "vdb-badge--issues", icon: "⚠", label: "Uwagi" },
    check: { cls: "vdb-badge--check", icon: "?", label: "Sprawdź" },
    no_data: { cls: "vdb-badge--nodata", icon: "—", label: "Brak danych" },
    pending: { cls: "vdb-badge--pending", icon: "○", label: "Nie zweryfikowano" },
  };
  const { cls, icon, label } = map[status] || map.no_data;
  return (
    <div className={`vdb-badge ${cls}`} title={label}>
      <span className="vdb-badge-icon">{icon}</span>
      <span className="vdb-badge-label">{label}</span>
    </div>
  );
}

function VehicleRow({ row, onOpen, onDelete }) {
  const snap = row.snapshot_json || {};
  const img = snap.images?.[0];
  const title = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";
  const cepikStatus = getCepikStatus(row);
  const filterName = snap.__filterName;

  const parts = [];
  if (snap.mileage) parts.push(`${Number(snap.mileage).toLocaleString("pl-PL")} km`);
  if (snap.enginePower) parts.push(`${snap.enginePower} KM`);
  if (snap.fuelType) parts.push(snap.fuelType);

  const price = snap.price;

  return (
    <div className="vdb-row">
      <div className="vdb-row-img-wrap">
        {img
          ? <img src={img} alt="" className="vdb-row-img" loading="lazy" />
          : <div className="vdb-row-img vdb-row-img--empty">VX</div>
        }
      </div>

      <div className="vdb-row-info">
        <div className="vdb-row-title">{title}</div>
        {parts.length > 0 && (
          <div className="vdb-row-sub">{parts.join(" · ")}</div>
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
        <StatusBadge status={cepikStatus} />
      </div>

      <div className="vdb-row-actions">
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
  );
}

function FilterGroupHeader({ name, count }) {
  return (
    <div className="vdb-group-header">
      <span className="vdb-group-name">{name || "Inne"}</span>
      <span className="vdb-group-count">{count}</span>
    </div>
  );
}

export default function VehicleDatabaseTab({ me, onOpenItem }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | ok | issues | no_data | pending
  const [groupByFilter, setGroupByFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadVehicles = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const res = await apiFetch("/searches");
      if (res.ok) {
        const all = await res.json();
        // Only auto-scanned
        setVehicles(all.filter(r => r.snapshot_json?.__source === "auto"));
      }
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Usunąć ten pojazd z bazy?")) return;
    const res = await apiFetch(`/searches/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  }, []);

  const handleOpen = useCallback(async (id) => {
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
        <div className="vdb-login-note">
          Zaloguj się, aby korzystać z bazy pojazdów.
        </div>
      </div>
    );
  }

  return (
    <div className="vdb-tab">
      {/* ─── Header ─── */}
      <div className="vdb-header">
        <div>
          <div className="section-label">Baza pojazdów</div>
          <div className="vdb-total">
            {vehicles.length} pojazdów z automatycznego skanowania
          </div>
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

      {/* ─── Status summary pills ─── */}
      {vehicles.length > 0 && (
        <div className="vdb-summary">
          {[
            { key: "all", label: "Wszystkie", val: vehicles.length },
            { key: "ok", label: "CEPiK OK", val: counts.ok },
            { key: "issues", label: "Uwagi", val: counts.issues },
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

      {/* ─── Controls bar ─── */}
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
            Przejdź do zakładki <strong>Filtry</strong>, dodaj filtr wyszukiwania i uruchom skanowanie.
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
                <VehicleRow
                  key={row.id}
                  row={row}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="vdb-list">
          {filtered.map(row => (
            <VehicleRow
              key={row.id}
              row={row}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
