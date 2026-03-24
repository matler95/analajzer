"""Prosty globalny limiter wywołań CEPiK (per proces)."""

from __future__ import annotations

import time
from collections import deque

from app.config import settings

_timestamps: deque[float] = deque(maxlen=500)


def cepik_allow() -> bool:
    now = time.monotonic()
    window = 60.0
    while _timestamps and now - _timestamps[0] > window:
        _timestamps.popleft()
    limit = settings.cepik_rate_limit_per_minute
    if len(_timestamps) >= limit:
        return False
    _timestamps.append(now)
    return True
