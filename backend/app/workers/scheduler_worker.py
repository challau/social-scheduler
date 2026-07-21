import datetime
import smtplib
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from ..database.session import SessionLocal
from ..database.models import Post, User
from ..services.publisher import publish_post_campaign
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

def publish_scheduled_posts(db: Session = None):
    """
    Checks database for pending scheduled posts and auto-publishes them
    using the unified post publisher.

    An optional `db` session can be injected (e.g. from tests) so the
    scheduler uses the same in-memory SQLite session rather than opening
    a fresh connection to the production database.
    """
    external_db = db is not None
    if not external_db:
        db = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        pending_posts = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_for <= now
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

            # Notify user via mock email / print
            send_email_notification(
                to_email=user.email,
                subject="SocialFlow AI: Publishing scheduled post",
                body=f"Hello {user.name},\n\nYour post scheduled for {post.scheduled_for} is now being published to your selected platforms."
            )

            # Publish using the unified publisher service
            publish_post_campaign(db, post.id)

    except Exception as e:
        print(f"[Scheduler Error] Exception in background publication: {e}")
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(e)
        except ImportError:
            pass
    finally:
        # Only close the session if we opened it ourselves
        if not external_db:
            db.close()

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
