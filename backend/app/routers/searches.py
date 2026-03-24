from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_current_user
from app.database import get_db

router = APIRouter(prefix="/searches", tags=["searches"])


@router.get("", response_model=list[schemas.SearchOut])
def list_searches(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.Search)
        .filter(models.Search.user_id == user.id)
        .order_by(models.Search.created_at.desc())
        .all()
    )
    return rows


@router.post("", response_model=schemas.SearchOut, status_code=status.HTTP_201_CREATED)
def create_search(
    body: schemas.SearchCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    s = models.Search(
        user_id=user.id,
        listing_url=body.listing_url,
        snapshot_json=body.snapshot_json,
        manual_vin=body.manual_vin,
        manual_first_registration=body.manual_first_registration,
        manual_license_plate=body.manual_license_plate,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


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
