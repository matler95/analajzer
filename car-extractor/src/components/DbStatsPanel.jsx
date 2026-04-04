import { useMemo } from "react";

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("pl-PL");
}

function pct(n, total) {
  if (!total || n == null) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

/**
 * DbStatsPanel — a compact 2-row grid of portfolio-wide statistics.
 * Sits at the top of VehicleDatabaseTab, hidden when the DB is empty.
 *
 * Shows:
 *   Łącznie | Zweryfikowane | Rozbieżności | Nowe | Archiwum | Śr. cena | Śr. przebieg
 */
export default function DbStatsPanel({ vehicles }) {
  const stats = useMemo(() => {
    if (!vehicles.length) return null;

    const total       = vehicles.length;
    const verified    = vehicles.filter(v => v.verification?.ok_count > 0).length;
    const issues      = vehicles.filter(v => (v.verification?.warning_count ?? 0) > 0).length;
    const isNew       = vehicles.filter(v => v.snapshot_json?.__isNew).length;
    const archived    = vehicles.filter(v => v.snapshot_json?.__archived).length;

    const prices    = vehicles.map(v => v.snapshot_json?.price).filter(p => p > 0);
    const mileages  = vehicles.map(v => v.snapshot_json?.mileage).filter(m => m > 0);

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return {
      total,
      verified,
      issues,
      isNew,
      archived,
      avgPrice:   avg(prices),
      avgMileage: avg(mileages),
    };
  }, [vehicles]);

  if (!stats || stats.total === 0) return null;

  const tiles = [
    {
      key: "total",
      label: "Łącznie",
      value: fmt(stats.total),
      sub: null,
      cls: "",
    },
    {
      key: "verified",
      label: "CEPiK OK",
      value: fmt(stats.verified),
      sub: pct(stats.verified, stats.total),
      cls: stats.verified > 0 ? "dsp-tile--good" : "",
    },
    {
      key: "issues",
      label: "Rozbieżności",
      value: fmt(stats.issues),
      sub: pct(stats.issues, stats.total),
      cls: stats.issues > 0 ? "dsp-tile--warn" : "",
    },
    {
      key: "new",
      label: "Nowe",
      value: fmt(stats.isNew),
      sub: null,
      cls: stats.isNew > 0 ? "dsp-tile--new" : "",
    },
    {
      key: "archived",
      label: "Archiwum",
      value: fmt(stats.archived),
      sub: null,
      cls: stats.archived > 0 ? "dsp-tile--muted" : "",
    },
    {
      key: "price",
      label: "Śr. cena",
      value: stats.avgPrice ? `${fmt(stats.avgPrice)} PLN` : "—",
      sub: null,
      cls: "",
    },
    {
      key: "mileage",
      label: "Śr. przebieg",
      value: stats.avgMileage ? `${fmt(stats.avgMileage)} km` : "—",
      sub: null,
      cls: "",
    },
  ];

  return (
    <div className="dsp-wrap" role="region" aria-label="Statystyki bazy pojazdów">
      <div className="dsp-label">Portfel</div>
      <div className="dsp-grid">
        {tiles.map(t => (
          <div key={t.key} className={`dsp-tile ${t.cls}`}>
            <div className="dsp-tile-val">{t.value}</div>
            <div className="dsp-tile-lbl">{t.label}</div>
            {t.sub && <div className="dsp-tile-sub">{t.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
