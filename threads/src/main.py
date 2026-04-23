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
from prometheus_fastapi_instrumentator import Instrumentator
from src.api.v1 import ideas, feed, comments, images
from src.services.kafka_service import kafka_service
from src.core.tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware
from src.core.tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from src.services.idea_service import idea_service
from src.services.comment_service import comment_service
from src.db.session import async_session, engine
from src.db.models import Base


async def reindex_all_ideas():
    logger.info("Starting scheduled reindexing task...")
    try:
        async with async_session() as db:
            from sqlalchemy import select
            from src.db.models import Idea
            stmt = select(Idea)
            result = await db.execute(stmt)
            ideas = result.scalars().all()
            for idea in ideas:
                await search_service.index_idea(
                    str(idea.id),
                    {
                        "title": idea.title,
                        "description": idea.description,
                        "category": idea.category,
                        "author_id": idea.author_id,
                        "author_name": idea.author_name,
                        "vote_count": idea.vote_count,
                        "upvote_count": idea.upvote_count,
                        "downvote_count": idea.downvote_count,
                        "comment_count": idea.comment_count,
                        "status": idea.status,
                        "created_at": idea.created_at.isoformat(),
                        "images": idea.images
                    }
                )
        logger.info(f"Reindexing complete. Synced {len(ideas)} ideas.")
    except Exception as e:
        logger.error(f"Error during scheduled reindexing: {e}")

async def run_periodic_reindex():
    # Run initial sync on startup
    await reindex_all_ideas()
    while True:
        await asyncio.sleep(1800) # 30 minutes
        await reindex_all_ideas()

async def handle_kafka_event(payload):
    logger.info(f"Received Kafka event: {payload}")
    event_type = payload.get("type") or payload.get("event_type")
    data = payload.get("data", {})

    if event_type == "VOTE_CAST":
        target_type = data.get("target_type", "idea")
        target_id = data.get("target_id") or data.get("idea_id")
        new_count = data.get("new_count")
        ups = data.get("up_count", 0)
        downs = data.get("down_count", 0)

        if target_id and new_count is not None:
            async with async_session() as db:
                if target_type == "idea":
                    logger.info(f"Updating idea {target_id} vote_count to {new_count}, ups={ups}, downs={downs}")
                    await idea_service.update_vote_count(db, target_id, new_count, ups, downs)
                    await cache_service.clear_cache_for_idea(target_id)

                elif target_type == "comment":
                    logger.info(f"Updating comment {target_id} vote_count to {new_count}, ups={ups}, downs={downs}")
                    from uuid import UUID
                    await comment_service.update_vote_count(db, UUID(target_id), new_count, ups, downs)
        else:
            logger.warning(f"Malformed VOTE_CAST data: {data}")

    elif event_type == "CONTENT_HIDDEN":
        target_type = data.get("target_type")
        target_id = data.get("target_id")
        
        if target_id:
            async with async_session() as db:
                if target_type == "idea":
                    logger.warning(f"Hiding idea {target_id} due to community reports")
                    await idea_service.hide_idea(db, target_id)
                elif target_type == "comment":
                    logger.warning(f"Hiding comment {target_id} due to community reports")
                    from uuid import UUID
                    await comment_service.hide_comment(db, UUID(target_id))
        else:
            logger.warning(f"Malformed CONTENT_HIDDEN data: {data}")

    elif event_type == "REVIEW_COMPLETED":
        idea_id = data.get("idea_id")
        action = data.get("action")
        
        if idea_id and action:
            async with async_session() as db:
                new_status = "APPROVED_BY_EXPERT" if action == "ENDORSE" else "FLAGGED_BY_EXPERT"
                logger.info(f"Expert review for idea {idea_id}: {action}. Updating status to {new_status}")
                
                # Update status in DB
                from sqlalchemy import update
                from src.db.models import Idea
                stmt = update(Idea).where(Idea.id == idea_id).values(status=new_status).returning(Idea)
                res = await db.execute(stmt)
                idea = res.scalar_one_or_none()
                await db.commit()
                
                if idea:
                    # Update ES
                    await search_service.index_idea(str(idea.id), {
                        "title": idea.title,
                        "description": idea.description,
                        "category": idea.category,
                        "author_id": idea.author_id,
                        "author_name": idea.author_name,
                        "vote_count": idea.vote_count,
                        "upvote_count": idea.upvote_count,
                        "downvote_count": idea.downvote_count,
                        "comment_count": idea.comment_count,
                        "status": idea.status,
                        "created_at": idea.created_at.isoformat(),
                        "images": idea.images
                    })
                    await cache_service.clear_cache_for_idea(idea_id)
        else:
            logger.warning(f"Malformed REVIEW_COMPLETED data: {data}")

    else:
        logger.debug(f"Ignoring event type: {event_type}")

async def start_kafka_consumer():
    logger.info("Starting Kafka consumer...")
    await kafka_service.start_consumer(handle_kafka_event)

    logger.info("Starting Kafka consumer...")
    await kafka_service.start_consumer(handle_kafka_event)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Service starting up...")
    setup_tracer()
    setup_tracer()
    await kafka_service.start()
    await search_service.create_index()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    consumer_task = asyncio.create_task(start_kafka_consumer())
    reindex_task = asyncio.create_task(run_periodic_reindex())
    
    yield
    
    # Shutdown
    logger.info("Service shutting down...")
    consumer_task.cancel()
    reindex_task.cancel()
    try:
        await consumer_task
        await reindex_task
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

Instrumentator().instrument(app).expose(app)
app.add_middleware(OpenTelemetryMiddleware)
app.add_middleware(OpenTelemetryMiddleware)

app.include_router(ideas.router, prefix="/api/v1/threads")
app.include_router(feed.router, prefix="/api/v1/threads")
app.include_router(comments.router, prefix="/api/v1/threads")
app.include_router(images.router, prefix="/api/v1/threads")

@app.get("/health")
async def health():
    return {"status": "ok"}
