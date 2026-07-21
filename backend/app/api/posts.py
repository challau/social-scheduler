import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Post, AIGeneration, SocialAccount, Analytics, User, Media, PostResult
from ..api.auth import get_current_user
from ..services.publisher import publish_post_campaign

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
    media_id: Optional[int] = None
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
    # 1. Resolve media_id
    resolved_media_id = req.media_id
    if not resolved_media_id and req.media_url:
        # Create matching media record to maintain schema consistency
        media = Media(
            user_id=current_user.id,
            file_url=req.media_url,
            file_type="image" # Default to image
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        resolved_media_id = media.id

    # 2. Create main post record
    new_post = Post(
        user_id=current_user.id,
        media_id=resolved_media_id,
        content=req.content,
        platforms=req.platforms, # JSON array
        status=req.status.lower(),
        scheduled_for=req.scheduled_time
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # 3. Save AI copy versions
    ai_summary = req.content
    ai_insta = req.content
    ai_link = req.content
    ai_twit = req.content
    ai_tags = []

    if req.ai_generation:
        ai_summary = req.ai_generation.summary or ai_summary
        ai_insta = req.ai_generation.instagram_caption or ai_insta
        ai_link = req.ai_generation.linkedin_caption or ai_link
        ai_twit = req.ai_generation.twitter_caption or ai_twit
        ai_tags = req.ai_generation.hashtags

    ai_gen = AIGeneration(
        post_id=new_post.id,
        summary=ai_summary,
        instagram_caption=ai_insta,
        linkedin_caption=ai_link,
        twitter_caption=ai_twit,
        hashtags=json.dumps(ai_tags)
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
        g = post.ai_generation
        ai_data = None
        content_text = ""
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
            content_text = post.content or g.summary or g.instagram_caption or ""

        # Fetch per-platform results
        results_list = []
        for r in post.results:
            results_list.append({
                "platform": r.platform,
                "status": r.status,
                "error_message": r.error_message,
                "published_at": r.published_at.isoformat()
            })

        # Fetch aggregated analytics
        analytics_records = db.query(Analytics).join(PostResult).filter(PostResult.post_id == post.id).all()
        reach = sum(a.reach for a in analytics_records)
        likes = sum(a.likes for a in analytics_records)
        comments = sum(a.comments for a in analytics_records)

        result.append({
            "id": post.id,
            "content": content_text,
            "media_url": post.media.file_url if post.media else None,
            "platforms": post.platforms,
            "status": post.status,
            "scheduled_time": post.scheduled_for.isoformat() if post.scheduled_for else None,
            "created_at": post.created_at.isoformat(),
            "ai_generation": ai_data,
            "results": results_list,
            "analytics": {
                "views": reach, # Map to reach
                "likes": likes,
                "comments": comments,
                "shares": 0,
                "reach": reach
            }
        })
    return result

@router.post("/publish", response_model=List[dict])
def publish_post_immediately(
    req: PublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publishes post immediately to all selected platforms, returning per-platform result array"""
    post = db.query(Post).filter(Post.id == req.post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get user connected platforms
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    account_by_platform = {acc.platform.lower(): acc for acc in accounts}

    # Verify connection fast if none connected
    target_platforms = post.platforms
    if not target_platforms:
        raise HTTPException(status_code=400, detail="No publishing platforms selected for this post.")

    for plat in target_platforms:
        if plat.lower() not in account_by_platform:
            raise HTTPException(status_code=400, detail=f"Platform '{plat}' is not connected. Link your profile in Settings.")

    # Call campaign publisher service
    results = publish_post_campaign(db, post.id)
    return results

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
    post.scheduled_for = req.scheduled_time
    db.commit()
    
    return {"status": "success", "message": f"Scheduled campaign successfully for {req.scheduled_time}"}
