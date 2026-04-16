from fastapi import FastAPI
from src.api.v1.moderation import router as moderation_router
from src.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(moderation_router, prefix="/api/v1/moderation", tags=["moderation"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
