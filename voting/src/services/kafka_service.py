import json
import asyncio
from aiokafka import AIOKafkaProducer
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.producer = None

    async def start(self):
        logger.info("Connecting to Kafka...")
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        
        max_retries = 10
        retry_delay = 5
        for i in range(max_retries):
            try:
                await self.producer.start()
                logger.info("Successfully connected to Kafka producer")
                return
            except Exception as e:
                logger.error(f"Failed to connect to Kafka producer (attempt {i+1}/{max_retries}): {e}")
                if i < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error("Max retries reached for Kafka producer. Exiting.")
                    raise e

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def send_vote_event(self, target_type: str, target_id: str, new_count: float, user_id: str, direction: int, up_count: int, down_count: int):
        if not self.producer:
            logger.error("Kafka producer not initialized")
            return
        
        payload = {
            "event_type": "VOTE_CAST",
            "data": {
                "target_type": target_type,
                "target_id": target_id,
                "new_count": new_count,
                "user_id": user_id,
                "direction": direction,
                "up_count": up_count,
                "down_count": down_count
            }
        }
        logger.info(f"Sending VOTE_CAST event for {target_type} {target_id}: count={new_count}, ups={up_count}, downs={down_count}")
        await self.producer.send_and_wait(settings.KAFKA_VOTES_TOPIC, value=payload)

    async def send_xp_event(self, user_id: int, amount: int, reason: str):
        if not self.producer:
            logger.error("Kafka producer not initialized")
            return
        
        payload = {
            "type": "XP_EARNED",
            "data": {
                "user_id": user_id,
                "amount": amount,
                "reason": reason
            }
        }
        logger.info(f"Sending XP_EARNED event for user {user_id}: amount={amount}")
        await self.producer.send_and_wait(settings.KAFKA_XP_TOPIC, value=payload)

kafka_service = KafkaService()
