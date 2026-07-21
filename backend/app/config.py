from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # JWT authentication details
    SECRET_KEY: str = "super_secret_social_flow_ai_key_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # DB config
    DATABASE_URL: str = "sqlite:///./social_flow.db"

    # OpenAI configuration
    OPENAI_API_KEY: Optional[str] = None

    # Cloudinary storage config (can also be passed via URL)
    CLOUDINARY_URL: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Social Media API Credentials (OAuth Client IDs and Secrets)
    INSTAGRAM_CLIENT_ID: Optional[str] = None
    INSTAGRAM_CLIENT_SECRET: Optional[str] = None
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:8000/api/social/callback/instagram"

    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8000/api/social/callback/linkedin"

    TWITTER_CLIENT_ID: Optional[str] = None
    TWITTER_CLIENT_SECRET: Optional[str] = None
    TWITTER_REDIRECT_URI: str = "http://localhost:8000/api/social/callback/twitter"

    # SMTP Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "notifications@socialflow.ai"

    # CORS settings
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "https://socialflow.ai"]

    # Mock mode flag - forces usage of Mock engines even if credentials are provided (useful for tests)
    MOCK_MODE: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
