from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Expert Review Service"
    
    # PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "expert_review_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_IDEAS_TOPIC: str = "ideas-events"
    KAFKA_REVIEWS_TOPIC: str = "review-events"

    # API Security
    USER_ID_HEADER: str = "X-User-Id"
    USER_NAME_HEADER: str = "X-User-Name"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
