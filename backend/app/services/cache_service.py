from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import models
from app.config import settings


def cache_key(vin: str, reg: str, first_reg: str) -> str:
    raw = f"{vin.strip().upper()}|{reg.strip().upper()}|{first_reg.strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CacheBackend:
    def get(self, key: str) -> dict | None:
        raise NotImplementedError

    def set(self, key: str, payload: dict, ttl_seconds: int) -> None:
        raise NotImplementedError


class DbCacheBackend(CacheBackend):
    def __init__(self, db: Session):
        self.db = db

    def get(self, key: str) -> dict | None:
        row = (
            self.db.query(models.CepikCacheEntry)
            .filter(models.CepikCacheEntry.cache_key == key)
            .first()
        )
        if not row:
            return None
        exp = row.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < _now():
            self.db.delete(row)
            self.db.commit()
            return None
        return row.payload_json

    def set(self, key: str, payload: dict, ttl_seconds: int) -> None:
        exp = _now() + timedelta(seconds=ttl_seconds)
        row = (
            self.db.query(models.CepikCacheEntry)
            .filter(models.CepikCacheEntry.cache_key == key)
            .first()
        )
        if row:
            row.payload_json = payload
            row.expires_at = exp
        else:
            row = models.CepikCacheEntry(cache_key=key, payload_json=payload, expires_at=exp)
            self.db.add(row)
        self.db.commit()


class RedisCacheBackend(CacheBackend):
    def __init__(self, url: str):
        import redis

        self.r = redis.from_url(url, decode_responses=True)

    def get(self, key: str) -> dict | None:
        s = self.r.get(f"cepi:{key}")
        if not s:
            return None
        return json.loads(s)

    def set(self, key: str, payload: dict, ttl_seconds: int) -> None:
        self.r.setex(f"cepi:{key}", ttl_seconds, json.dumps(payload, ensure_ascii=False))


def get_cache_backend(db: Session) -> CacheBackend:
    if settings.redis_url:
        return RedisCacheBackend(settings.redis_url)
    return DbCacheBackend(db)
