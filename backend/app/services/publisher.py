import datetime
import json
import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..database.models import Post, SocialAccount, AIGeneration, PostResult, Analytics
from .instagram_service import instagram_service
from .linkedin_service import linkedin_service
from .twitter_service import twitter_service
from .oauth_service import refresh_social_token

def publish_post_campaign(db: Session, post_id: int) -> List[Dict[str, Any]]:
    """
    Publishes a Post campaign to all selected target platforms.
    Loops through platforms, checks/refreshes tokens, publishes,
    logs results in PostResult, seeds Analytics if success,
    updates Post.status (posted / partial_failed / failed),
    and returns a summary array of individual platform results.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return []

    post.status = "publishing"
    db.commit()

    # Load targets list from Post platforms JSON field
    target_platforms = post.platforms
    if not target_platforms:
        post.status = "failed"
        db.commit()
        return []

    if isinstance(target_platforms, str):
        try:
            target_platforms = json.loads(target_platforms)
        except:
            target_platforms = target_platforms.split(",")

    # Get user social credentials
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == post.user_id).all()
    account_by_platform = {acc.platform.lower(): acc for acc in accounts}

    # Fetch AI generation captions
    gen = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).first()

    # Determine media url
    media_url = post.media.file_url if post.media else None

    # Track results
    results_summary = []
    success_count = 0
    fail_count = 0

    for platform in target_platforms:
        platform_lower = platform.lower()
        
        # 1. Check if social account is connected
        if platform_lower not in account_by_platform:
            err_msg = "Account not connected"
            _record_result(db, post.id, platform_lower, "failed", err_msg)
            results_summary.append({"platform": platform_lower, "status": "failed", "error": err_msg})
            fail_count += 1
            continue

        account = account_by_platform[platform_lower]
        
        # 2. Check and refresh OAuth credentials
        try:
            active_access_token = refresh_social_token(db, account)
        except ValueError as val_err:
            err_msg = str(val_err) # "reconnect account"
            _record_result(db, post.id, platform_lower, "failed", err_msg)
            results_summary.append({"platform": platform_lower, "status": "failed", "error": err_msg})
            fail_count += 1
            continue
        except Exception:
            err_msg = "reconnect account"
            _record_result(db, post.id, platform_lower, "failed", err_msg)
            results_summary.append({"platform": platform_lower, "status": "failed", "error": err_msg})
            fail_count += 1
            continue

        # 3. Publish to platform
        pub_res = {"status": "failed", "error": "Unknown error"}
        try:
            if platform_lower == "instagram":
                caption = ""
                if gen:
                    try:
                        tags = json.loads(gen.hashtags) if gen.hashtags else []
                    except:
                        tags = []
                    tags_str = " ".join(["#" + t for t in tags])
                    caption = f"{gen.instagram_caption}\n\n{tags_str}"
                else:
                    caption = "Shared via SocialFlow AI"

                pub_res = instagram_service.publish_post(
                    access_token=active_access_token,
                    caption=caption,
                    media_url=media_url or "https://socialflow.ai/default.png",
                    instagram_business_id=account.platform_user_id
                )

            elif platform_lower == "linkedin":
                content = ""
                if gen:
                    content = f"{gen.linkedin_caption}\n\nSummary: {gen.summary}"
                else:
                    content = "Shared via SocialFlow AI"

                pub_res = linkedin_service.publish_post(
                    access_token=active_access_token,
                    content=content,
                    media_url=media_url,
                    person_urn=account.platform_user_id
                )

            elif platform_lower == "twitter":
                content = ""
                if gen:
                    try:
                        tags = json.loads(gen.hashtags) if gen.hashtags else []
                    except:
                        tags = []
                    tags_str = " ".join(["#" + t for t in tags])
                    content = f"{gen.twitter_caption}\n\n{tags_str}"
                else:
                    content = "Shared via SocialFlow AI"

                pub_res = twitter_service.publish_post(
                    access_token=active_access_token,
                    content=content,
                    media_url=media_url
                )

        except Exception as e:
            # Dynamically import Sentry to avoid dependency crash in environments without it
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            except ImportError:
                pass
            pub_res = {"status": "failed", "error": str(e)}

        # 4. Save results
        if pub_res.get("status") == "success":
            res_row = _record_result(db, post.id, platform_lower, "success")
            _seed_analytics(db, res_row.id, platform_lower)
            results_summary.append({"platform": platform_lower, "status": "success"})
            success_count += 1
        else:
            err_msg = pub_res.get("error", "Publishing failed")
            _record_result(db, post.id, platform_lower, "failed", err_msg)
            results_summary.append({"platform": platform_lower, "status": "failed", "error": err_msg})
            fail_count += 1

    # 5. Determine final Post status
    if success_count > 0 and fail_count > 0:
        post.status = "partial_failed"
    elif success_count > 0:
        post.status = "posted"
    else:
        post.status = "failed"

    db.commit()
    return results_summary

def _record_result(db: Session, post_id: int, platform: str, status: str, error_message: str = None) -> PostResult:
    res = PostResult(
        post_id=post_id,
        platform=platform,
        status=status,
        error_message=error_message,
        published_at=datetime.datetime.utcnow()
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res

def _seed_analytics(db: Session, post_result_id: int, platform: str):
    likes = random.randint(10, 180)
    comments = random.randint(1, 20)
    reach = random.randint(100, 1200)

    analytics = Analytics(
        post_result_id=post_result_id,
        platform=platform,
        reach=reach,
        likes=likes,
        comments=comments,
        recorded_at=datetime.datetime.utcnow()
    )
    db.add(analytics)
    db.commit()
