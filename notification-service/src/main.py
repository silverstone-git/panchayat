import asyncio
from fastapi import FastAPI
from src.core.config import settings
from src.services.kafka_service import kafka_service
from src.services.notification_handler import handle_notification

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    # Start Kafka Consumer in background
    asyncio.create_task(kafka_service.consume_events(settings.KAFKA_TOPICS, handle_notification))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
