import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("voting")

import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from src.api.v1 import votes
from src.services.kafka_service import kafka_service
from src.core.tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware
from src.core.tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware
from src.services.vote_service import vote_service
from src.db.session import async_session, engine
from src.db.models import Base, VoteRecord
from sqlalchemy.dialects.postgresql import insert

async def persist_worker():
    logger.info("Persistence worker started")
    while True:
        try:
            # Pop up to 100 votes from the queue
            pipe = vote_service.redis.pipeline()
            pipe.lrange("persist_queue:votes", 0, 99)
            pipe.ltrim("persist_queue:votes", 100, -1)
            raw_items, _ = await pipe.execute()
            
            if raw_items:
                logger.info(f"Persisting {len(raw_items)} votes to PostgreSQL")
                async with async_session() as db:
                    for item in raw_items:
                        data = json.loads(item)
                        stmt = insert(VoteRecord).values(
                            user_id=data["user_id"],
                            target_id=data["target_id"],
                            target_type=data["target_type"],
                            direction=data["direction"]
                        )
                        upsert_stmt = stmt.on_conflict_do_update(
                            index_elements=['user_id', 'target_id'],
                            set_=dict(direction=stmt.excluded.direction, timestamp=stmt.excluded.timestamp)
                        )
                        await db.execute(upsert_stmt)
                    await db.commit()
            else:
                await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Error in persist worker: {e}")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Service starting up...")
    setup_tracer()
    setup_tracer()
    await kafka_service.start()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    worker_task = asyncio.create_task(persist_worker())
    
    yield
    
    # Shutdown
    logger.info("Service shutting down...")
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
        
    await kafka_service.stop()
    await vote_service.close()

app = FastAPI(
    title="Voting Service",
    description="Engine of Consensus for DemoVox",
    version="1.0.0",
    lifespan=lifespan
)

Instrumentator().instrument(app).expose(app)
app.add_middleware(OpenTelemetryMiddleware)
app.add_middleware(OpenTelemetryMiddleware)

app.include_router(votes.router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
