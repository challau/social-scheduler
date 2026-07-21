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
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
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
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
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
