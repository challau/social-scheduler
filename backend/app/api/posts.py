import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Post, AIGeneration, SocialAccount, Analytics, User
from ..api.auth import get_current_user
from ..services.instagram_service import instagram_service
from ..services.linkedin_service import linkedin_service
from ..services.twitter_service import twitter_service

router = APIRouter(prefix="/posts", tags=["posts"])

# Pydantic Schemas
class AIGenerationInput(BaseModel):
    summary: Optional[str] = None
    instagram_caption: Optional[str] = None
    linkedin_caption: Optional[str] = None
    twitter_caption: Optional[str] = None
    hashtags: List[str] = []

class PostCreateRequest(BaseModel):
    content: str
    media_url: Optional[str] = None
    platforms: List[str] # ["instagram", "linkedin", "twitter"]
    status: str = "draft" # "draft" or "scheduled"
    scheduled_time: Optional[datetime.datetime] = None
    ai_generation: Optional[AIGenerationInput] = None

class PublishRequest(BaseModel):
    post_id: int

class ScheduleRequest(BaseModel):
    post_id: int
    scheduled_time: datetime.datetime

# Routes
@router.post("/create", response_model=dict)
def create_post(
    req: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new post campaign. Saves the selected platforms
    and copies in the database.
    """
    # Create main post record
    platforms_str = ",".join([p.lower() for p in req.platforms])
    new_post = Post(
        user_id=current_user.id,
        content=req.content,
        media_url=req.media_url,
        platforms=platforms_str,
        status=req.status.lower(),
        scheduled_time=req.scheduled_time
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Save unified AI copy versions if provided
    if req.ai_generation:
        ai_gen = AIGeneration(
            post_id=new_post.id,
            summary=req.ai_generation.summary,
            instagram_caption=req.ai_generation.instagram_caption,
            linkedin_caption=req.ai_generation.linkedin_caption,
            twitter_caption=req.ai_generation.twitter_caption,
            hashtags=json.dumps(req.ai_generation.hashtags)
        )
        db.add(ai_gen)
        db.commit()

    return {
        "status": "success",
        "post_id": new_post.id,
        "message": "Post created successfully"
    }

@router.get("", response_model=List[dict])
def get_posts_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns posts history for the logged-in user"""
    posts = db.query(Post).filter(Post.user_id == current_user.id).order_by(Post.created_at.desc()).all()
    
    result = []
    for post in posts:
        # Fetch AI generated text for this campaign
        g = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).first()
        ai_data = None
        if g:
            try:
                tags = json.loads(g.hashtags) if g.hashtags else []
            except:
                tags = []
            ai_data = {
                "summary": g.summary,
                "instagram_caption": g.instagram_caption,
                "linkedin_caption": g.linkedin_caption,
                "twitter_caption": g.twitter_caption,
                "hashtags": tags
            }

        # Fetch aggregated analytics
        analytics_records = db.query(Analytics).filter(Analytics.post_id == post.id).all()
        # Sum views/likes across platforms
        views = sum(a.views for a in analytics_records)
        likes = sum(a.likes for a in analytics_records)
        comments = sum(a.comments for a in analytics_records)
        shares = sum(a.shares for a in analytics_records)
        reach = sum(a.reach for a in analytics_records)

        result.append({
            "id": post.id,
            "content": post.content,
            "media_url": post.media_url,
            "platforms": post.platforms.split(",") if post.platforms else [],
            "status": post.status,
            "scheduled_time": post.scheduled_time.isoformat() if post.scheduled_time else None,
            "created_at": post.created_at.isoformat(),
            "ai_generation": ai_data,
            "analytics": {
                "views": views,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "reach": reach
            }
        })
    return result

@router.post("/publish", response_model=dict)
def publish_post_immediately(
    req: PublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publishes post immediately to all selected platforms"""
    post = db.query(Post).filter(Post.id == req.post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get user connected platforms
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    account_by_platform = {acc.platform.lower(): acc for acc in accounts}

    # Fetch AI generation copies
    gen = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).first()
    
    # Selected platforms list
    target_platforms = post.platforms.split(",") if post.platforms else []
    if not target_platforms:
        raise HTTPException(status_code=400, detail="No publishing platforms selected for this post.")

    # Check if connected
    for plat in target_platforms:
        if plat not in account_by_platform:
            raise HTTPException(status_code=400, detail=f"Platform '{plat}' is not connected. Link your profile in Settings.")

    publish_success = False

    # 1. Instagram
    if "instagram" in target_platforms and "instagram" in account_by_platform:
        acc = account_by_platform["instagram"]
        caption = ""
        if gen:
            try:
                tags = json.loads(gen.hashtags) if gen.hashtags else []
            except:
                tags = []
            tags_str = " ".join(["#" + t for t in tags])
            caption = f"{gen.instagram_caption}\n\n{tags_str}"
        else:
            caption = post.content

        if post.media_url:
            res = instagram_service.publish_post(
                access_token=acc.access_token,
                caption=caption,
                media_url=post.media_url,
                instagram_business_id="mock_ig_business_id"
            )
            if res.get("status") == "success":
                publish_success = True
                _add_analytics_seed(db, post.id, "instagram")

    # 2. LinkedIn
    if "linkedin" in target_platforms and "linkedin" in account_by_platform:
        acc = account_by_platform["linkedin"]
        content = ""
        if gen:
            content = f"{gen.linkedin_caption}\n\nSummary: {gen.summary}"
        else:
            content = post.content

        res = linkedin_service.publish_post(
            access_token=acc.access_token,
            content=content,
            media_url=post.media_url
        )
        if res.get("status") == "success":
            publish_success = True
            _add_analytics_seed(db, post.id, "linkedin")

    # 3. Twitter
    if "twitter" in target_platforms and "twitter" in account_by_platform:
        acc = account_by_platform["twitter"]
        content = ""
        if gen:
            try:
                tags = json.loads(gen.hashtags) if gen.hashtags else []
            except:
                tags = []
            tags_str = " ".join(["#" + t for t in tags])
            content = f"{gen.twitter_caption}\n\n{tags_str}"
        else:
            content = post.content

        res = twitter_service.publish_post(
            access_token=acc.access_token,
            content=content,
            media_url=post.media_url
        )
        if res.get("status") == "success":
            publish_success = True
            _add_analytics_seed(db, post.id, "twitter")

    if publish_success:
        post.status = "published"
        db.commit()
        return {"status": "success", "message": f"Successfully published campaign to: {', '.join(target_platforms)}"}
    else:
        post.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Publishing failed on all target networks.")

@router.post("/schedule", response_model=dict)
def schedule_post(
    req: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedules a post campaign"""
    post = db.query(Post).filter(Post.id == req.post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = "scheduled"
    post.scheduled_time = req.scheduled_time
    db.commit()
    
    return {"status": "success", "message": f"Scheduled campaign successfully for {req.scheduled_time}"}

def _add_analytics_seed(db: Session, post_id: int, platform: str):
    """Seed helper to insert dummy metrics for published channels"""
    import random
    views = random.randint(120, 1400)
    likes = random.randint(10, 180)
    comments = random.randint(1, 20)
    shares = random.randint(1, 10)
    reach = int(views * 0.85)

    analytics = Analytics(
        post_id=post_id,
        platform=platform,
        views=views,
        likes=likes,
        comments=comments,
        shares=shares,
        reach=reach
    )
    db.add(analytics)
    db.commit()
