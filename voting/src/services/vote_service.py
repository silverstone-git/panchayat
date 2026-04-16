import redis.asyncio as redis
from src.core.config import settings
from src.services.kafka_service import kafka_service
import json

class VoteService:
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        # Lua script for atomic vote cast
        # KEYS[1]: total_votes_key, KEYS[2]: user_votes_key, KEYS[3]: persist_queue_key
        # ARGV[1]: user_id, ARGV[2]: new_direction, ARGV[3]: payload_json
        self.vote_script = """
        local total_key = KEYS[1]
        local user_key = KEYS[2]
        local queue_key = KEYS[3]
        
        local user_id = ARGV[1]
        local new_dir = tonumber(ARGV[2])
        local payload = ARGV[3]
        
        local old_dir = tonumber(redis.call('HGET', user_key, user_id) or 0)
        local delta = new_dir - old_dir
        
        if delta == 0 then
            return redis.call('GET', total_key) or 0
        end
        
        redis.call('HSET', user_key, user_id, new_dir)
        local new_total = redis.call('INCRBY', total_key, delta)
        
        redis.call('LPUSH', queue_key, payload)
        
        return new_total
        """

    async def close(self):
        await self.redis.close()

    async def cast_vote(self, target_type: str, target_id: str, user_id: str, direction: int) -> int:
        # Clamp direction to -1, 0, 1
        direction = max(-1, min(1, direction))
        
        total_key = f"total_votes:{target_type}:{target_id}"
        user_key = f"user_votes:{target_type}:{target_id}"
        queue_key = "persist_queue:votes"
        
        payload = json.dumps({
            "target_type": target_type,
            "target_id": target_id,
            "user_id": user_id,
            "direction": direction
        })
        
        new_total = await self.redis.eval(
            self.vote_script, 3, 
            total_key, user_key, queue_key, 
            user_id, direction, payload
        )
        
        # We only send to Kafka if it's an idea vote, as Threads service is listening for ideas
        if target_type == "idea":
            await kafka_service.send_vote_event(target_id, int(new_total), user_id, direction)
            
        return int(new_total)

    async def get_user_votes(self, target_type: str, target_ids: list[str], user_id: str) -> dict:
        results = {}
        for tid in target_ids:
            user_key = f"user_votes:{target_type}:{tid}"
            val = await self.redis.hget(user_key, user_id)
            results[tid] = int(val) if val is not None else 0
        return results

vote_service = VoteService()
