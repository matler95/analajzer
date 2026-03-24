from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    searches: Mapped[list["Search"]] = relationship(back_populates="user")


class Search(Base):
    __tablename__ = "searches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    listing_url: Mapped[str] = mapped_column(Text, nullable=False)
    snapshot_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    manual_vin: Mapped[str | None] = mapped_column(String(32), nullable=True)
    manual_first_registration: Mapped[str | None] = mapped_column(String(64), nullable=True)
    manual_license_plate: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="searches")
    verifications: Mapped[list["CepikVerification"]] = relationship(back_populates="search")


class CepikVerification(Base):
    __tablename__ = "cepik_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    search_id: Mapped[int] = mapped_column(ForeignKey("searches.id"), nullable=False, index=True)
    vehicle_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timeline_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    normalized_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    comparison_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cache_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    search: Mapped["Search"] = relationship(back_populates="verifications")


class CepikCacheEntry(Base):
    __tablename__ = "cepik_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cache_key: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
