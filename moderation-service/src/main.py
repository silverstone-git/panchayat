import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from src.api.v1.moderation import router as moderation_router
from src.core.config import settings
from src.services.kafka_service import kafka_service
from src.core.tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import OpenTelemetryMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await kafka_service.start()
    setup_tracer()
    asyncio.create_task(kafka_service.start_consumer())
    logger.info("Moderation Service started, listening for reports...")
    yield
    # Shutdown
    await kafka_service.stop()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

Instrumentator().instrument(app).expose(app)
app.add_middleware(OpenTelemetryMiddleware)

app.include_router(moderation_router, prefix="/api/v1/moderation", tags=["moderation"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
