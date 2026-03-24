"""Historia pojazdu (CEPiK) — sesja jak w cepik_fetcher.py."""

import re
import time

import requests

MAIN_URL = "https://moj.gov.pl/nforms/engine/ng/index?xFormsAppName=HistoriaPojazdu"
VEHICLE_DATA_URL = "https://moj.gov.pl/nforms/api/HistoriaPojazdu/1.0.20/data/vehicle-data"
TIMELINE_URL = "https://moj.gov.pl/nforms/api/HistoriaPojazdu/1.0.20/data/timeline-data"


def _normalize_first_registration_date(value: str) -> str:
    s = (value or "").strip()
    if not s:
        return s
    m_iso = re.match(r"^(\d{4})[-/.](\d{2})[-/.](\d{2})$", s)
    if m_iso:
        return f"{m_iso.group(1)}-{m_iso.group(2)}-{m_iso.group(3)}"
    m_pl_num = re.match(r"^(\d{2})[-/.](\d{2})[-/.](\d{4})$", s)
    if m_pl_num:
        return f"{m_pl_num.group(3)}-{m_pl_num.group(2)}-{m_pl_num.group(1)}"
    month_map = {
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
    s_norm = (
        s.lower()
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
    m_pl_text = re.match(r"^(\d{1,2})\s+([a-z]+)\s+(\d{4})$", s_norm)
    if m_pl_text:
        dd = str(int(m_pl_text.group(1))).zfill(2)
        mm = month_map.get(m_pl_text.group(2))
        yyyy = m_pl_text.group(3)
        if mm:
            return f"{yyyy}-{mm}-{dd}"
    return s


def build_session_value() -> str:
    app_name = "HistoriaPojazdu"
    timestamp = int(time.time() * 1000)
    return f"{app_name}:{timestamp}"


class HistoriaPojazduClient:
    def __init__(self) -> None:
        self._init_session()

    def _init_session(self) -> None:
        self.session = requests.Session()
        self.nf_wid = build_session_value()
        form_data = {
            "NF_WID": self.nf_wid,
            "varKey": "NF_WID",
            "varApplicationName": "HistoriaPojazdu",
        }
        resp = self.session.post(MAIN_URL, data=form_data, timeout=30)
        resp.raise_for_status()
        self.xsrf_token = self.session.cookies.get("XSRF-TOKEN")
        if not self.xsrf_token:
            raise RuntimeError("Brak XSRF-TOKEN — sesja nie została poprawnie zainicjalizowana")

    def _build_headers(self) -> dict[str, str]:
        return {
            "NF_WID": self.nf_wid,
            "X-XSRF-TOKEN": self.xsrf_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def get_vehicle_data(self, registration_number: str, vin_number: str, first_registration_date: str) -> dict:
        reg = registration_number.strip()
        vin = vin_number.strip()
        frd = _normalize_first_registration_date(first_registration_date)
        payload = {
            "registrationNumber": reg,
            "VINNumber": vin,
            "firstRegistrationDate": frd,
        }
        resp = self.session.post(
            VEHICLE_DATA_URL, headers=self._build_headers(), json=payload, timeout=45
        )
        resp.raise_for_status()
        return resp.json()

    def get_timeline_data(self, registration_number: str, vin_number: str, first_registration_date: str) -> dict:
        frd = _normalize_first_registration_date(first_registration_date)
        payload = {
            "registrationNumber": registration_number.strip(),
            "VINNumber": vin_number.strip(),
            "firstRegistrationDate": frd,
        }
        resp = self.session.post(
            TIMELINE_URL, headers=self._build_headers(), json=payload, timeout=45
        )
        resp.raise_for_status()
        return resp.json()

    def fetch_full_data(
        self, registration_number: str, vin_number: str, first_registration_date: str
    ) -> dict:
        vehicle = self.get_vehicle_data(registration_number, vin_number, first_registration_date)
        timeline = self.get_timeline_data(registration_number, vin_number, first_registration_date)
        odometers = timeline.get("timelineData", {}).get("odometerReadings", [])
        return {"vehicle": vehicle, "timeline": timeline, "odometers": odometers}


def fetch_with_retry(registration_number: str, vin_number: str, first_registration_date: str, retries: int = 2) -> dict:
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            client = HistoriaPojazduClient()
            return client.fetch_full_data(registration_number, vin_number, first_registration_date)
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    raise last_err or RuntimeError("CEPiK fetch failed")
