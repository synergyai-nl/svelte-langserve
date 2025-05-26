"""Configuration settings for the Claude Dashboard Backend."""

import os


class Settings:
    """Application settings."""

    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # CORS Configuration
    ALLOW_ORIGINS: list[str] = ["*"]  # Configure appropriately for production
    ALLOW_CREDENTIALS: bool = True
    ALLOW_METHODS: list[str] = ["*"]
    ALLOW_HEADERS: list[str] = ["*"]

    # Authentication Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    # Database Configuration
    LANGGRAPH_DB_URL: str = os.getenv(
        "LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph"
    )
    USE_IN_MEMORY_DB: bool = os.getenv("USE_IN_MEMORY_DB", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"


settings = Settings()
