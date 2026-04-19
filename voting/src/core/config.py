from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Voting Service"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "voting_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 2

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_VOTES_TOPIC: str = "votes-events"
    KAFKA_XP_TOPIC: str = "xp-events"

    # User Service
    USER_SERVICE_URL: str = "http://localhost:8001"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://jaeger:4317"
    JAEGER_AGENT_PORT: int = 6831

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
