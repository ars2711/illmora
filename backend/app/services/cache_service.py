import json
import logging
from datetime import datetime, timedelta
from typing import Any, Optional, Union
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.enabled = False
        self._memory_store: dict[str, tuple[Any, datetime]] = {}
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            self.enabled = True
            logger.info("Redis Cache Initialized Successfully")
        except Exception as e:
            logger.warning(f"Redis Cache unavailable, falling back to no-op: {e}")

    def get(self, key: str) -> Optional[Any]:
        if not self.enabled:
            item = self._memory_store.get(key)
            if not item:
                return None
            value, expires_at = item
            if datetime.utcnow() > expires_at:
                self._memory_store.pop(key, None)
                return None
            return value
        try:
            val = self.redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error(f"Cache GET error: {e}")
        return None

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set value in cache with TTL (seconds). Default 1 hour.
        """
        if not self.enabled:
            expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            self._memory_store[key] = (value, expires_at)
            return True
        try:
            serialized = json.dumps(value)
            return self.redis_client.setex(key, ttl, serialized)
        except TypeError as e:
            logger.error(f"Cache serialization error: {e}")
        except Exception as e:
            logger.error(f"Cache SET error: {e}")
        return False

    def delete(self, key: str):
        if self.enabled:
            self.redis_client.delete(key)
        else:
            self._memory_store.pop(key, None)
            
    def generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Helper to generate consistent keys"""
        key_parts = [prefix]
        key_parts.extend([str(arg) for arg in args])
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        return ":".join(key_parts)

# Singleton
cache = CacheService()
