import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.api.v1 import auth
from src.db.session import engine
from src.db.models import Base

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    logger.info("User Service shutting down...")

app = FastAPI(
    title="User Service",
    description="Identity and Gamification Service for Panchayat",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/health")
async def health():
    return {"status": "ok"}
