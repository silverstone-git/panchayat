import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("threads")

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.api.v1 import ideas, feed, comments
from src.services.kafka_service import kafka_service
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from src.services.idea_service import idea_service
from src.services.idea_service import idea_service
from src.services.comment_service import comment_service
from src.db.session import async_session, engine
from src.db.models import Base

...
async def handle_vote_event(payload):
    logger.info(f"Received Kafka event: {payload}")
    event_type = payload.get("event_type")
    data = payload.get("data", {})

    if event_type == "VOTE_CAST":
        target_type = data.get("target_type", "idea") # Default to idea for backward compatibility
        target_id = data.get("target_id") or data.get("idea_id")
        new_count = data.get("new_count")

        if target_id and new_count is not None:
            async with async_session() as db:
                if target_type == "idea":
                    logger.info(f"Updating idea {target_id} vote_count to {new_count}")
                    await idea_service.update_vote_count(db, target_id, new_count)
                elif target_type == "comment":
                    logger.info(f"Updating comment {target_id} vote_count to {new_count}")
                    from uuid import UUID
                    await comment_service.update_vote_count(db, UUID(target_id), new_count)
        else:
            logger.warning(f"Malformed VOTE_CAST data: {data}")

    else:
        logger.debug(f"Ignoring event type: {event_type}")

async def start_kafka_consumer():
    logger.info("Starting Kafka consumer...")
    await kafka_service.start_consumer(handle_vote_event)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Service starting up...")
    await kafka_service.start()
    await search_service.create_index()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    consumer_task = asyncio.create_task(start_kafka_consumer())
    
    yield
    
    # Shutdown
    logger.info("Service shutting down...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
        
    await kafka_service.stop()
    await search_service.close()
    await cache_service.close()

app = FastAPI(
    title="Thread Service",
    description="Core Content Service for DemoVox",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(ideas.router, prefix="/api/v1/threads")
app.include_router(feed.router, prefix="/api/v1/threads")
app.include_router(comments.router, prefix="/api/v1/threads")

@app.get("/health")
async def health():
    return {"status": "ok"}
