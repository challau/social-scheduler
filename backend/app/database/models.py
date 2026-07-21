import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False) # "instagram", "linkedin", "twitter"
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    username = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="social_accounts")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_type = Column(String(50), nullable=False) # "image" or "video"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="media")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    platforms = Column(String(255), nullable=True) # comma separated e.g. "instagram,linkedin"
    status = Column(String(50), default="draft", nullable=False) # "draft", "scheduled", "published", "failed"
    scheduled_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="posts")
    ai_generation = relationship("AIGeneration", back_populates="post", uselist=False, cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="post", cascade="all, delete-orphan")


class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=True)
    instagram_caption = Column(Text, nullable=True)
    linkedin_caption = Column(Text, nullable=True)
    twitter_caption = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True) # JSON array serialized as string

    # Relationships
    post = relationship("Post", back_populates="ai_generation")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False) # "instagram", "linkedin", "twitter"
    likes = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    shares = Column(Integer, default=0, nullable=False)
    views = Column(Integer, default=0, nullable=False)
    reach = Column(Integer, default=0, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="analytics")
