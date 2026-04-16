from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Notification Service"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPICS: list[str] = ["ideas-events", "votes-events", "xp-events", "review-events"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
