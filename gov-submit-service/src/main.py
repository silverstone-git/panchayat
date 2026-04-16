import asyncio
from fastapi import FastAPI
from src.core.config import settings
from src.services.kafka_service import kafka_service
from src.services.submit_handler import handle_review_event

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    # Start Kafka Consumer in background
    asyncio.create_task(kafka_service.consume_events([settings.KAFKA_REVIEWS_TOPIC], handle_review_event))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
