"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_prefix: str = "/v1"
    
    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # Database Configuration
    db_dsn: str = "postgresql+asyncpg://user:password@localhost:5432/equity"
    
    # Application Settings
    default_tz: str = "Asia/Seoul"
    max_page_size: int = 200
    
    # Logging
    log_level: str = "INFO"
    
    # Stock data settings
    use_live_prices: bool = True  # Set to False to use only cached database prices
    cache_prices_to_db: bool = False  # Set to True to cache fetched prices to database
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()

