import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from src.core.config import settings
from src.services.user_service import user_service
from src.db.session import async_session

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.producer = None
        self.consumer = None

    async def start(self):
        logger.info("Connecting to Kafka...")
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()

    async def stop(self):
        if self.producer:
            await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()

    async def start_consumer(self):
        topics = [settings.KAFKA_XP_TOPIC, settings.KAFKA_VOTES_TOPIC]
        logger.info(f"Subscribing to topics: {topics}")
        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="user-service-group",
            value_deserializer=lambda m: m # Deserialize manually
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                try:
                    payload = json.loads(msg.value.decode('utf-8'))
                    logger.info(f"Consumed message from {msg.topic}: {payload}")
                    if msg.topic == settings.KAFKA_XP_TOPIC:
                        await self.handle_xp_event(payload)
                    elif msg.topic == settings.KAFKA_VOTES_TOPIC:
                        await self.handle_vote_event(payload)
                except Exception as e:
                    logger.error(f"Error processing message from {msg.topic}: {e}. Sending to DLQ.")
                    await self.send_to_dlq(msg.value)
        finally:
            await self.consumer.stop()

    async def send_to_dlq(self, raw_message: bytes):
        if self.producer:
            await self.producer.send_and_wait(settings.KAFKA_DLQ_TOPIC, raw_message)

    async def handle_xp_event(self, event: dict):
        event_type = event.get("type")
        data = event.get("data", {})
        
        if event_type == "XP_EARNED":
            user_id = data.get("user_id")
            amount = data.get("amount")
            if user_id and amount:
                async with async_session() as db:
                    await user_service.add_xp(db, user_id, amount)
                    logger.info(f"Added {amount} XP to user {user_id}")

    async def handle_vote_event(self, event: dict):
        event_type = event.get("event_type") or event.get("type")
        data = event.get("data", {})

        if event_type == "VOTE_CAST":
            user_id = data.get("user_id")
            if user_id:
                async with async_session() as db:
                    await user_service.adjust_reputation(db, int(user_id), 0.1)
                    logger.info(f"Adjusted reputation for user {user_id}")

kafka_service = KafkaService()
