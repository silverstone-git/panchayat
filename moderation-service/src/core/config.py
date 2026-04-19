from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Moderation Service"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_IDEAS_TOPIC: str = "ideas-events"
    KAFKA_MODERATION_TOPIC: str = "moderation-events"
    KAFKA_REPORTS_TOPIC: str = "moderation.reports"
    KAFKA_CONTENT_HIDDEN_TOPIC: str = "content.hidden"
    KAFKA_DLQ_TOPIC: str = "dead-letter-queue"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://jaeger:4317"

    # Moderation Logic
    REPORT_THRESHOLD: int = 10

    # API Security (Simulated from Gateway)
    USER_ID_HEADER: str = "X-User-Id"
    USER_NAME_HEADER: str = "X-User-Name"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
