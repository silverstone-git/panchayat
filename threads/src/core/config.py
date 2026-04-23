from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Thread Service"
    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "threads_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

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
    KAFKA_XP_TOPIC: str = "xp-events"
    KAFKA_CONTENT_HIDDEN_TOPIC: str = "content.hidden"
    KAFKA_EXPERT_EVENTS_TOPIC: str = "expert-events"
    KAFKA_DLQ_TOPIC: str = "dead-letter-queue"
    POPULAR_VOTE_THRESHOLD: int = 500

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://elasticsearch:9200"
    ELASTICSEARCH_INDEX: str = "ideas"
    ELASTIC_USER: str = "elastic"
    ELASTIC_PASSWORD: str = ""

    # API Security (Simulated from Gateway)
    USER_ID_HEADER: str = "X-User-Id"
    USER_NAME_HEADER: str = "X-User-Name"

    # Moderation Service
    MODERATION_SERVICE_URL: str = "http://localhost:8005"
    VOTING_SERVICE_URL: str = "http://voting:8000"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://jaeger:4317"
    JAEGER_AGENT_PORT: int = 6831

    # R2 Storage (Public for idea images)
    R2_ACCOUNT_ID: str = ""
    R2_BUCKET_NAME_PUBLIC: str = "panchayat"
    R2_ACCESS_KEY_ID_PANCHAYAT_PUBLIC: str = ""
    R2_SECRET_ACCESS_KEY_PANCHAYAT_PUBLIC: str = ""
    R2_S3_API_BASE_URL_PANCHAYAT_PUBLIC: str = ""
    R2_PUBLIC_DEVELOPMENT_URL_PANCHAYAT_PUBLIC: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
