from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_current_user
from app.database import get_db

router = APIRouter(prefix="/searches", tags=["searches"])


def _norm_url(url: str) -> str:
    return url.strip().rstrip("/")


@router.get("", response_model=list[schemas.SearchHistoryOut])
def list_searches(
    listing_url: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    q = db.query(models.Search).filter(models.Search.user_id == user.id)
    if listing_url:
        norm = _norm_url(listing_url)
        q = q.filter(models.Search.listing_url == norm)
    rows = q.order_by(models.Search.created_at.desc()).all()
    out: list[schemas.SearchHistoryOut] = []
    for s in rows:
        latest = (
            db.query(models.CepikVerification)
            .filter(models.CepikVerification.search_id == s.id)
            .order_by(models.CepikVerification.created_at.desc())
            .first()
        )
        verification = None
        if latest and isinstance(latest.comparison_json, dict):
            checks = latest.comparison_json.get("checks") or []
            ok_count = sum(1 for c in checks if isinstance(c, dict) and c.get("status") == "ok")
            warning_count = sum(1 for c in checks if isinstance(c, dict) and c.get("status") == "warning")
            check_count = sum(1 for c in checks if isinstance(c, dict) and c.get("status") == "check")
            if warning_count > 0:
                status_name = "warning"
            elif ok_count > 0 and check_count == 0:
                status_name = "ok"
            else:
                status_name = "check"
            verification = schemas.SearchVerificationSummary(
                status=status_name,
                ok_count=ok_count,
                warning_count=warning_count,
                check_count=check_count,
                created_at=latest.created_at,
            )
        out.append(
            schemas.SearchHistoryOut(
                id=s.id,
                user_id=s.user_id,
                listing_url=s.listing_url,
                snapshot_json=s.snapshot_json,
                manual_vin=s.manual_vin,
                manual_first_registration=s.manual_first_registration,
                manual_license_plate=s.manual_license_plate,
                created_at=s.created_at,
                verification=verification,
            )
        )
    return out


@router.post("", response_model=schemas.SearchOut, status_code=status.HTTP_201_CREATED)
def create_search(
    body: schemas.SearchCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    norm_url = _norm_url(body.listing_url)
    s = (
        db.query(models.Search)
        .filter(models.Search.user_id == user.id, models.Search.listing_url == norm_url)
        .first()
    )
    if s:
        s.snapshot_json = body.snapshot_json
        s.manual_vin = body.manual_vin
        s.manual_first_registration = body.manual_first_registration
        s.manual_license_plate = body.manual_license_plate
    else:
        s = models.Search(
            user_id=user.id,
            listing_url=norm_url,
            snapshot_json=body.snapshot_json,
            manual_vin=body.manual_vin,
            manual_first_registration=body.manual_first_registration,
            manual_license_plate=body.manual_license_plate,
        )
        db.add(s)
    db.commit()
    db.refresh(s)
    if body.latest_verification and isinstance(body.latest_verification, dict):
        lv = body.latest_verification
        normalized = {
            "technicalData": lv.get("technicalData") or {},
            "odometerReadings": lv.get("odometerReadings") or [],
            "events": lv.get("events") or [],
        }
        v = models.CepikVerification(
            search_id=s.id,
            vehicle_raw=lv.get("vehicleRaw"),
            timeline_raw=lv.get("timelineRaw"),
            normalized_json=normalized,
            comparison_json=lv.get("comparison"),
            cache_hit=bool((lv.get("meta") or {}).get("cacheHit", False)),
        )
        db.add(v)
        db.commit()
    return s


# FIX #4: /lookup/by-url MUST be declared before /{search_id} to prevent
# FastAPI from matching "lookup" as a search_id and returning 422.
@router.get("/lookup/by-url", response_model=schemas.SearchDetailOut | None)
def get_search_by_url(
    listing_url: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    norm = _norm_url(listing_url)
    s = db.query(models.Search).filter(models.Search.user_id == user.id, models.Search.listing_url == norm).first()
    if not s:
        return None
    latest = (
        db.query(models.CepikVerification)
        .filter(models.CepikVerification.search_id == s.id)
        .order_by(models.CepikVerification.created_at.desc())
        .first()
    )
    latest_verification = None
    if latest:
        latest_verification = {
            "id": latest.id,
            "normalized": latest.normalized_json,
            "comparison": latest.comparison_json,
            "cache_hit": latest.cache_hit,
            "created_at": latest.created_at.isoformat() if latest.created_at else None,
        }
    return schemas.SearchDetailOut(
        id=s.id,
        user_id=s.user_id,
        listing_url=s.listing_url,
        snapshot_json=s.snapshot_json,
        manual_vin=s.manual_vin,
        manual_first_registration=s.manual_first_registration,
        manual_license_plate=s.manual_license_plate,
        created_at=s.created_at,
        latest_verification=latest_verification,
    )


@router.patch("/{search_id}", response_model=schemas.SearchOut)
def patch_search(
    search_id: int,
    body: schemas.SearchUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    s = db.query(models.Search).filter(models.Search.id == search_id, models.Search.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Search not found")
    data = body.model_dump(exclude_unset=True)
    if "manual_vin" in data:
        s.manual_vin = data["manual_vin"]
    if "manual_first_registration" in data:
        s.manual_first_registration = data["manual_first_registration"]
    if "manual_license_plate" in data:
        s.manual_license_plate = data["manual_license_plate"]
    if "snapshot_json" in data and data["snapshot_json"] is not None:
        s.snapshot_json = data["snapshot_json"]
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_search(
    search_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    s = db.query(models.Search).filter(models.Search.id == search_id, models.Search.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Search not found")
    db.query(models.CepikVerification).filter(models.CepikVerification.search_id == s.id).delete()
    db.delete(s)
    db.commit()
    return None


@router.get("/{search_id}", response_model=schemas.SearchDetailOut)
def get_search(
    search_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    s = db.query(models.Search).filter(models.Search.id == search_id, models.Search.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Search not found")
    latest = (
        db.query(models.CepikVerification)
        .filter(models.CepikVerification.search_id == s.id)
        .order_by(models.CepikVerification.created_at.desc())
        .first()
    )
    latest_verification = None
    if latest:
        latest_verification = {
            "id": latest.id,
            "normalized": latest.normalized_json,
            "comparison": latest.comparison_json,
            "cache_hit": latest.cache_hit,
            "created_at": latest.created_at.isoformat() if latest.created_at else None,
        }
    return schemas.SearchDetailOut(
        id=s.id,
        user_id=s.user_id,
        listing_url=s.listing_url,
        snapshot_json=s.snapshot_json,
        manual_vin=s.manual_vin,
        manual_first_registration=s.manual_first_registration,
        manual_license_plate=s.manual_license_plate,
        created_at=s.created_at,
        latest_verification=latest_verification,
    )
