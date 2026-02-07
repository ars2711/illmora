from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional

_CHALLENGES: Dict[str, Tuple[str, datetime]] = {}


def set_challenge(key: str, challenge: str, ttl_seconds: int = 300) -> None:
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    _CHALLENGES[key] = (challenge, expires_at)


def pop_challenge(key: str) -> Optional[str]:
    item = _CHALLENGES.pop(key, None)
    if not item:
        return None
    challenge, expires_at = item
    if datetime.utcnow() > expires_at:
        return None
    return challenge
