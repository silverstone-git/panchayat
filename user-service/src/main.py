import logging
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware
from src.api.v1 import auth, users
from src.db.session import engine
from src.db.models import Base
from src.services.kafka_service import kafka_service
from src.core.tracing import setup_tracer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("user-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("User Service starting up...")
    setup_tracer()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start Kafka Producer
    await kafka_service.start()
    
    # Start Kafka Consumer in background
    consumer_task = asyncio.create_task(kafka_service.start_consumer())
    
    yield
    
    # Shutdown
    logger.info("User Service shutting down...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        logger.info("Kafka consumer task cancelled successfully")
    await kafka_service.stop()

app = FastAPI(
    title="User Service",
    description="Identity and Gamification Service for Panchayat",
    version="1.0.0",
    lifespan=lifespan
)

# Instrumentation
Instrumentator().instrument(app).expose(app)
app.add_middleware(OpenTelemetryMiddleware)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

@app.get("/health")
async def health():
    return {"status": "ok"}
