import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from ..config import settings

# Resolved via pydantic-settings: real env var first, then .env file,
# then the SQLite fallback for local development
DATABASE_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Render/Heroku hand out postgres:// URLs, which SQLAlchemy 2.x no longer accepts
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs extra arguments to allow multi-threaded access in FastAPI
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
