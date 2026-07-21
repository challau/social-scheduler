import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database.session import engine, Base
from .api import auth, posts, oauth, analytics, media, ai, billing
from .workers.scheduler_worker import start_scheduler, stop_scheduler
from .services.storage_service import UPLOAD_DIR
from .middleware.rate_limiter import RateLimiterMiddleware

# Try to import sentry_sdk dynamically for production error telemetry
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
except ImportError:
    sentry_sdk = None

# Initialize Sentry if DSN is set
if sentry_sdk and settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )
    print("[Telemetry] Sentry SDK initialized successfully.")

# Automatically create tables in database (runs on startup)
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run the scheduler in-process unless a dedicated worker
    # process handles it (RUN_SCHEDULER_IN_WEB=false in production)
    if settings.RUN_SCHEDULER_IN_WEB:
        start_scheduler()
    yield
    if settings.RUN_SCHEDULER_IN_WEB:
        stop_scheduler()

app = FastAPI(
    title="SocialFlow AI API",
    description="Clean-architecture backend for AI-powered social media scheduling & management",
    version="1.0.0",
    lifespan=lifespan
)

# Force HTTPS redirect middleware in production environment
class HTTPSRedirectMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and settings.FORCE_HTTPS:
            # Check if request was forwarded as HTTP
            headers = dict(scope.get("headers", []))
            proto = headers.get(b"x-forwarded-proto", b"").decode("utf-8")
            if proto == "http" or scope.get("scheme") == "http":
                # Redirect to HTTPS
                host = headers.get(b"host", b"localhost").decode("utf-8")
                path = scope.get("path", "")
                query = scope.get("query_string", b"").decode("utf-8")
                url = f"https://{host}{path}"
                if query:
                    url += f"?{query}"
                
                await send({
                    "type": "http.response.start",
                    "status": 301,
                    "headers": [
                        (b"location", url.encode("utf-8")),
                        (b"content-length", b"0")
                    ]
                })
                await send({"type": b"http.response.body", "body": b""})
                return
        await self.app(scope, receive, send)

# Register middlewares in correct order
if settings.FORCE_HTTPS:
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(RateLimiterMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded media directory so it can be served statically
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers under their exact non-api prefixes
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(ai.router)
app.include_router(oauth.router)
app.include_router(posts.router)
app.include_router(analytics.router)
app.include_router(billing.router)

@app.get("/")
def read_root():
    return {
        "name": "SocialFlow AI API",
        "status": "healthy",
        "version": "1.0.0"
    }
