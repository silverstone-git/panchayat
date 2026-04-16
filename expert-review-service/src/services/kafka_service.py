import json
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.producer = None
        self.consumer = None

    async def start(self):
        self.producer = AIOKafkaProducer(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
        await self.producer.start()

    async def stop(self):
        if self.producer:
            await self.producer.stop()
        if self.consumer:
            await self.consumer.stop()

    async def send_event(self, topic: str, event_type: str, data: dict):
        if not self.producer:
            await self.start()
        
        payload = {
            "type": event_type,
            "data": data
        }
        await self.producer.send_and_wait(topic, json.dumps(payload).encode("utf-8"))

    async def consume_events(self, topic: str, handler):
        self.consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="expert-review-group",
            auto_offset_reset="earliest"
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                event = json.loads(msg.value.decode("utf-8"))
                await handler(event)
        finally:
            await self.consumer.stop()

kafka_service = KafkaService()
