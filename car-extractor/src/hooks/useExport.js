import { useCallback } from "react";

/**
 * useExport — generates CSV or JSON exports of the vehicle database.
 *
 * CSV columns: Brand, Model, Year, Price (PLN), Mileage (km), Fuel, Gearbox,
 *   Power (KM), Engine (cm³), Portal, Filter, CEPiK status, VIN, Plate,
 *   First registered, Listing URL, First seen, Last seen
 */

function escapeCsv(v) {
  if (v == null || v === "") return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsvLine(v) {
  const s   = v.snapshot_json || {};
  const vin = v.manual_vin  ?? s.vin   ?? "";
  const plate = v.manual_license_plate ?? s.licensePlate ?? "";
  const fr    = v.manual_first_registration ?? s.firstRegistration ?? "";
  const cepik = (() => {
    if (!v.verification) return "";
    if (v.verification.warning_count > 0) return "issues";
    if (v.verification.ok_count > 0)      return "ok";
    return "check";
  })();

  return [
    s.brand          ?? "",
    s.model          ?? "",
    s.year           ?? "",
    s.price          ?? "",
    s.mileage        ?? "",
    s.fuelType       ?? "",
    s.transmission   ?? "",
    s.enginePower    ?? "",
    s.engineDisplacement ?? "",
    s.portal         ?? "",
    s.__filterName   ?? "",
    cepik,
    vin,
    plate,
    fr,
    v.listing_url    ?? "",
    s.__firstSeenAt  ?? "",
    s.__lastSeenAt   ?? "",
  ].map(escapeCsv).join(",");
}

const CSV_HEADER = [
  "Marka","Model","Rok","Cena (PLN)","Przebieg (km)","Paliwo","Skrzynia",
  "Moc (KM)","Pojemność (cm³)","Portal","Filtr","CEPiK",
  "VIN","Nr rej.","Data 1. rej.","URL ogłoszenia","Pierwsza data","Ostatnia data",
].join(",");

export function useExport() {
  const exportCsv = useCallback((vehicles, filename = "baza-pojazdow.csv") => {
    const lines = [CSV_HEADER, ...vehicles.map(rowToCsvLine)];
    const blob  = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportJson = useCallback((vehicles, filename = "baza-pojazdow.json") => {
    const payload = vehicles.map(v => {
      const s = v.snapshot_json || {};
      return {
        id:             v.id,
        listing_url:    v.listing_url,
        brand:          s.brand,
        model:          s.model,
        year:           s.year,
        price:          s.price,
        currency:       s.currency,
        mileage:        s.mileage,
        fuelType:       s.fuelType,
        transmission:   s.transmission,
        enginePower:    s.enginePower,
        engineDisplacement: s.engineDisplacement,
        vin:            v.manual_vin           ?? s.vin,
        licensePlate:   v.manual_license_plate ?? s.licensePlate,
        firstRegistration: v.manual_first_registration ?? s.firstRegistration,
        portal:         s.portal,
        filterName:     s.__filterName,
        firstSeenAt:    s.__firstSeenAt,
        lastSeenAt:     s.__lastSeenAt,
        isNew:          s.__isNew,
        isArchived:     s.__archived,
        priceHistory:   s.__priceHistory,
        cepikStatus:    v.verification
          ? (v.verification.warning_count > 0 ? "issues"
             : v.verification.ok_count > 0     ? "ok"
             : "check")
          : null,
        cepikOkCount:      v.verification?.ok_count,
        cepikWarningCount: v.verification?.warning_count,
      };
    });

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportCsv, exportJson };
}
