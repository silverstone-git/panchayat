from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from src.core.config import settings
from sqlalchemy.orm import declarative_base

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
