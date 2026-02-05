import time
from fastapi import Request, HTTPException
from collections import defaultdict
from app.services.cache_service import cache

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.limit = requests_per_minute
        self.requests = defaultdict(list)
        
    async def check(self, request: Request, user_id: str):
        # Phase 4: Redis Distributed Rate Limiting
        if cache.enabled:
            key = f"ipp:ratelimit:{user_id}"
            
            # Using Redis atomic features ideally, but simple implementation for now:
            # Get current count
            current_count = cache.redis_client.get(key)
            if current_count and int(current_count) >= self.limit:
                raise HTTPException(status_code=429, detail="Global rate limit exceeded.")
            
            # Increment and set expiry if new
            pipe = cache.redis_client.pipeline()
            pipe.incr(key)
            if not current_count:
                pipe.expire(key, 60) # Reset every minute
            pipe.execute()
            return

        # Fallback: Local Memory
        now = time.time()
        # Clean up old requests
        self.requests[user_id] = [t for t in self.requests[user_id] if now - t < 60]
        
        if len(self.requests[user_id]) >= self.limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Too many requests.")
            
        self.requests[user_id].append(now)

# Global Instance
limiter = RateLimiter(requests_per_minute=60)
