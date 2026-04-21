from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Project info
    PROJECT_NAME: str = "User Service"
    
    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "users_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # JWT Settings
    SECRET_KEY: str = Field(default="temporary-secret-key-that-is-at-least-32-chars-long", alias="JWT_SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30 # 30 days

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_XP_TOPIC: str = "xp-events"
    KAFKA_VOTES_TOPIC: str = "votes-events"
    KAFKA_DLQ_TOPIC: str = "dead-letter-queue"

    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://jaeger:4317"
    JAEGER_AGENT_PORT: int = 6831

    # Cloudflare R2
    R2_ACCOUNT_ID: str | None = None
    
    # Public Bucket (for profile avatars etc, if needed here)
    R2_BUCKET_NAME_PUBLIC: str = "panchayat"
    R2_S3_API_BASE_URL_PANCHAYAT_PUBLIC: str | None = None
    R2_ACCESS_KEY_ID_PANCHAYAT_PUBLIC: str | None = None
    R2_SECRET_ACCESS_KEY_PANCHAYAT_PUBLIC: str | None = None
    
    # Private Bucket (for expert docs, verification, legal)
    R2_BUCKET_NAME_PRIVATE: str = "panchayat-private"
    R2_S3_API_BASE_URL_PANCHAYAT_PRIVATE: str | None = Field(default=None, alias="R2_S3_API_BASE_URL_PANCHAYAT")
    R2_ACCESS_KEY_ID_PANCHAYAT_PRIVATE: str | None = None
    R2_SECRET_ACCESS_KEY_PANCHAYAT_PRIVATE: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
