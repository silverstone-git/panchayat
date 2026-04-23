import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import redis.asyncio as redis
from src.core.config import settings
from src.db.session import async_session
from src.db.models import Report, ReportStatus, TargetType

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self):
        self.producer = None
        self.consumer = None
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def start(self):
        logger.info("Connecting to Kafka...")
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
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
        if self.consumer:
            await self.consumer.stop()
        await self.redis.close()

    async def start_consumer(self):
        logger.info(f"Subscribing to topic: {settings.KAFKA_REPORTS_TOPIC}")
        self.consumer = AIOKafkaConsumer(
            settings.KAFKA_REPORTS_TOPIC,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id="moderation-report-group",
            value_deserializer=lambda v: v # Manual JSON load to catch errors
        )
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                try:
                    payload = json.loads(msg.value.decode('utf-8'))
                    await self.handle_event(payload)
                except Exception as e:
                    logger.error(f"Error processing message from {msg.topic}: {e}. Sending to DLQ.")
                    await self.send_to_dlq(msg.value)
        finally:
            await self.consumer.stop()
            
    async def send_to_dlq(self, raw_message: bytes):
        if self.producer:
            await self.producer.send_and_wait(settings.KAFKA_DLQ_TOPIC, raw_message)


    async def handle_event(self, event: dict):
        event_type = event.get("type")
        data = event.get("data", {})

        if event_type == "CONTENT_REPORTED":
            target_type = data.get("target_type")
            target_id = data.get("target_id")
            reporter_id = data.get("reporter_id")
            reason = data.get("reason", "No reason provided")

            if not all([target_type, target_id, reporter_id]):
                return

            # Persist to DB
            async with async_session() as db:
                new_report = Report(
                    reporter_id=str(reporter_id),
                    target_type=TargetType(target_type),
                    target_id=str(target_id),
                    reason=reason,
                    status=ReportStatus.PENDING
                )
                db.add(new_report)
                await db.commit()

            # 1. Track unique reporters to prevent Sybil-like reporting
            report_set_key = f"reports:{target_type}:{target_id}:reporters"
            added = await self.redis.sadd(report_set_key, reporter_id)
            
            if added:
                # 2. Increment report count
                count_key = f"reports:{target_type}:{target_id}:count"
                new_count = await self.redis.incr(count_key)
                logger.info(f"Report received for {target_type} {target_id}. New count: {new_count}")

                # 3. Check threshold
                if new_count >= settings.REPORT_THRESHOLD:
                    await self.hide_content(target_type, target_id)
        else:
            logger.debug(f"Ignored event type: {event_type}")

    async def hide_content(self, target_type: str, target_id: str):
        payload = {
            "type": "CONTENT_HIDDEN",
            "data": {
                "target_type": target_type,
                "target_id": target_id,
                "reason": f"Automated hide: threshold of {settings.REPORT_THRESHOLD} reports reached."
            }
        }
        logger.warning(f"THRESHOLD REACHED! Hiding {target_type} {target_id}")
        await self.producer.send_and_wait(settings.KAFKA_CONTENT_HIDDEN_TOPIC, value=payload)

kafka_service = KafkaService()
