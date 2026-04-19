import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from src.db.session import get_db
from src.db.models import Base
from src.main import app

# Spin up Postgres in a test container
postgres = PostgresContainer("postgres:15-alpine")

@pytest.fixture(scope="session", autouse=True)
def setup_postgres():
    postgres.start()
    yield
    postgres.stop()

@pytest_asyncio.fixture(scope="function")
async def db_engine():
    # testcontainers provides sync URL, we need asyncpg
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
async def async_client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
        
    app.dependency_overrides.clear()
