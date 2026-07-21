import redis
from ..config import settings

class RedisClient:
    def __init__(self):
        self.client = None
        self._fallback_db = {}
        if settings.REDIS_URL:
            try:
                # Parse connections parameters or use directly
                self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                # Ping to check connection
                self.client.ping()
                print(f"[Services] Redis client connected successfully to {settings.REDIS_URL}")
            except Exception as e:
                print(f"[Services Warning] Redis connection failed, using in-memory fallback: {e}")
                self.client = None

    def set(self, key: str, value: str, ex: int = 600):
        """Sets a key with a TTL in seconds (default 10 minutes)"""
        if self.client:
            try:
                self.client.set(key, value, ex=ex)
                return
            except Exception:
                pass
        self._fallback_db[key] = value

    def get(self, key: str) -> str:
        """Gets a key's value"""
        if self.client:
            try:
                return self.client.get(key)
            except Exception:
                pass
        return self._fallback_db.get(key)

    def delete(self, key: str):
        """Deletes a key"""
        if self.client:
            try:
                self.client.delete(key)
                return
            except Exception:
                pass
        self._fallback_db.pop(key, None)

redis_client = RedisClient()
