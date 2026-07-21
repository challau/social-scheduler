import time
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import SocialAccount, User
from ..api.auth import get_current_user
from jose import jwt
from ..config import settings

router = APIRouter(prefix="/oauth", tags=["oauth"])

@router.get("/{platform}/login")
def connect_platform(
    platform: str,
    token: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Starts OAuth flow.
    Supports JWT token query param for redirect bindings.
    """
    current_user = None
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            current_user = db.query(User).filter(User.email == email).first()
        except Exception:
            pass

    if not current_user and user_id:
        current_user = db.query(User).filter(User.id == user_id).first()

    if not current_user:
        return RedirectResponse(url="http://localhost:5173/settings?error=unauthorized")

    platform = platform.lower()
    if platform not in ["instagram", "linkedin", "twitter"]:
        return RedirectResponse(url="http://localhost:5173/settings?error=invalid_platform")

    client_id_var = f"{platform.upper()}_CLIENT_ID"
    client_id = getattr(settings, client_id_var, None)

    # Mock mode fallback if credentials are unset
    if not client_id or settings.MOCK_MODE:
        existing = db.query(SocialAccount).filter(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == platform
        ).first()

        mock_usernames = {
            "instagram": "socialflow_business",
            "linkedin": "SocialFlow AI Creator",
            "twitter": "SocialFlowAI"
        }

        if existing:
            existing.access_token = f"mock_{platform}_token_{int(time.time())}"
            existing.username = mock_usernames[platform]
            existing.expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=60)
        else:
            new_acc = SocialAccount(
                user_id=current_user.id,
                platform=platform,
                access_token=f"mock_{platform}_token_{int(time.time())}",
                username=mock_usernames[platform],
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=60)
            )
            db.add(new_acc)
        db.commit()
        return RedirectResponse(url=f"http://localhost:5173/settings?platform={platform}&success=true")

    # Redirect to real provider OAuth
    redirect_url = ""
    # Use exact callback URLs matching /oauth/{platform}/callback
    if platform == "twitter":
        redirect_url = f"https://twitter.com/i/oauth2/authorize?response_type=code&client_id={client_id}&redirect_uri=http://localhost:8000/oauth/twitter/callback&scope=tweet.read%20tweet.write%20users.read&state={current_user.id}"
    elif platform == "linkedin":
        redirect_url = f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri=http://localhost:8000/oauth/linkedin/callback&state={current_user.id}&scope=w_member_social"
    elif platform == "instagram":
        redirect_url = f"https://www.facebook.com/v19.0/dialog/oauth?client_id={client_id}&redirect_uri=http://localhost:8000/oauth/instagram/callback&state={current_user.id}&scope=instagram_basic,instagram_content_publish"

    return RedirectResponse(url=redirect_url)

@router.get("/{platform}/callback")
def oauth_callback(platform: str, code: str, state: str, db: Session = Depends(get_db)):
    """Callback route mapped to /oauth/{platform}/callback"""
    user_id = int(state)
    platform = platform.lower()
    
    access_token = f"mock_{platform}_callback_token_{int(time.time())}"
    username = f"{platform}_user"

    existing = db.query(SocialAccount).filter(
        SocialAccount.user_id == user_id,
        SocialAccount.platform == platform
    ).first()

    if existing:
        existing.access_token = access_token
        existing.username = username
        existing.expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    else:
        new_acc = SocialAccount(
            user_id=user_id,
            platform=platform,
            access_token=access_token,
            username=username,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
        )
        db.add(new_acc)

    db.commit()
    return RedirectResponse(url=f"http://localhost:5173/settings?platform={platform}&success=true")

@router.get("/accounts", response_model=List[dict])
def get_connected_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    return [{
        "id": acc.id,
        "platform": acc.platform,
        "username": acc.username,
        "expires_at": acc.expires_at.isoformat() if acc.expires_at else None
    } for acc in accounts]

@router.delete("/accounts/{platform}", response_model=dict)
def disconnect_platform(platform: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    platform = platform.lower()
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.platform == platform
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail=f"No account connected for {platform}")

    db.delete(account)
    db.commit()
    return {"status": "success", "message": f"Successfully disconnected {platform}"}
