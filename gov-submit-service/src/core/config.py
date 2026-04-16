from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gov Submit Service"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_REVIEWS_TOPIC: str = "review-events"
    
    # Submission Threshold
    MIN_EXPERT_SCORE: float = 7.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
