import json
from redis.asyncio import Redis
from src.core.config import settings

class CacheService:
    def __init__(self):
        self.client = Redis.from_url(settings.redis_url, decode_responses=True)

    async def set_cache(self, key: str, value: any, expire: int = 60):
        await self.client.set(key, json.dumps(value), ex=expire)

    async def get_cache(self, key: str):
        data = await self.client.get(key)
        return json.loads(data) if data else None

    async def clear_feed_cache(self):
        # Clear all feed-related cache keys
        keys = await self.client.keys("feed:*")
        if keys:
            await self.client.delete(*keys)

    async def close(self):
        await self.client.aclose()

cache_service = CacheService()
