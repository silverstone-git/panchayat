import json
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from src.core.config import settings

import logging
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

    async def send_event(self, topic: str, event_type: str, data: dict):
        payload = {
            "type": event_type,
            "data": data
        }
        logger.info(f"Emitting {event_type} event to {topic}")
        await self.producer.send_and_wait(topic, payload)

    async def start_consumer(self, callback):
        topics = [settings.KAFKA_VOTES_TOPIC, settings.KAFKA_CONTENT_HIDDEN_TOPIC]
        logger.info(f"Subscribing to topics: {topics}")
        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="threads-group",
            value_deserializer=lambda m: m # Deserialize manually to catch errors
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                try:
                    payload = json.loads(msg.value.decode('utf-8'))
                    logger.info(f"Consumed message from {msg.topic}: {payload}")
                    await callback(payload)
                except Exception as e:
                    logger.error(f"Error processing message from {msg.topic}: {e}. Sending to DLQ.")
                    await self.send_to_dlq(msg.value)
        finally:
            await self.consumer.stop()
    async def send_to_dlq(self, raw_message: bytes):
        if self.producer:
            await self.producer.send_and_wait(settings.KAFKA_DLQ_TOPIC, raw_message)



    async def report_content(self, user_id: str, target_type: str, target_id: str, reason: str):
        payload = {
            "type": "CONTENT_REPORTED",
            "data": {
                "reporter_id": user_id,
                "target_type": target_type,
                "target_id": target_id,
                "reason": reason
            }
        }
        if self.producer:
            await self.producer.send_and_wait("moderation.reports", value=payload)

kafka_service = KafkaService()

