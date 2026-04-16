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
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        self.consumer = None

    async def start(self):
        logger.info("Connecting to Kafka...")
        await self.producer.start()

    async def stop(self):
        await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()

    async def start_consumer(self):
        logger.info(f"Subscribing to topic: {settings.KAFKA_XP_TOPIC}")
        self.consumer = AIOKafkaConsumer(
            settings.KAFKA_XP_TOPIC,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="user-service-group",
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                logger.info(f"Consumed message from Kafka: {msg.value}")
                await self.handle_xp_event(msg.value)
        finally:
            await self.consumer.stop()

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
        else:
            logger.warning(f"Unknown event type: {event_type}")

kafka_service = KafkaService()
