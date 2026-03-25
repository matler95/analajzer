from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import json
import os
import time

from app import models, schemas
from app.auth_utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_by_email,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _agent_debug_log(session_id: str, hypothesis_id: str, location: str, message: str, data: dict | None = None) -> None:
    """
    Lightweight debug logging for the current agent session.
    Writes NDJSON lines to the same debug log file used by the JS instrumentation.
    """
    try:
        log_path = r"c:\Users\Mateusz\Desktop\analajzer\.cursor\debug-f22a9f.log"
        payload = {
            "sessionId": session_id,
            "location": location,
            "message": message,
            "hypothesisId": hypothesis_id,
            "timestamp": int(time.time() * 1000),
            "data": data or {},
        }
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        # Never break production flow because of debug logging.
        pass


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.post("/register", response_model=schemas.TokenPair)
def register(body: schemas.UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(email=body.email.lower().strip(), hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    sub = str(user.id)
    return schemas.TokenPair(
        access_token=create_access_token(sub),
        refresh_token=create_refresh_token(sub),
    )


@router.post("/login", response_model=schemas.TokenPair)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    _agent_debug_log(
        session_id="f22a9f",
        hypothesis_id="BH1",
        location="backend/app/routers/auth.py:login",
        message="entered /auth/login handler",
        data={"emailPresent": bool(getattr(body, "email", None))},
    )
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    sub = str(user.id)
    return schemas.TokenPair(
        access_token=create_access_token(sub),
        refresh_token=create_refresh_token(sub),
    )


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(body: schemas.RefreshBody, db: Session = Depends(get_db)):
    sub = decode_token(body.refresh_token, "refresh")
    if not sub or not sub.isdigit():
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(models.User).filter(models.User.id == int(sub)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    sub_s = str(user.id)
    return schemas.TokenPair(
        access_token=create_access_token(sub_s),
        refresh_token=create_refresh_token(sub_s),
    )
