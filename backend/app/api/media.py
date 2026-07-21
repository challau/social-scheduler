import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Media, User
from ..api.auth import get_current_user
from ..services.storage_service import storage_service

router = APIRouter(prefix="/media", tags=["media"])

@router.post("/upload", response_model=dict)
async def upload_media_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a file to Cloudinary (or local folder fallback),
    saves the transaction metadata in the Media table, and returns details.
    """
    try:
        # 1. Run upload through the storage service
        upload_result = await storage_service.upload_file(file)
        
        # 2. Log file record in database
        media_record = Media(
            user_id=current_user.id,
            file_url=upload_result["url"],
            file_type=upload_result["media_type"]
        )
        db.add(media_record)
        db.commit()
        db.refresh(media_record)
        
        return {
            "id": media_record.id,
            "file_url": media_record.file_url,
            "file_type": media_record.file_type,
            "thumbnail_url": upload_result.get("thumbnail_url", media_record.file_url)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Media upload failed: {str(e)}")
