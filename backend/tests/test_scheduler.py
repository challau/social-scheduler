import datetime
from app.database.models import Post, SocialAccount, User, AIGeneration, PostResult, Analytics
from app.workers.scheduler_worker import publish_scheduled_posts
from app.utils.crypto import encrypt_token

def test_scheduler_picks_up_and_publishes(db):
    # 1. Setup user and connection
    user = User(name="Scheduler User", email="sched@example.com", password_hash="hash")
    db.add(user)
    db.commit()

    conn = SocialAccount(
        user_id=user.id,
        platform="linkedin",
        access_token=encrypt_token("some_token"),
        token_expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=1),
        username="sched_linkedin"
    )
    db.add(conn)
    db.commit()

    # 2. Setup scheduled post with past scheduled_for time
    past_time = datetime.datetime.utcnow() - datetime.timedelta(minutes=2)
    post = Post(
        user_id=user.id,
        platforms=["linkedin"], # JSON list
        status="scheduled",
        scheduled_for=past_time
    )
    db.add(post)
    db.commit()

    ai_gen = AIGeneration(
        post_id=post.id,
        summary="Draft copy",
        linkedin_caption="LinkedIn content",
        hashtags="[]"
    )
    db.add(ai_gen)
    db.commit()

    # 3. Trigger scheduler task manually
    publish_scheduled_posts()

    # 4. Assertions
    db.refresh(post)
    assert post.status == "posted"

    # Verify PostResult
    results = db.query(PostResult).filter(PostResult.post_id == post.id).all()
    assert len(results) == 1
    assert results[0].platform == "linkedin"
    assert results[0].status == "success"

    # Verify Analytics
    analytics = db.query(Analytics).filter(Analytics.post_result_id == results[0].id).all()
    assert len(analytics) == 1
    assert analytics[0].platform == "linkedin"
    assert analytics[0].reach > 0
