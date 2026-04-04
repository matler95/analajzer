import { useMemo } from "react";

const ROWS = [
  { key: "price",       label: "Cena",         fmt: (v, s) => s.price ? `${Number(s.price).toLocaleString("pl-PL")} ${s.currency || "PLN"}` : "—" },
  { key: "year",        label: "Rok",           fmt: (v, s) => s.year ?? "—" },
  { key: "mileage",     label: "Przebieg",      fmt: (v, s) => s.mileage ? `${Number(s.mileage).toLocaleString("pl-PL")} km` : "—" },
  { key: "fuelType",    label: "Paliwo",        fmt: (v, s) => s.fuelType ?? "—" },
  { key: "transmission",label: "Skrzynia",      fmt: (v, s) => s.transmission ?? "—" },
  { key: "power",       label: "Moc",           fmt: (v, s) => s.enginePower ? `${s.enginePower} KM` : "—" },
  { key: "engine",      label: "Pojemność",     fmt: (v, s) => s.engineDisplacement ? `${Number(s.engineDisplacement).toLocaleString("pl-PL")} cm³` : "—" },
  { key: "drivetrain",  label: "Napęd",         fmt: (v, s) => s.drivetrain ?? "—" },
  { key: "country",     label: "Kraj",          fmt: (v, s) => s.countryOfOrigin ?? "—" },
  { key: "vin",         label: "VIN",           fmt: (v, s) => (v.manual_vin ?? s.vin) ? "✓ ma VIN" : "✗ brak" },
  { key: "cepik",       label: "CEPiK",         fmt: (v) => {
    const ver = v.verification;
    if (!ver) return "—";
    if (ver.warning_count > 0) return `⚠ ${ver.warning_count} rozbieżn.`;
    if (ver.ok_count > 0)      return `✓ ${ver.ok_count} pól OK`;
    return "sprawdź";
  }},
  { key: "filterName",  label: "Filtr",         fmt: (v, s) => s.__filterName ?? "ręczne" },
];

function bestValue(rows, rowKey, vehicles) {
  const vals = vehicles.map(v => {
    const s = v.snapshot_json ?? {};
    if (rowKey === "price")    return s.price    ?? null;
    if (rowKey === "mileage")  return s.mileage  ?? null;
    if (rowKey === "power")    return s.enginePower ?? null;
    if (rowKey === "year")     return s.year     ?? null;
    return null;
  });
  if (vals.every(v => v === null)) return null;
  // Lower is better for price/mileage, higher for power/year
  const higherBetter = rowKey === "power" || rowKey === "year";
  const valid = vals.filter(v => v !== null);
  const best  = higherBetter ? Math.max(...valid) : Math.min(...valid);
  return vals.map(v => v === best ? "best" : v !== null ? "normal" : "none");
}

export default function CompareDrawer({ vehicles, onClose, onRemove, onOpen }) {
  const cols = vehicles.slice(0, 3);

  const highlights = useMemo(() => {
    const result = {};
    ROWS.forEach(row => {
      result[row.key] = bestValue(ROWS, row.key, cols);
    });
    return result;
  }, [cols]);

  if (!cols.length) return null;

  return (
    <div className="cmp-drawer" role="dialog" aria-label="Porównanie pojazdów">
      <div className="cmp-drawer-header">
        <div className="cmp-title">Porównanie</div>
        <div className="cmp-subtitle">{cols.length} z 3 pojazdów</div>
        <button type="button" className="drawer-close" onClick={onClose}>✕</button>
      </div>

      <div className="cmp-scroll">
        <table className="cmp-table">
          <thead>
            <tr>
              <th className="cmp-th cmp-th--label" />
              {cols.map(v => {
                const s = v.snapshot_json ?? {};
                const img = s.images?.[0];
                return (
                  <th key={v.id} className="cmp-th cmp-th--vehicle">
                    <div className="cmp-vehicle-head">
                      <div className="cmp-vehicle-img-wrap">
                        {img
                          ? <img src={img} alt="" className="cmp-vehicle-img" />
                          : <div className="cmp-vehicle-img-empty">VX</div>
                        }
                        <button
                          type="button"
                          className="cmp-vehicle-remove"
                          onClick={() => onRemove(v.id)}
                          title="Usuń z porównania"
                        >✕</button>
                      </div>
                      <div className="cmp-vehicle-name">
                        {[s.brand, s.model].filter(Boolean).join(" ") || "Pojazd"}
                      </div>
                      <button
                        type="button"
                        className="cmp-open-btn"
                        onClick={() => onOpen(v.id)}
                      >↗ Otwórz</button>
                    </div>
                  </th>
                );
              })}
              {/* Empty slot placeholder if < 3 */}
              {cols.length < 3 && (
                <th className="cmp-th cmp-th--empty">
                  <div className="cmp-empty-slot">
                    <span>+ Zaznacz kolejny pojazd</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} className="cmp-row">
                <td className="cmp-td cmp-td--label">{row.label}</td>
                {cols.map((v, ci) => {
                  const s   = v.snapshot_json ?? {};
                  const val = row.fmt(v, s);
                  const hl  = highlights[row.key]?.[ci];
                  return (
                    <td key={v.id} className={`cmp-td ${hl === "best" ? "cmp-td--best" : ""}`}>
                      {val}
                    </td>
                  );
                })}
                {cols.length < 3 && <td className="cmp-td cmp-td--empty" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
