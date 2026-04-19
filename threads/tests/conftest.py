import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from unittest.mock import AsyncMock, patch

from src.db.session import get_db
from src.db.models import Base
from src.main import app
from src.services.kafka_service import kafka_service
from src.services.search_service import search_service
from src.services.cache_service import cache_service

postgres = PostgresContainer("postgres:15-alpine")

@pytest.fixture(scope="session", autouse=True)
def setup_postgres():
    postgres.start()
    yield
    postgres.stop()

@pytest_asyncio.fixture(scope="function")
async def db_engine():
    conn_url = postgres.get_connection_url().replace("psycopg2", "asyncpg")
    engine = create_async_engine(conn_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    async_session = async_sessionmaker(db_engine, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def mock_external_services():
    with patch.object(kafka_service, 'start', new_callable=AsyncMock), \
         patch.object(kafka_service, 'stop', new_callable=AsyncMock), \
         patch.object(kafka_service, 'start_consumer', new_callable=AsyncMock), \
         patch.object(kafka_service, 'send_event', new_callable=AsyncMock), \
         patch.object(search_service, 'create_index', new_callable=AsyncMock), \
         patch.object(search_service, 'close', new_callable=AsyncMock), \
         patch.object(search_service, 'search_ideas', new_callable=AsyncMock, return_value=([], 0)), \
         patch.object(search_service, 'index_idea', new_callable=AsyncMock), \
         patch.object(cache_service, 'get_cache', new_callable=AsyncMock, return_value=None), \
         patch.object(cache_service, 'set_cache', new_callable=AsyncMock), \
         patch.object(cache_service, 'close', new_callable=AsyncMock):
         yield

@pytest_asyncio.fixture(scope="function")
async def async_client(db_session, mock_external_services):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
        
    app.dependency_overrides.clear()
