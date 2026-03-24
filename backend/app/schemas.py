from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class RefreshBody(BaseModel):
    refresh_token: str


class SearchUpdate(BaseModel):
    manual_vin: str | None = None
    manual_first_registration: str | None = None
    manual_license_plate: str | None = None
    snapshot_json: dict[str, Any] | None = None


class SearchCreate(BaseModel):
    listing_url: str
    snapshot_json: dict[str, Any]
    manual_vin: str | None = None
    manual_first_registration: str | None = None
    manual_license_plate: str | None = None
    latest_verification: dict[str, Any] | None = None


class SearchOut(BaseModel):
    id: int
    user_id: int
    listing_url: str
    snapshot_json: dict[str, Any]
    manual_vin: str | None
    manual_first_registration: str | None
    manual_license_plate: str | None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class SearchVerificationSummary(BaseModel):
    status: str
    ok_count: int = 0
    warning_count: int = 0
    check_count: int = 0
    created_at: datetime | None = None


class SearchHistoryOut(SearchOut):
    verification: SearchVerificationSummary | None = None


class SearchDetailOut(SearchOut):
    latest_verification: dict[str, Any] | None = None


class CepikVerifyRequest(BaseModel):
    search_id: int | None = None
    registration_number: str
    vin_number: str
    first_registration_date: str
    listing_snapshot: dict[str, Any] | None = None
    force_refresh: bool = False


class CepikVerifyResponse(BaseModel):
    technicalData: dict[str, Any]
    odometerReadings: list[dict[str, Any]]
    events: list[dict[str, Any]]
    meta: dict[str, Any]
    comparison: dict[str, Any] | None = None
    verification_id: int | None = None
