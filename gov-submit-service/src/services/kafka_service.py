import json
import asyncio
from aiokafka import AIOKafkaConsumer
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.consumer = None

    async def consume_events(self, topics: list[str], handler):
        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="gov-submit-group-v2",
            auto_offset_reset="earliest"
        )
        await self.consumer.start()
        logger.info(f"Connected to Kafka and subscribed to {topics}")
        try:
            async for msg in self.consumer:
                event = json.loads(msg.value.decode("utf-8"))
                await handler(event, msg.topic)
        finally:
            await self.consumer.stop()

kafka_service = KafkaService()
