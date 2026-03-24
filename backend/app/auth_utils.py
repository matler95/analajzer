from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app import models

# bcrypt backend in some environments raises runtime errors and hard-limits
# input to 72 bytes. pbkdf2_sha256 avoids both issues and supports long passwords.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(sub: str) -> str:
    exp = _now() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": sub, "exp": exp, "typ": "access"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def create_refresh_token(sub: str) -> str:
    exp = _now() + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode(
        {"sub": sub, "exp": exp, "typ": "refresh"},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_token(token: str, expected_typ: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("typ") != expected_typ:
            return None
        sub = payload.get("sub")
        return str(sub) if sub is not None else None
    except JWTError:
        return None


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()
