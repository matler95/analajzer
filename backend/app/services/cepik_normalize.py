"""Mapowanie odpowiedzi HistoriaPojazdu → DTO (technicalData, odometerReadings, events)."""

from __future__ import annotations

from typing import Any


def _dig(d: dict[str, Any], *keys: str) -> Any:
    cur: Any = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def _first_dict(*candidates: Any) -> dict[str, Any] | None:
    for c in candidates:
        if isinstance(c, dict) and c:
            return c
    return None


def extract_vehicle_core(vehicle: dict[str, Any] | None) -> dict[str, Any]:
    if not vehicle:
        return {}
    inner = (
        _first_dict(
            vehicle.get("vehicleData"),
            vehicle.get("data"),
            vehicle.get("vehicle"),
            vehicle,
        )
        or vehicle
    )
    out: dict[str, Any] = {}
    mapping = [
        ("brand", "brand", "make", "marka", "vehicleMake"),
        ("model", "model", "modelName", "modelDescription"),
        ("year", "year", "productionYear", "rokProdukcji"),
        ("fuelType", "fuelType", "rodzajPaliwa", "fuel"),
        ("engineDisplacement", "engineCapacity", "pojemnoscSkokowa", "capacity"),
        ("enginePower", "enginePower", "moc", "power"),
        ("vin", "vin", "VIN", "VINNumber"),
        ("registrationNumber", "registrationNumber", "numerRejestracyjny"),
        ("firstRegistrationDate", "firstRegistrationDate", "dataPierwszejRejestracji"),
    ]
    for out_key, *src_keys in mapping:
        for sk in src_keys:
            v = inner.get(sk) if isinstance(inner, dict) else None
            if v is not None and v != "":
                out[out_key] = v
                break

    # Obsługa realnego formatu moj.gov.pl:
    # vehicle_raw.technicalData.basicData + vehicle_raw.technicalData.detailedData
    technical_data = vehicle.get("technicalData") if isinstance(vehicle, dict) else None
    basic = technical_data.get("basicData") if isinstance(technical_data, dict) else {}
    detailed = technical_data.get("detailedData") if isinstance(technical_data, dict) else {}
    if isinstance(basic, dict):
        out.setdefault("brand", basic.get("make"))
        out.setdefault("model", basic.get("model"))
        out.setdefault("year", basic.get("yearOfManufacture"))
        out.setdefault("vin", basic.get("identifyingFeature"))
        out.setdefault("firstRegistrationDate", basic.get("firstRegistrationDate"))
    if isinstance(detailed, dict):
        out.setdefault("fuelType", detailed.get("fuelType"))
        out.setdefault("engineDisplacement", detailed.get("engineCapacity"))
        # CEPiK często zwraca moc w kW — konwersja do KM do porównania z ogłoszeniem.
        power_kw = detailed.get("maxNetEnginePower")
        if out.get("enginePower") in (None, "") and power_kw not in (None, ""):
            try:
                out["enginePower"] = int(round(float(power_kw) * 1.35962))
            except Exception:
                out["enginePower"] = power_kw

    # Usuń puste wartości po setdefault.
    out = {k: v for k, v in out.items() if v not in (None, "")}
    return out


def normalize_response(
    vehicle_raw: dict[str, Any] | None, timeline_raw: dict[str, Any] | None
) -> dict[str, Any]:
    td = extract_vehicle_core(vehicle_raw)

    tl = timeline_raw or {}
    tdata = tl.get("timelineData") or tl.get("data") or {}
    if not isinstance(tdata, dict):
        tdata = {}

    odometer_readings = tdata.get("odometerReadings")
    if not isinstance(odometer_readings, list):
        odometer_readings = []

    events = tdata.get("events") or tdata.get("timelineEvents") or tl.get("events")
    if not isinstance(events, list):
        events = []

    events_norm: list[dict[str, Any]] = []
    for ev in events:
        if isinstance(ev, dict):
            events_norm.append(
                {
                    "date": ev.get("date") or ev.get("eventDate") or ev.get("data"),
                    "type": ev.get("type") or ev.get("eventType") or ev.get("typ"),
                    "description": ev.get("description") or ev.get("opis") or ev.get("name"),
                    "raw": ev,
                }
            )

    return {
        "technicalData": td,
        "odometerReadings": odometer_readings,
        "events": events_norm,
    }
