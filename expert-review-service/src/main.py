import asyncio
from fastapi import FastAPI
from src.core.config import settings
from src.services.kafka_service import kafka_service
from src.services.event_handler import handle_event
from src.api.v1.reviews import router as reviews_router
from src.db.session import engine
from src.db.models import Base

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(reviews_router, prefix="/api/v1/reviews", tags=["reviews"])

@app.on_event("startup")
async def startup_event():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Start Kafka Producer
    await kafka_service.start()
    # Start Kafka Consumer in background
    asyncio.create_task(kafka_service.consume_events(settings.KAFKA_IDEAS_TOPIC, handle_event))

@app.on_event("shutdown")
async def shutdown_event():
    await kafka_service.stop()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
