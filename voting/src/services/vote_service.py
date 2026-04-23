import redis.asyncio as redis
from src.core.config import settings
import httpx
from src.services.kafka_service import kafka_service
import json

class VoteService:
    
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        # KEYS[1]: total_key, KEYS[2]: user_key, KEYS[3]: queue_key, KEYS[4]: up_key, KEYS[5]: down_key
        # ARGV[1]: user_id, ARGV[2]: new_direction, ARGV[3]: payload_json, ARGV[4]: vote_weight
        self.vote_script = """
        local total_key = KEYS[1]
        local user_key = KEYS[2]
        local queue_key = KEYS[3]
        local up_key = KEYS[4]
        local down_key = KEYS[5]
        
        local user_id = ARGV[1]
        local new_dir = tonumber(ARGV[2])
        local payload = ARGV[3]
        local weight = tonumber(ARGV[4])
        
        local old_dir = tonumber(redis.call('HGET', user_key, user_id) or 0)
        
        if new_dir == old_dir then
            return {redis.call('GET', total_key) or 0, redis.call('GET', up_key) or 0, redis.call('GET', down_key) or 0}
        end

        -- Update net total
        local direction_delta = new_dir - old_dir
        local value_delta = direction_delta * weight
        local new_total = redis.call('INCRBYFLOAT', total_key, value_delta)

        -- Update absolute up/down counters (non-weighted for consensus ratio)
        if old_dir == 1 then
            redis.call('DECR', up_key)
        elseif old_dir == -1 then
            redis.call('DECR', down_key)
        end

        if new_dir == 1 then
            redis.call('INCR', up_key)
        elseif new_dir == -1 then
            redis.call('INCR', down_key)
        end
        
        redis.call('HSET', user_key, user_id, new_dir)
        redis.call('LPUSH', queue_key, payload)
        
        local ups = redis.call('GET', up_key) or 0
        local downs = redis.call('GET', down_key) or 0
        
        return {new_total, ups, downs}
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

    async def cast_vote(self, target_type: str, target_id: str, user_id: str, direction: int) -> dict:
        direction = max(-1, min(1, direction))
        
        user_level = 0
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"{settings.USER_SERVICE_URL}/api/v1/users/id/{user_id}")
                if res.status_code == 200:
                    user_level = res.json().get("level", 0)
        except Exception:
            pass 
        
        vote_weight = self._calculate_multiplier(user_level)
        
        total_key = f"total_votes:{target_type}:{target_id}"
        up_key = f"up_votes:{target_type}:{target_id}"
        down_key = f"down_votes:{target_type}:{target_id}"
        user_key = f"user_votes:{target_type}:{target_id}"
        queue_key = "persist_queue:votes"
        
        payload = json.dumps({
            "target_type": target_type,
            "target_id": target_id,
            "user_id": user_id,
            "direction": direction,
            "weight": vote_weight
        })
        
        # Result is [total, ups, downs]
        res = await self.redis.eval(
            self.vote_script, 5, 
            total_key, user_key, queue_key, up_key, down_key,
            user_id, direction, payload, vote_weight
        )
        
        new_total = float(res[0])
        ups = int(res[1])
        downs = int(res[2])
        
        await kafka_service.send_vote_event(target_type, target_id, new_total, user_id, direction, ups, downs)
        
        if direction != 0:
            await kafka_service.send_xp_event(int(user_id), 10, "VOTE_CAST")
            
        return {"total": new_total, "ups": ups, "downs": downs}



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

    async def delete_target_votes(self, target_type: str, target_id: str):
        total_key = f"total_votes:{target_type}:{target_id}"
        up_key = f"up_votes:{target_type}:{target_id}"
        down_key = f"down_votes:{target_type}:{target_id}"
        user_key = f"user_votes:{target_type}:{target_id}"
        
        await self.redis.delete(total_key, up_key, down_key, user_key)

        from src.db.session import async_session
        from src.db.models import VoteRecord
        from sqlalchemy import delete
        
        async with async_session() as db:
            stmt = delete(VoteRecord).where(
                VoteRecord.target_type == target_type,
                VoteRecord.target_id == target_id
            )
            await db.execute(stmt)
            await db.commit()

vote_service = VoteService()
