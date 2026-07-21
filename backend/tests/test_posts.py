import io
import datetime
from app.database.models import SocialAccount, Post

def test_create_and_get_posts(client):
    # Register and login to get JWT
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post campaign
    post_payload = {
        "content": "Exciting hackathon work today!",
        "media_url": "http://example.com/photo.jpg",
        "platforms": ["instagram", "linkedin"],
        "status": "draft",
        "ai_generation": {
            "summary": "Building features at hackathon.",
            "instagram_caption": "Hackathon time! 🚀",
            "linkedin_caption": "Pro coding work.",
            "twitter_caption": "FastAPI hacking.",
            "hashtags": ["coding", "ai"]
        }
    }
    create_res = client.post("/posts/create", json=post_payload, headers=headers)
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "success"
    post_id = create_res.json()["post_id"]

    # List posts
    list_res = client.get("/posts", headers=headers)
    assert list_res.status_code == 200
    posts = list_res.json()
    assert len(posts) == 1
    assert posts[0]["id"] == post_id
    assert posts[0]["content"] == "Exciting hackathon work today!"
    assert "instagram" in posts[0]["platforms"]
    assert posts[0]["ai_generation"]["instagram_caption"] == "Hackathon time! 🚀"

def test_ai_generate_endpoint(client):
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice_test_ai@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    gen_payload = {
        "prompt": "hackathon coding photo",
        "media_url": "http://example.com/photo.jpg"
    }
    res = client.post("/ai/generate", json=gen_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    
    # Assert generated structure matches requested schema exactly
    assert "summary" in data
    assert "instagram_caption" in data
    assert "linkedin_caption" in data
    assert "twitter_caption" in data
    assert "hashtags" in data
    assert isinstance(data["hashtags"], list)

def test_publish_without_accounts_fails(client):
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice_no_acc@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/posts/create",
        json={
            "content": "Direct post",
            "platforms": ["instagram"],
            "status": "draft"
        },
        headers=headers
    )
    post_id = create_res.json()["post_id"]

    # Publishing without social connections should raise 400
    res = client.post(
        "/posts/publish",
        json={"post_id": post_id},
        headers=headers
    )
    assert res.status_code == 400
    assert "is not connected" in res.json()["detail"]

def test_publish_partial_failure(client, db):
    # Register/login
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Partial Tester", "email": "partial@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Connect instagram & linkedin via login simulator
    client.get("/oauth/instagram/login?token=" + token, follow_redirects=False)
    client.get("/oauth/linkedin/login?token=" + token, follow_redirects=False)

    # Fetch the LinkedIn social account and make it raise refresh failure
    linkedin_acc = db.query(SocialAccount).filter(SocialAccount.platform == "linkedin").first()
    assert linkedin_acc is not None
    linkedin_acc.refresh_token = None
    linkedin_acc.token_expires_at = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    db.commit()

    # Create post campaign targeting BOTH instagram and linkedin
    create_res = client.post(
        "/posts/create",
        json={
            "content": "Campaign content",
            "platforms": ["instagram", "linkedin"],
            "status": "draft"
        },
        headers=headers
    )
    post_id = create_res.json()["post_id"]

    # Publish campaign. This will run successfully for Instagram and fail for LinkedIn.
    res = client.post(
        "/posts/publish",
        json={"post_id": post_id},
        headers=headers
    )
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 2
    
    # Assert one success, one failed
    insta_res = next(r for r in results if r["platform"] == "instagram")
    link_res = next(r for r in results if r["platform"] == "linkedin")
    
    assert insta_res["status"] == "success"
    assert link_res["status"] == "failed"
    assert link_res["error"] == "reconnect account"

    # Verify that post status in the DB is set to partial_failed
    post_db = db.query(Post).filter(Post.id == post_id).first()
    assert post_db.status == "partial_failed"

def test_publish_with_unconnected_platform_partial(client):
    # Only twitter connected, but campaign targets twitter + linkedin.
    # Publish must proceed: twitter succeeds, linkedin records "Account not connected".
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Partial Conn", "email": "partial_conn@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.get("/oauth/twitter/login?token=" + token, follow_redirects=False)

    create_res = client.post(
        "/posts/create",
        json={"content": "Cross post", "platforms": ["twitter", "linkedin"], "status": "draft"},
        headers=headers
    )
    post_id = create_res.json()["post_id"]

    res = client.post("/posts/publish", json={"post_id": post_id}, headers=headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 2

    tw = next(r for r in results if r["platform"] == "twitter")
    li = next(r for r in results if r["platform"] == "linkedin")
    assert tw["status"] == "success"
    assert li["status"] == "failed"
    assert li["error"] == "Account not connected"
