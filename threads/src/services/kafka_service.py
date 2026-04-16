import json
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from src.core.config import settings

import logging
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

    async def send_event(self, topic: str, event_type: str, data: dict):
        payload = {
            "type": event_type,
            "data": data
        }
        logger.info(f"Emitting {event_type} event to {topic}")
        await self.producer.send_and_wait(topic, payload)

    async def start_consumer(self, callback):
        logger.info(f"Subscribing to topic: {settings.KAFKA_VOTES_TOPIC}")
        self.consumer = AIOKafkaConsumer(
            settings.KAFKA_VOTES_TOPIC,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="threads-group",
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                logger.info(f"Consumed message from Kafka: {msg.value}")
                await callback(msg.value)
        finally:
            await self.consumer.stop()

kafka_service = KafkaService()
