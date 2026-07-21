import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Post, AIGeneration, SocialAccount, Analytics
from ..api.auth import get_current_user
from ..database.models import User
from ..services.storage_service import storage_service
from ..services.ai_service import ai_service
from ..services.instagram_service import instagram_service
from ..services.linkedin_service import linkedin_service
from ..services.twitter_service import twitter_service

router = APIRouter(prefix="/api/posts", tags=["posts"])

# Pydantic models
class AIGenerationSchema(BaseModel):
    platform: str
    caption: str
    hashtags: Optional[str] = None
    summary: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    status: str = "draft"  # "draft" or "scheduled"
    scheduled_time: Optional[datetime.datetime] = None
    ai_generations: Optional[List[AIGenerationSchema]] = None

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    status: Optional[str] = None
    scheduled_time: Optional[datetime.datetime] = None

class AIGenerateRequest(BaseModel):
    prompt: str
    media_url: Optional[str] = None

# Routes
@router.post("", response_model=dict)
def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Create the post
    new_post = Post(
        user_id=current_user.id,
        content=post_data.content,
        media_url=post_data.media_url,
        media_type=post_data.media_type,
        status=post_data.status,
        scheduled_time=post_data.scheduled_time
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Save tailored AI generations if provided
    if post_data.ai_generations:
        for gen in post_data.ai_generations:
            ai_gen = AIGeneration(
                post_id=new_post.id,
                platform=gen.platform.lower(),
                caption=gen.caption,
                hashtags=gen.hashtags,
                summary=gen.summary
            )
            db.add(ai_gen)
        db.commit()

    return {
        "status": "success",
        "post_id": new_post.id,
        "message": "Post created successfully"
    }

@router.get("", response_model=List[dict])
def get_posts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == current_user.id).order_by(Post.created_at.desc()).all()
    
    result = []
    for post in posts:
        generations = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).all()
        gen_list = [{
            "platform": g.platform,
            "caption": g.caption,
            "hashtags": g.hashtags,
            "summary": g.summary
        } for g in generations]

        # Fetch analytics if available
        analytics_record = db.query(Analytics).filter(Analytics.post_id == post.id).first()
        analytics_data = {
            "views": analytics_record.views if analytics_record else 0,
            "likes": analytics_record.likes if analytics_record else 0,
            "comments": analytics_record.comments if analytics_record else 0,
            "shares": analytics_record.shares if analytics_record else 0
        }

        result.append({
            "id": post.id,
            "content": post.content,
            "media_url": post.media_url,
            "media_type": post.media_type,
            "status": post.status,
            "scheduled_time": post.scheduled_time.isoformat() if post.scheduled_time else None,
            "created_at": post.created_at.isoformat(),
            "ai_generations": gen_list,
            "analytics": analytics_data
        })
        
    return result

@router.get("/{post_id}", response_model=dict)
def get_post_details(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    generations = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).all()
    analytics_record = db.query(Analytics).filter(Analytics.post_id == post.id).first()
    
    return {
        "id": post.id,
        "content": post.content,
        "media_url": post.media_url,
        "media_type": post.media_type,
        "status": post.status,
        "scheduled_time": post.scheduled_time.isoformat() if post.scheduled_time else None,
        "created_at": post.created_at.isoformat(),
        "ai_generations": [{
            "platform": g.platform,
            "caption": g.caption,
            "hashtags": g.hashtags,
            "summary": g.summary
        } for g in generations],
        "analytics": {
            "views": analytics_record.views if analytics_record else 0,
            "likes": analytics_record.likes if analytics_record else 0,
            "comments": analytics_record.comments if analytics_record else 0,
            "shares": analytics_record.shares if analytics_record else 0
        } if analytics_record else None
    }

@router.delete("/{post_id}", response_model=dict)
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db.delete(post)
    db.commit()
    return {"status": "success", "message": "Post deleted successfully"}

@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Uploads file using storage service (Cloudinary or Local disk)"""
    try:
        res = await storage_service.upload_file(file)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/generate-ai")
def generate_ai(req: AIGenerateRequest, current_user: User = Depends(get_current_user)):
    """Calls OpenAI or Simulator to generate tailored copies and times"""
    try:
        content = ai_service.generate_social_content(req.prompt, req.media_url)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/{post_id}/publish")
def publish_post_now(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Publishes post immediately to all platforms connected and configured"""
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    account_by_platform = {acc.platform.lower(): acc for acc in accounts}

    generations = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).all()
    gen_by_platform = {gen.platform.lower(): gen for gen in generations}

    if not accounts:
        raise HTTPException(status_code=400, detail="No social accounts connected. Connect accounts in Settings.")

    publish_success = False
    
    # 1. Instagram
    if "instagram" in account_by_platform:
        acc = account_by_platform["instagram"]
        gen = gen_by_platform.get("instagram")
        caption = f"{gen.caption}\n\n{' '.join(['#' + t for t in json.loads(gen.hashtags)])}" if gen and gen.hashtags else post.content
        if post.media_url:
            res = instagram_service.publish_post(
                access_token=acc.access_token,
                caption=caption,
                media_url=post.media_url,
                instagram_business_id="mock_ig_business_id"
            )
            if res.get("status") == "success":
                publish_success = True

    # 2. LinkedIn
    if "linkedin" in account_by_platform:
        acc = account_by_platform["linkedin"]
        gen = gen_by_platform.get("linkedin")
        content = f"{gen.caption}\n\nSummary: {gen.summary}" if gen else post.content
        res = linkedin_service.publish_post(
            access_token=acc.access_token,
            content=content,
            media_url=post.media_url
        )
        if res.get("status") == "success":
            publish_success = True

    # 3. Twitter
    if "twitter" in account_by_platform:
        acc = account_by_platform["twitter"]
        gen = gen_by_platform.get("twitter")
        try:
            tags = json.loads(gen.hashtags) if gen and gen.hashtags else []
        except:
            tags = []
        tags_str = " ".join(["#" + t for t in tags])
        content = f"{gen.caption}\n\n{tags_str}" if gen else post.content
        res = twitter_service.publish_post(
            access_token=acc.access_token,
            content=content,
            media_url=post.media_url
        )
        if res.get("status") == "success":
            publish_success = True

    if publish_success:
        post.status = "published"
        # Seed default analytics
        import random
        analytics_record = Analytics(
            post_id=post.id,
            views=random.randint(150, 1500),
            likes=random.randint(15, 200),
            comments=random.randint(2, 30),
            shares=random.randint(1, 15)
        )
        db.add(analytics_record)
        db.commit()
        return {"status": "success", "message": "Published post successfully to connected platforms."}
    else:
        post.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Publishing failed on all connected accounts.")
