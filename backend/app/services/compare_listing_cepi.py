"""Porównanie snapshotu ogłoszenia z danymi znormalizowanymi z CEPiK."""

from __future__ import annotations

import re
from typing import Any


def _norm_str(s: Any) -> str:
    if s is None:
        return ""
    t = str(s).lower().strip()
    t = re.sub(r"\s+", " ", t)
    return t


def _to_int(v: Any) -> int | None:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = (
        str(v)
        .replace("\u00a0", " ")
        .replace(" ", "")
        .replace("km", "")
        .replace("KM", "")
    )
    if re.match(r"^\d{1,3}([.,]\d{3})+$", s):
        return int(re.sub(r"[.,]", "", s))
    s = re.sub(r"[^\d]", "", s)
    return int(s) if s else None


def _year_from_listing(y: Any) -> int | None:
    return _to_int(y)


def _mileage_from_reading(r: dict[str, Any]) -> int | None:
    v = r.get("value")
    return _to_int(v)


def _extract_iso_date(s: Any) -> str | None:
    if s is None:
        return None
    text = str(s).strip()
    if not text:
        return None
    m_iso = re.search(r"(\d{4})[-/.](\d{2})[-/.](\d{2})", text)
    if m_iso:
        return f"{m_iso.group(1)}-{m_iso.group(2)}-{m_iso.group(3)}"
    m_pl_num = re.search(r"(\d{2})[-/.](\d{2})[-/.](\d{4})", text)
    if m_pl_num:
        return f"{m_pl_num.group(3)}-{m_pl_num.group(2)}-{m_pl_num.group(1)}"
    months = {
        "stycznia": "01",
        "lutego": "02",
        "marca": "03",
        "kwietnia": "04",
        "maja": "05",
        "czerwca": "06",
        "lipca": "07",
        "sierpnia": "08",
        "wrzesnia": "09",
        "pazdziernika": "10",
        "listopada": "11",
        "grudnia": "12",
    }
    norm = (
        text.lower()
        .replace("ą", "a")
        .replace("ć", "c")
        .replace("ę", "e")
        .replace("ł", "l")
        .replace("ń", "n")
        .replace("ó", "o")
        .replace("ś", "s")
        .replace("ź", "z")
        .replace("ż", "z")
    )
    m_pl_text = re.search(r"(\d{1,2})\s+([a-z]+)\s+(\d{4})", norm)
    if m_pl_text:
        dd = str(int(m_pl_text.group(1))).zfill(2)
        mm = months.get(m_pl_text.group(2))
        yyyy = m_pl_text.group(3)
        if mm:
            return f"{yyyy}-{mm}-{dd}"
    return None


def compare_listing_to_cepi(
    listing: dict[str, Any],
    technical_data: dict[str, Any],
    odometer_readings: list[dict[str, Any]],
    events: list[dict[str, Any]],
    tolerance_km: int,
) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def add_check(
        field: str,
        status: str,
        listing_val: Any,
        cepi_val: Any,
        message: str | None = None,
    ) -> None:
        checks.append(
            {
                "field": field,
                "status": status,
                "listing": listing_val,
                "cepi": cepi_val,
                "message": message,
            }
        )

    lb = _norm_str(listing.get("brand"))
    cb = _norm_str(technical_data.get("brand"))
    if lb and cb:
        if lb in cb or cb in lb or lb[:4] == cb[:4]:
            add_check("brand", "ok", listing.get("brand"), technical_data.get("brand"))
        else:
            add_check(
                "brand",
                "warning",
                listing.get("brand"),
                technical_data.get("brand"),
                "Marka w ogłoszeniu różni się od danych urzędowych",
            )
    elif cb:
        add_check("brand", "check", listing.get("brand"), technical_data.get("brand"), "Brak marki w ogłoszeniu")

    lm = _norm_str(listing.get("model"))
    cm = _norm_str(technical_data.get("model"))
    if lm and cm:
        if lm in cm or cm in lm:
            add_check("model", "ok", listing.get("model"), technical_data.get("model"))
        else:
            add_check(
                "model",
                "warning",
                listing.get("model"),
                technical_data.get("model"),
                "Model w ogłoszeniu różni się od danych urzędowych",
            )

    ly = _year_from_listing(listing.get("year"))
    cy = _year_from_listing(technical_data.get("year"))
    if ly and cy:
        if ly == cy:
            add_check("year", "ok", ly, cy)
        else:
            add_check("year", "warning", ly, cy, "Rok produkcji niezgodny z CEPiK")

    lf = _norm_str(listing.get("fuelType"))
    cf = _norm_str(technical_data.get("fuelType"))
    if lf and cf:
        if lf in cf or cf in lf or lf[:4] == cf[:4]:
            add_check("fuelType", "ok", listing.get("fuelType"), technical_data.get("fuelType"))
        else:
            add_check(
                "fuelType",
                "warning",
                listing.get("fuelType"),
                technical_data.get("fuelType"),
                "Rodzaj paliwa może się różnić",
            )

    lcc = _to_int(listing.get("engineDisplacement"))
    ccc = _to_int(technical_data.get("engineDisplacement"))
    if lcc and ccc and abs(lcc - ccc) <= max(50, int(0.05 * ccc)):
        add_check("engineDisplacement", "ok", lcc, ccc)
    elif lcc and ccc:
        add_check(
            "engineDisplacement",
            "warning",
            lcc,
            ccc,
            "Pojemność silnika różni się od wpisu w CEPiK",
        )

    lp = _to_int(listing.get("enginePower"))
    cp = _to_int(technical_data.get("enginePower"))
    if lp and cp and abs(lp - cp) <= 5:
        add_check("enginePower", "ok", lp, cp)
    elif lp and cp:
        add_check("enginePower", "warning", lp, cp, "Moc silnika różni się od CEPiK")

    listing_mileage = _to_int(listing.get("mileage"))
    latest_odo = None
    for r in sorted(odometer_readings, key=lambda x: _to_int(x.get("odometerNumber")) or 0, reverse=True):
        latest_odo = _mileage_from_reading(r)
        if latest_odo is not None:
            break
    if latest_odo is None and odometer_readings:
        latest_odo = _mileage_from_reading(odometer_readings[-1])

    if listing_mileage is not None and latest_odo is not None:
        diff = abs(listing_mileage - latest_odo)
        if diff <= tolerance_km:
            add_check(
                "mileage",
                "ok",
                listing_mileage,
                latest_odo,
                f"Przebieg zgodny w tolerancji ±{tolerance_km} km",
            )
        else:
            add_check(
                "mileage",
                "warning",
                listing_mileage,
                latest_odo,
                f"Rozjazd przebiegu: ogłoszenie {listing_mileage} km vs ostatni wpis CEPiK {latest_odo} km (tolerancja {tolerance_km} km)",
            )
    elif listing_mileage is not None:
        add_check(
            "mileage",
            "check",
            listing_mileage,
            None,
            "Brak odczytów przebiegu w odpowiedzi CEPiK",
        )

    listing_first_reg_raw = listing.get("firstRegistration")
    listing_first_reg_iso = _extract_iso_date(listing_first_reg_raw)
    cepik_first_reg_raw = technical_data.get("firstRegistrationDate")
    cepik_first_reg_iso = _extract_iso_date(cepik_first_reg_raw)
    first_reg_event_name = None
    first_reg_event_date_iso = None
    for ev in events or []:
        if not isinstance(ev, dict):
            continue
        raw = ev.get("raw") if isinstance(ev.get("raw"), dict) else {}
        event_name = raw.get("eventName") if isinstance(raw, dict) else None
        event_type = _norm_str(ev.get("type"))
        if event_name and ("pierwsza rejestracja" in _norm_str(event_name) or "pierwsza-rejestracja" in event_type):
            first_reg_event_name = event_name
            first_reg_event_date_iso = _extract_iso_date(raw.get("eventDate") if isinstance(raw, dict) else None) or _extract_iso_date(ev.get("date"))
            break

    # Preferuj datę z technicalData, a gdy jej brak to event pierwszej rejestracji (np. "za granicą").
    cepik_first_reg_best_iso = cepik_first_reg_iso or first_reg_event_date_iso
    cepik_first_reg_best_raw = cepik_first_reg_raw or first_reg_event_date_iso

    if listing_first_reg_iso and cepik_first_reg_best_iso:
        same = listing_first_reg_iso == cepik_first_reg_best_iso
        msg_suffix = f" (event: {first_reg_event_name})" if first_reg_event_name else ""
        if same:
            add_check(
                "firstRegistration",
                "ok",
                listing_first_reg_raw,
                cepik_first_reg_best_raw,
                f"Data pierwszej rejestracji zgodna z CEPiK{msg_suffix}",
            )
        else:
            add_check(
                "firstRegistration",
                "warning",
                listing_first_reg_raw,
                cepik_first_reg_best_raw,
                f"Data pierwszej rejestracji różni się od CEPiK{msg_suffix}",
            )
    elif listing_first_reg_raw:
        msg_suffix = f" (event: {first_reg_event_name})" if first_reg_event_name else ""
        add_check(
            "firstRegistration",
            "check",
            listing_first_reg_raw,
            cepik_first_reg_best_raw,
            f"Brak pełnej daty pierwszej rejestracji w CEPiK{msg_suffix}",
        )

    warnings = sum(1 for c in checks if c["status"] == "warning")
    oks = sum(1 for c in checks if c["status"] == "ok")
    return {
        "checks": checks,
        "summary": {
            "okCount": oks,
            "warningCount": warnings,
            "toleranceKm": tolerance_km,
        },
    }
