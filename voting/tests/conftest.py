import pytest
import pytest_asyncio
import redis.asyncio as redis
from httpx import AsyncClient, ASGITransport
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from unittest.mock import AsyncMock, patch

from src.db.session import get_db
from src.db.models import Base
from src.main import app
from src.services.kafka_service import kafka_service
from src.services.vote_service import vote_service

postgres = PostgresContainer("postgres:15-alpine")
redis_container = RedisContainer("redis:latest")

@pytest.fixture(scope="session", autouse=True)
def setup_containers():
    postgres.start()
    redis_container.start()
    yield
    postgres.stop()
    redis_container.stop()

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
async def mock_services():
    # Setup test redis
    test_redis = redis.from_url(
        f"redis://{redis_container.get_container_host_ip()}:{redis_container.get_exposed_port(6379)}",
        decode_responses=True
    )
    old_redis = vote_service.redis
    vote_service.redis = test_redis
    
    with patch.object(kafka_service, 'start', new_callable=AsyncMock), \
         patch.object(kafka_service, 'stop', new_callable=AsyncMock), \
         patch.object(kafka_service, 'send_vote_event', new_callable=AsyncMock), \
         patch.object(kafka_service, 'send_xp_event', new_callable=AsyncMock):
         yield
         
    await test_redis.close()
    vote_service.redis = old_redis

@pytest_asyncio.fixture(scope="function")
async def async_client(db_session, mock_services):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
        
    app.dependency_overrides.clear()
