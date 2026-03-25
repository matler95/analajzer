from app.database import SessionLocal
import json
from app.models import CepikVerification

db = SessionLocal()
ver = db.query(CepikVerification).filter(CepikVerification.timeline_raw != None).order_by(CepikVerification.id.desc()).first()
if ver:
    with open("debug_timeline.json", "w", encoding="utf-8") as f:
        json.dump(ver.timeline_raw, f, indent=2, ensure_ascii=False)
    print("Wrote debug_timeline.json")
