import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database.session import engine, Base
from .api import auth, posts, social_accounts, analytics
from .workers.scheduler_worker import start_scheduler, stop_scheduler
from .services.storage_service import UPLOAD_DIR

# Automatically create tables in database (runs on startup)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SocialFlow AI API",
    description="Clean-architecture backend for AI-powered social media scheduling & management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded media directory so it can be served statically
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routes
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(social_accounts.router)
app.include_router(analytics.router)

@app.on_event("startup")
def on_startup():
    # Start the background task scheduler worker
    start_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    # Stop the background task scheduler worker
    stop_scheduler()

@app.get("/")
def read_root():
    return {
        "name": "SocialFlow AI API",
        "status": "healthy",
        "version": "1.0.0"
    }
