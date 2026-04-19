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

    async def clear_cache_for_idea(self, idea_id: str):
        # This is a placeholder for a more sophisticated cache invalidation strategy.
        # In a real-world scenario, you would have a mapping of which cache keys
        # an idea belongs to, or you would have a more structured key naming scheme.
        # For now, we will continue to clear the entire feed cache.
        await self.clear_feed_cache()

    async def clear_feed_cache(self):
        # Clear all feed-related cache keys
        keys = await self.client.keys("feed:*")
        if keys:
            await self.client.delete(*keys)

    async def close(self):
        await self.client.aclose()

cache_service = CacheService()
