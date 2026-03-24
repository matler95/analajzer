from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.deps import get_current_user
from app.database import get_db
from app.services import cepik_normalize, compare_listing_cepi
from app.services.cache_service import cache_key, get_cache_backend
from app.services.cepik_client import fetch_with_retry
from app.services.rate_limit import cepik_allow

router = APIRouter(prefix="/cepik", tags=["cepik"])


@router.post("/verify", response_model=schemas.CepikVerifyResponse)
def verify_cepi(
    body: schemas.CepikVerifyRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not body.registration_number or not body.vin_number or not body.first_registration_date:
        raise HTTPException(
            status_code=400,
            detail="Wymagane: registration_number, vin_number, first_registration_date",
        )

    key = cache_key(body.vin_number, body.registration_number, body.first_registration_date)
    backend = get_cache_backend(db)
    cache_hit = False
    vehicle_raw: dict | None = None
    timeline_raw: dict | None = None

    if not body.force_refresh:
        cached = backend.get(key)
        if cached:
            cache_hit = True
            vehicle_raw = cached.get("vehicle")
            timeline_raw = cached.get("timeline")

    if not cache_hit:
        if not cepik_allow():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limit wywołań CEPiK — spróbuj za chwilę",
            )
        try:
            full = fetch_with_retry(
                body.registration_number,
                body.vin_number,
                body.first_registration_date,
            )
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Błąd pobierania danych z moj.gov.pl: {e!s}",
            ) from e
        vehicle_raw = full["vehicle"]
        timeline_raw = full["timeline"]
        backend.set(
            key,
            {"vehicle": vehicle_raw, "timeline": timeline_raw},
            settings.cepik_cache_ttl_seconds,
        )

    norm = cepik_normalize.normalize_response(vehicle_raw, timeline_raw)
    listing = body.listing_snapshot or {}
    search_row: models.Search | None = None
    if body.search_id is not None:
        search_row = (
            db.query(models.Search)
            .filter(models.Search.id == body.search_id, models.Search.user_id == user.id)
            .first()
        )
        if not search_row:
            raise HTTPException(status_code=404, detail="Search not found")
        listing = search_row.snapshot_json or listing

    comparison = compare_listing_cepi.compare_listing_to_cepi(
        listing,
        norm["technicalData"],
        norm["odometerReadings"],
        norm["events"],
        settings.odometer_tolerance_km,
    )

    meta = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "cacheHit": cache_hit,
        "cacheKey": key[:16] + "…",
    }

    verification_id = None
    if search_row is not None:
        v = models.CepikVerification(
            search_id=search_row.id,
            vehicle_raw=vehicle_raw,
            timeline_raw=timeline_raw,
            normalized_json=norm,
            comparison_json=comparison,
            cache_hit=cache_hit,
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        verification_id = v.id

    return schemas.CepikVerifyResponse(
        technicalData=norm["technicalData"],
        odometerReadings=norm["odometerReadings"],
        events=norm["events"],
        meta=meta,
        comparison=comparison,
        verification_id=verification_id,
    )
