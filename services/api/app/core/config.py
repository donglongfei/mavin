from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    api_title: str = "Mavin v1.0 API"
    api_version: str = "1.0.0"
    api_description: str = "Agentic Operating System API"

    # Qdrant Configuration
    qdrant_host: str = "qdrant"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "mavin_memory"

    # Agent Service Configuration
    agent_service_url: str = "http://agent-service:8001"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
