import requests
import time
import json

MAIN_URL = "https://moj.gov.pl/nforms/engine/ng/index?xFormsAppName=HistoriaPojazdu"
VEHICLE_DATA_URL = "https://moj.gov.pl/nforms/api/HistoriaPojazdu/1.0.20/data/vehicle-data"
TIMELINE_URL = "https://moj.gov.pl/nforms/api/HistoriaPojazdu/1.0.20/data/timeline-data"

def build_session_value():
    app_name = "HistoriaPojazdu"
    timestamp = int(time.time() * 1000)
    return f"{app_name}:{timestamp}"

class HistoriaPojazduClient:
    def __init__(self):
        self._init_session()

    def _init_session(self):
        self.session = requests.Session()
        self.nf_wid = build_session_value()
        # inicjalizacja sesji
        form_data = {
            "NF_WID": self.nf_wid,
            "varKey": "NF_WID",
            "varApplicationName": "HistoriaPojazdu"
        }
        resp = self.session.post(MAIN_URL, data=form_data)
        self.xsrf_token = self.session.cookies.get('XSRF-TOKEN')
        if not self.xsrf_token:
            raise Exception("Brak XSRF-TOKEN - sesja nie została poprawnie zainicjalizowana")

    def _build_headers(self):
        return {
            "NF_WID": self.nf_wid,
            "X-XSRF-TOKEN": self.xsrf_token,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def get_vehicle_data(self, registration_number, vin_number, first_registration_date):
        payload = {
            "registrationNumber": registration_number,
            "VINNumber": vin_number,
            "firstRegistrationDate": first_registration_date
        }
        resp = self.session.post(VEHICLE_DATA_URL, headers=self._build_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()

    def get_timeline_data(self, registration_number, vin_number, first_registration_date):
        payload = {
            "registrationNumber": registration_number,
            "VINNumber": vin_number,
            "firstRegistrationDate": first_registration_date
        }
        resp = self.session.post(TIMELINE_URL, headers=self._build_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()

    def fetch_full_data(self, registration_number, vin_number, first_registration_date):
        vehicle = self.get_vehicle_data(registration_number, vin_number, first_registration_date)
        timeline = self.get_timeline_data(registration_number, vin_number, first_registration_date)

        # ekstrahowanie przebiegów
        odometers = timeline.get("timelineData", {}).get("odometerReadings", [])
        return {
            "vehicle": vehicle,
            "timeline": timeline,
            "odometers": odometers
        }

if __name__ == "__main__":
    print("=== HistoriaPojazdu Fetcher ===")
    registration_number = input("Nr rejestracyjny: ")
    vin_number = input("VIN: ")
    first_registration_date = input("Data pierwszej rejestracji (YYYY-MM-DD): ")

    client = HistoriaPojazduClient()
    data = client.fetch_full_data(registration_number, vin_number, first_registration_date)

    print("\n=== WYCIĄGNIĘTE PRZEBIEGI ===")
    for odo in data["odometers"]:
        print(f"PRZEBIEG: {odo['value']} {odo['unit']} | odometerNumber: {odo['odometerNumber']}")

    print("\n=== PEŁNE DANE POJAZDU ===")
    print(json.dumps(data["vehicle"], indent=2, ensure_ascii=False))

    print("\n=== PEŁNA OŚ CZASU (timeline) ===")
    print(json.dumps(data["timeline"], indent=2, ensure_ascii=False))