import redis.asyncio as redis
from src.core.config import settings
import httpx
from src.services.kafka_service import kafka_service
import json

class VoteService:
    
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        # ARGV[1]: user_id, ARGV[2]: new_direction, ARGV[3]: payload_json, ARGV[4]: vote_weight
        self.vote_script = """
        local total_key = KEYS[1]
        local user_key = KEYS[2]
        local queue_key = KEYS[3]
        
        local user_id = ARGV[1]
        local new_dir = tonumber(ARGV[2])
        local payload = ARGV[3]
        local weight = tonumber(ARGV[4])
        
        local old_dir = tonumber(redis.call('HGET', user_key, user_id) or 0)
        
        -- Calculate the actual change in direction (-1, 0, 1)
        local direction_delta = new_dir - old_dir
        
        if direction_delta == 0 then
            return redis.call('GET', total_key) or 0
        end
        
        -- The actual value added to the total is the change in direction multiplied by weight
        local value_delta = direction_delta * weight
        
        redis.call('HSET', user_key, user_id, new_dir)
        local new_total = redis.call('INCRBYFLOAT', total_key, value_delta)
        
        redis.call('LPUSH', queue_key, payload)
        
        return new_total
        """

    async def close(self):
        await self.redis.close()

    def _calculate_multiplier(self, level: int) -> float:
        if level < 5:
            return 1.0
        elif level < 10:
            return 1.25
        elif level < 20:
            return 1.5
        elif level < 30:
            return 2.0
        else:
            return 2.5

    async def cast_vote(self, target_type: str, target_id: str, user_id: str, direction: int) -> float:
        direction = max(-1, min(1, direction))
        
        # Fetch user level from user-service
        user_level = 0
        try:
            # We need to get the user's username first to hit the correct endpoint
            # This is a bit inefficient and could be improved with a direct /api/v1/users/{id} endpoint
            # For now, we will simulate it. In a real scenario, you would fetch username.
            async with httpx.AsyncClient() as client:
                # Assuming user_id can be used to lookup directly, which is more RESTful
                res = await client.get(f"{settings.USER_SERVICE_URL}/api/v1/users/id/{user_id}")
                if res.status_code == 200:
                    user_level = res.json().get("level", 0)
        except Exception:
            # Fallback to level 0 if user service is down
            pass 
        
        vote_weight = self._calculate_multiplier(user_level)
        
        total_key = f"total_votes:{target_type}:{target_id}"
        user_key = f"user_votes:{target_type}:{target_id}"
        queue_key = "persist_queue:votes"
        
        payload = json.dumps({
            "target_type": target_type,
            "target_id": target_id,
            "user_id": user_id,
            "direction": direction,
            "weight": vote_weight
        })
        
        new_total_str = await self.redis.eval(
            self.vote_script, 3, 
            total_key, user_key, queue_key, 
            user_id, direction, payload, vote_weight
        )
        new_total = float(new_total_str)
        
        await kafka_service.send_vote_event(target_type, target_id, new_total, user_id, direction)
        
        if direction != 0:
            await kafka_service.send_xp_event(int(user_id), 10, "VOTE_CAST")
            
        return new_total



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
        
        # Notify threads service of the vote change
        await kafka_service.send_vote_event(target_type, target_id, int(new_total), user_id, direction)
        
        # Award XP for voting
        if direction != 0:
            await kafka_service.send_xp_event(int(user_id), 10, "VOTE_CAST")
            
        return int(new_total)

    async def get_user_votes(self, target_type: str, target_ids: list[str], user_id: str) -> dict:
        results = {}
        for tid in target_ids:
            user_key = f"user_votes:{target_type}:{tid}"
            val = await self.redis.hget(user_key, user_id)
            results[tid] = int(val) if val is not None else 0
        return results

vote_service = VoteService()
