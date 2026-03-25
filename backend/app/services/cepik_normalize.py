"""Mapowanie odpowiedzi HistoriaPojazdu → DTO (technicalData, odometerReadings, events)."""

from __future__ import annotations

import re
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
        out.setdefault(
            "validOcInsurance",
            basic.get("validOcInsurance") if basic.get("validOcInsurance") is not None else basic.get("hasCurrentOCPolicy"),
        )
        out.setdefault("insuranceExpiryDate", basic.get("insuranceExpiryDate"))
        out.setdefault("registrationProvince", basic.get("registrationProvince"))
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


def _coerce_odometer_km(value: Any) -> int | None:
    """Wartość przebiegu z API (np. liczba, „123 456”, „123.456 km”, zagnieżdżony obiekt)."""
    if value is None:
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(value)
    if isinstance(value, dict):
        for k in ("value", "amount", "kilometers", "reading", "odometerValue", "mileage"):
            inner = value.get(k)
            km = _coerce_odometer_km(inner)
            if km is not None:
                return km
        return None
    s0 = str(value).replace("\u00a0", " ")
    s = (
        s0.replace(" ", "")
        .replace("km", "")
        .replace("KM", "")
    )
    if re.match(r"^\d{1,3}([.,]\d{3})+$", s):
        return int(re.sub(r"[.,]", "", s))
    if re.match(r"^\d+([.,]\d+)?$", s):
        s2 = s.replace(",", ".")
        try:
            return int(float(s2))
        except ValueError:
            pass
    digits = re.sub(r"[^\d]", "", s0)
    return int(digits) if digits else None


def _first_non_empty(*candidates: Any) -> Any:
    for c in candidates:
        if c is None:
            continue
        if isinstance(c, str) and not c.strip():
            continue
        return c
    return None


def _normalize_odometer_entry(item: Any) -> dict[str, Any] | None:
    """Spłaszcza jeden wpis z moj.gov.pl do pól zrozumiałych dla frontu (mileage, date, …)."""
    if not isinstance(item, dict):
        return None
    raw = item.get("raw")
    raw_d = raw if isinstance(raw, dict) else {}

    km = _coerce_odometer_km(item.get("value"))
    if km is None:
        km = _coerce_odometer_km(item.get("mileage"))
    if km is None:
        km = _coerce_odometer_km(item.get("odometerValue"))
    if km is None:
        km = _coerce_odometer_km(item.get("reading"))
    if km is None:
        return None

    date_val = _first_non_empty(
        item.get("date"),
        item.get("checkDate"),
        item.get("readingDate"),
        item.get("eventDate"),
        item.get("odometerReadingDate"),
        item.get("measurementDate"),
        _dig(raw_d, "eventDate"),
        _dig(raw_d, "checkDate"),
        _dig(raw_d, "readingDate"),
        _dig(raw_d, "date"),
    )

    out: dict[str, Any] = {
        "mileage": km,
        "value": km,
        "date": date_val,
        "checkDate": date_val,
    }
    on = item.get("odometerNumber")
    if on is not None:
        out["odometerNumber"] = on
    if "rolledBack" in item:
        out["rolledBack"] = item.get("rolledBack")
    return out


def _extract_odometer_list(tl: dict[str, Any], tdata: dict[str, Any]) -> list[Any]:
    raw = tdata.get("odometerReadings")
    if isinstance(raw, list) and raw:
        return raw
    alt = tl.get("odometerReadings")
    if isinstance(alt, list):
        return alt
    inner = tl.get("data")
    if isinstance(inner, dict):
        nested = inner.get("odometerReadings")
        if isinstance(nested, list):
            return nested
    return raw if isinstance(raw, list) else []


def _extract_odometer_from_vehicle_basic(vehicle_raw: dict[str, Any] | None) -> list[Any]:
    """technicalData.basicData.odometerReadings — często jeden wpis „FIRST” (jak w timeline)."""
    if not vehicle_raw or not isinstance(vehicle_raw, dict):
        return []
    td = vehicle_raw.get("technicalData")
    if not isinstance(td, dict):
        return []
    basic = td.get("basicData")
    if not isinstance(basic, dict):
        return []
    ors = basic.get("odometerReadings")
    return ors if isinstance(ors, list) else []


def _extract_odometer_from_timeline_event(ev: dict[str, Any]) -> dict[str, Any] | None:
    """
    Pełna historia przebiegu jest w zdarzeniach: eventDetails z nazwą typu
    „Odczytany stan drogomierza” + wartość „7100 km” (por. timelineData.events w API).
    """
    date_raw = ev.get("eventDate") or ev.get("date")
    if not date_raw:
        return None
    details = ev.get("eventDetails")
    if not isinstance(details, list):
        return None
    km: int | None = None
    for d in details:
        if not isinstance(d, dict):
            continue
        name = str(d.get("name") or "").lower()
        val = d.get("value")
        if "drogomierz" in name or "stan drogomierza" in name:
            cand = _coerce_odometer_km(val)
            if cand is not None:
                km = cand
                break
    if km is None:
        for d in details:
            if not isinstance(d, dict):
                continue
            val = d.get("value")
            if isinstance(val, str) and re.search(r"\d", val) and "km" in val.lower():
                cand = _coerce_odometer_km(val)
                if cand is not None:
                    km = cand
                    break
    if km is None:
        return None
    return {
        "mileage": km,
        "value": km,
        "date": date_raw,
        "checkDate": date_raw,
        "source": "timeline_event",
        "eventType": ev.get("eventType"),
        "eventName": ev.get("eventName"),
    }


def _date_sort_key(d: dict[str, Any]) -> tuple[int, int, int, int]:
    dstr = str(d.get("date") or d.get("checkDate") or "").strip()
    if not dstr:
        return (9999, 12, 31, int(d.get("mileage") or d.get("value") or 0))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", dstr)
    if m:
        return (
            int(m.group(1)),
            int(m.group(2)),
            int(m.group(3)),
            int(d.get("mileage") or d.get("value") or 0),
        )
    return (9999, 12, 31, int(d.get("mileage") or d.get("value") or 0))


def _merge_odometer_readings(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Scala wpisy z odometerReadings i z zdarzeń; usuwa redundantne wpisy bez daty, gdy km jest w historii."""
    dated_kms: set[int] = set()
    for it in items:
        ds = str(it.get("date") or it.get("checkDate") or "").strip()
        if not ds:
            continue
        km = it.get("mileage") if it.get("mileage") is not None else it.get("value")
        if isinstance(km, (int, float)):
            dated_kms.add(int(km))

    filtered: list[dict[str, Any]] = []
    for it in items:
        km = it.get("mileage") if it.get("mileage") is not None else it.get("value")
        if km is None:
            continue
        km = int(km)
        ds = str(it.get("date") or it.get("checkDate") or "").strip()
        if not ds and km in dated_kms:
            continue
        filtered.append(it)

    seen: set[tuple[str, int]] = set()
    out: list[dict[str, Any]] = []
    for it in sorted(filtered, key=_date_sort_key):
        km = it.get("mileage") if it.get("mileage") is not None else it.get("value")
        if km is None:
            continue
        km = int(km)
        ds = str(it.get("date") or it.get("checkDate") or "").strip()
        key = (ds, km)
        if key in seen:
            continue
        seen.add(key)
        out.append(it)
    return out


def normalize_response(
    vehicle_raw: dict[str, Any] | None, timeline_raw: dict[str, Any] | None
) -> dict[str, Any]:
    td = extract_vehicle_core(vehicle_raw)

    tl = timeline_raw or {}
    tdata = tl.get("timelineData") or tl.get("data") or {}
    if not isinstance(tdata, dict):
        tdata = {}

    # Liczniki właścicieli i współwłaścicieli oraz ubezpieczenie (często w timelineData).
    for k in ("totalOwners", "totalCoOwners", "currentOwners", "currentCoOwners", "insuranceExpiryDate", "registrationProvince"):
        if k in tdata and td.get(k) in (None, ""):
            td[k] = tdata.get(k)

    raw_odo = _extract_odometer_list(tl, tdata)
    odometer_norm: list[dict[str, Any]] = []
    for entry in raw_odo:
        norm_one = _normalize_odometer_entry(entry)
        if norm_one:
            odometer_norm.append(norm_one)

    for entry in _extract_odometer_from_vehicle_basic(vehicle_raw or {}):
        norm_one = _normalize_odometer_entry(entry)
        if norm_one:
            odometer_norm.append(norm_one)

    events = tdata.get("events") or tdata.get("timelineEvents") or tl.get("events")
    if not isinstance(events, list):
        events = []

    for ev in events:
        if isinstance(ev, dict):
            from_event = _extract_odometer_from_timeline_event(ev)
            if from_event:
                odometer_norm.append(from_event)

    odometer_norm = _merge_odometer_readings(odometer_norm)

    events_norm: list[dict[str, Any]] = []
    for ev in events:
        if isinstance(ev, dict):
            events_norm.append(
                {
                    "date": ev.get("date") or ev.get("eventDate") or ev.get("data"),
                    "type": ev.get("type") or ev.get("eventType") or ev.get("typ"),
                    "description": ev.get("description") or ev.get("opis") or ev.get("name"),
                    "eventName": ev.get("eventName"),
                    "raw": ev,
                }
            )

    return {
        "technicalData": td,
        "odometerReadings": odometer_norm,
        "events": events_norm,
    }
