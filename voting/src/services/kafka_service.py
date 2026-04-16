import json
from aiokafka import AIOKafkaProducer
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.producer = None

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        await self.producer.start()

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def send_vote_event(self, target_id: str, new_count: int, user_id: str, direction: int):
        if not self.producer:
            logger.error("Kafka producer not initialized")
            return
        
        payload = {
            "event_type": "VOTE_CAST",
            "data": {
                "idea_id": target_id,
                "new_count": new_count,
                "user_id": user_id,
                "direction": direction
            }
        }
        logger.info(f"Sending VOTE_CAST event for idea {target_id}: count={new_count}")
        await self.producer.send_and_wait(settings.KAFKA_VOTES_TOPIC, value=payload)

kafka_service = KafkaService()
