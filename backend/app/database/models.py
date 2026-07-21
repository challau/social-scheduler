import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    brand_voice = Column(Text, nullable=True)
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
    username = Column(String(100), nullable=True)
    # Platform-side identity needed for publishing: Instagram business account ID,
    # LinkedIn person URN (urn:li:person:xxx), or Twitter user ID
    platform_user_id = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=False) # Encrypted at rest
    refresh_token = Column(Text, nullable=True) # Encrypted at rest
    token_expires_at = Column(DateTime, nullable=True)
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
    posts = relationship("Post", back_populates="media")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=True) # Retained for prompt / draft copy backward compatibility
    platforms = Column(JSON, nullable=False) # JSON array of targets e.g. ["instagram", "linkedin"]
    status = Column(String(50), default="draft", nullable=False) # draft/scheduled/publishing/posted/partial_failed/failed
    scheduled_for = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="posts")
    media = relationship("Media", back_populates="posts")
    ai_generation = relationship("AIGeneration", back_populates="post", uselist=False, cascade="all, delete-orphan")
    results = relationship("PostResult", back_populates="post", cascade="all, delete-orphan")


class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=True)
    instagram_caption = Column(Text, nullable=True)
    linkedin_caption = Column(Text, nullable=True)
    twitter_caption = Column(Text, nullable=True)
    hashtags = Column(Text, nullable=True) # JSON array serialized as string
    content_score_json = Column(Text, nullable=True) # JSON object serialized as string containing creativity, engagement, seo_score
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="ai_generation")


class PostResult(Base):
    __tablename__ = "post_results"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False) # "instagram", "linkedin", "twitter"
    status = Column(String(50), nullable=False) # "success" or "failed"
    error_message = Column(Text, nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="results")
    analytics = relationship("Analytics", back_populates="post_result", cascade="all, delete-orphan")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    post_result_id = Column(Integer, ForeignKey("post_results.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False) # "instagram", "linkedin", "twitter"
    reach = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    post_result = relationship("PostResult", back_populates="analytics")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # "free", "pro"
    ai_limit = Column(Integer, default=10, nullable=False) # 10 generations per month
    price_monthly = Column(Integer, default=0, nullable=False) # In cents, e.g. 0 or 2900 ($29)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    stripe_subscription_id = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False) # "active", "canceled", "incomplete"
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    plan = relationship("Plan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stripe_payment_id = Column(String(100), nullable=False)
    amount = Column(Integer, nullable=False) # In cents
    status = Column(String(50), nullable=False) # "succeeded", "failed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
