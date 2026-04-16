from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "threads_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_IDEAS_TOPIC: str = "ideas-events"
    KAFKA_VOTES_TOPIC: str = "votes-events"
    POPULAR_VOTE_THRESHOLD: int = 500

    # Elasticsearch
    ELASTICSEARCH_URL: str = "https://localhost:9200"
    ELASTICSEARCH_INDEX: str = "ideas"
    ELASTIC_USER: str = "elastic"
    ELASTIC_PASSWORD: str = ""

    # API Security (Simulated from Gateway)
    USER_ID_HEADER: str = "X-User-Id"
    USER_NAME_HEADER: str = "X-User-Name"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
