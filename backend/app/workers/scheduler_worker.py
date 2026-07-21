import datetime
import json
import smtplib
import random
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from ..database.session import SessionLocal
from ..database.models import Post, SocialAccount, AIGeneration, Analytics, User
from ..services.instagram_service import instagram_service
from ..services.linkedin_service import linkedin_service
from ..services.twitter_service import twitter_service
from ..config import settings

def send_email_notification(to_email: str, subject: str, body: str):
    """Sends email notifications (mocked or real SMTP)"""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"[Email Notification Simulator] To: {to_email} | Subject: {subject} | Body: {body}")
        return

    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        print(f"Successfully sent email notification to {to_email}")
    except Exception as e:
        print(f"Failed to send email notification: {e}")

def publish_scheduled_posts():
    """
    Checks database for pending scheduled posts and auto-publishes them
    to selected platforms using the single-row AIGeneration scheme.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        pending_posts = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_time <= now
        ).all()

        if not pending_posts:
            return

        print(f"[Scheduler] Found {len(pending_posts)} pending scheduled posts to publish.")

        for post in pending_posts:
            user = db.query(User).filter(User.id == post.user_id).first()
            if not user:
                post.status = "failed"
                db.commit()
                continue

            # Notify user
            send_email_notification(
                to_email=user.email,
                subject="SocialFlow AI: Publishing scheduled post",
                body=f"Hello {user.name},\n\nYour post scheduled for {post.scheduled_time} is now being published to your selected platforms.\n\nContent:\n{post.content}"
            )

            # Get social credentials
            accounts = db.query(SocialAccount).filter(SocialAccount.user_id == post.user_id).all()
            account_by_platform = {acc.platform.lower(): acc for acc in accounts}

            # Fetch AI generation single row
            gen = db.query(AIGeneration).filter(AIGeneration.post_id == post.id).first()
            
            # Selected targets list
            target_platforms = post.platforms.split(",") if post.platforms else []
            if not target_platforms:
                post.status = "failed"
                db.commit()
                continue

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
                        _seed_analytics(db, post.id, "instagram")

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
                    _seed_analytics(db, post.id, "linkedin")

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
                    _seed_analytics(db, post.id, "twitter")

            if publish_success:
                post.status = "published"
                print(f"[Scheduler] Post {post.id} successfully published.")
            else:
                post.status = "failed"
                print(f"[Scheduler] Post {post.id} failed to publish to any platform.")

            db.commit()

    except Exception as e:
        print(f"[Scheduler Error] Exception in background publication: {e}")
    finally:
        db.close()

def _seed_analytics(db: Session, post_id: int, platform: str):
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

scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(publish_scheduled_posts, 'interval', seconds=10)
        scheduler.start()
        print("[Scheduler] Started APScheduler background worker (10s intervals).")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] Stopped APScheduler background worker.")
