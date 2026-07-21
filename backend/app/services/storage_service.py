import os
import uuid
import shutil
from typing import Dict, Any
from fastapi import UploadFile
from ..config import settings

# Attempt to configure Cloudinary if credentials are provided
cloudinary_configured = False
if settings.CLOUDINARY_URL or (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
    try:
        import cloudinary
        import cloudinary.uploader
        
        # If url is set, it overrides explicit settings
        if settings.CLOUDINARY_URL:
            cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
        else:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
        cloudinary_configured = True
    except Exception as e:
        print(f"Failed to initialize Cloudinary storage, falling back to local storage: {e}")

# Base upload directory for local fallback
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

class StorageService:
    def __init__(self):
        # Ensure local upload directory exists
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR, exist_ok=True)

    async def upload_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Uploads a file to Cloudinary or falls back to saving it on local disk.
        Returns a dictionary containing 'url', 'media_type', and 'thumbnail_url'.
        """
        filename = file.filename or f"{uuid.uuid4().hex}"
        content_type = file.content_type or "image/jpeg"
        
        # Determine media type (image or video)
        media_type = "image"
        if content_type.startswith("video/"):
            media_type = "video"

        # 1. Cloudinary upload path
        if cloudinary_configured and not settings.MOCK_MODE:
            try:
                # Read file content into memory
                content = await file.read()
                # Rewind file for safety
                await file.seek(0)
                
                # Upload to Cloudinary with auto resource type
                upload_result = cloudinary.uploader.upload(
                    content,
                    resource_type="auto",
                    folder="socialflow_ai",
                    quality="auto",  # automatic image compression
                )
                
                url = upload_result.get("secure_url")
                
                # Cloudinary automatic thumbnail generation
                thumbnail_url = url
                if media_type == "video":
                    # For video, replace extension with jpg and add start offset parameter
                    public_id = upload_result.get("public_id")
                    thumbnail_url = cloudinary.utils.cloudinary_url(
                        public_id,
                        resource_type="video",
                        format="jpg",
                        start_offset="0"
                    )[0]
                elif media_type == "image":
                    public_id = upload_result.get("public_id")
                    thumbnail_url = cloudinary.utils.cloudinary_url(
                        public_id,
                        width=300,
                        height=300,
                        crop="fill"
                    )[0]

                return {
                    "url": url,
                    "media_type": media_type,
                    "thumbnail_url": thumbnail_url,
                    "public_id": upload_result.get("public_id")
                }
            except Exception as e:
                print(f"Cloudinary upload failed, falling back to local: {e}")
                # Reset seek if we failed midway
                await file.seek(0)

        # 2. Local fallback upload path
        unique_filename = f"{uuid.uuid4().hex}_{filename.replace(' ', '_')}"
        dest_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Server-relative URL that FastAPI static files mounts will serve
        url = f"{settings.BACKEND_URL.rstrip('/')}/uploads/{unique_filename}"
        
        # Local thumbnail: for local images, same as url, for videos, use a placeholder or same
        thumbnail_url = url
        if media_type == "video":
            thumbnail_url = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&h=200&fit=crop"

        return {
            "url": url,
            "media_type": media_type,
            "thumbnail_url": thumbnail_url,
            "local_path": dest_path
        }

storage_service = StorageService()
