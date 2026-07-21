from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..api.auth import get_current_user
from ..database.models import User, Media
from ..services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

class AIGenerateRequest(BaseModel):
    prompt: str
    media_id: Optional[int] = None
    media_url: Optional[str] = None

class AIGenerateResponse(BaseModel):
    summary: str
    instagram_caption: str
    linkedin_caption: str
    twitter_caption: str
    hashtags: List[str]

@router.post("/generate", response_model=AIGenerateResponse)
def generate_post_content(
    req: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers OpenAI vision/text engine to generate a summary, captions, and hashtags.
    Maps internal service outputs directly to the specified JSON contract.
    """
    # 1. Resolve media url
    resolved_media_url = req.media_url
    if req.media_id:
        media_record = db.query(Media).filter(Media.id == req.media_id, Media.user_id == current_user.id).first()
        if media_record:
            resolved_media_url = media_record.file_url

    try:
        raw_output = ai_service.generate_social_content(req.prompt, resolved_media_url)
        
        # Consolidate hashtags from both platform feeds into a single unique array
        ig_tags = raw_output.get("instagram", {}).get("hashtags", [])
        tw_tags = raw_output.get("twitter", {}).get("hashtags", [])
        combined_tags = list(set(ig_tags + tw_tags))

        # Build response matching the required schema
        return {
            "summary": raw_output.get("linkedin", {}).get("summary") or raw_output.get("title") or "AI Social Campaign Summary",
            "instagram_caption": raw_output.get("instagram", {}).get("caption") or "",
            "linkedin_caption": raw_output.get("linkedin", {}).get("caption") or "",
            "twitter_caption": raw_output.get("twitter", {}).get("caption") or "",
            "hashtags": combined_tags
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
