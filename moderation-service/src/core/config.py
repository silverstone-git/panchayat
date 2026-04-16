from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Moderation Service"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_IDEAS_TOPIC: str = "ideas-events"
    KAFKA_MODERATION_TOPIC: str = "moderation-events"

    # API Security (Simulated from Gateway)
    USER_ID_HEADER: str = "X-User-Id"
    USER_NAME_HEADER: str = "X-User-Name"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
