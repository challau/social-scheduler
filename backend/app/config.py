from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # JWT authentication details
    SECRET_KEY: str = "super_secret_social_flow_ai_key_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Public URLs of the deployed services. OAuth redirect URIs, post-OAuth
    # browser redirects, CORS, and locally-stored media URLs all derive from
    # these two values unless overridden explicitly below.
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

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
    # Redirect URIs default to {BACKEND_URL}/oauth/{platform}/callback; set
    # them explicitly only if a provider requires a different path.
    INSTAGRAM_CLIENT_ID: Optional[str] = None
    INSTAGRAM_CLIENT_SECRET: Optional[str] = None
    INSTAGRAM_REDIRECT_URI: Optional[str] = None

    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    LINKEDIN_REDIRECT_URI: Optional[str] = None

    TWITTER_CLIENT_ID: Optional[str] = None
    TWITTER_CLIENT_SECRET: Optional[str] = None
    TWITTER_REDIRECT_URI: Optional[str] = None

    # SMTP Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "notifications@socialflow.ai"

    # CORS settings — comma-separated list of allowed browser origins.
    # FRONTEND_URL is always included automatically (see cors_origins below).
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Mock mode flag - forces usage of Mock engines even if credentials are provided (useful for tests)
    MOCK_MODE: bool = False

    # Run APScheduler inside the web process (convenient for local dev and
    # single-process deploys). Set to false in production when a dedicated
    # worker process (python -m app.workers.run_worker) handles publishing,
    # so posts aren't published twice.
    RUN_SCHEDULER_IN_WEB: bool = True

    # Production telemetry and routing config
    SENTRY_DSN: Optional[str] = None
    FORCE_HTTPS: bool = False

    # Redis configuration for background queuing and storage
    REDIS_URL: str = "redis://localhost:6379/0"

    # Stripe subscriptions configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRO_PRICE_ID: str = "price_pro_subscription_monthly"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip().rstrip("/") for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        frontend = self.FRONTEND_URL.rstrip("/")
        if frontend and frontend not in origins:
            origins.append(frontend)
        return origins

    def _redirect_uri(self, explicit: Optional[str], platform: str) -> str:
        return explicit or f"{self.BACKEND_URL.rstrip('/')}/oauth/{platform}/callback"

    @property
    def instagram_redirect_uri(self) -> str:
        return self._redirect_uri(self.INSTAGRAM_REDIRECT_URI, "instagram")

    @property
    def linkedin_redirect_uri(self) -> str:
        return self._redirect_uri(self.LINKEDIN_REDIRECT_URI, "linkedin")

    @property
    def twitter_redirect_uri(self) -> str:
        return self._redirect_uri(self.TWITTER_REDIRECT_URI, "twitter")

settings = Settings()
