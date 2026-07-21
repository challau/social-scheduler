def test_create_and_get_posts(client):
    # Register and login to get JWT
    signup_res = client.post(
        "/api/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    post_payload = {
        "content": "Exciting hackathon work today!",
        "media_url": "http://example.com/photo.jpg",
        "media_type": "image",
        "status": "draft",
        "ai_generations": [
            {
                "platform": "instagram",
                "caption": "Hackathon time! 🚀",
                "hashtags": '["coding", "ai"]',
                "summary": "Building features at hackathon."
            }
        ]
    }
    create_res = client.post("/api/posts", json=post_payload, headers=headers)
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "success"
    post_id = create_res.json()["post_id"]

    # List posts
    list_res = client.get("/api/posts", headers=headers)
    assert list_res.status_code == 200
    posts = list_res.json()
    assert len(posts) == 1
    assert posts[0]["id"] == post_id
    assert posts[0]["content"] == "Exciting hackathon work today!"
    assert posts[0]["ai_generations"][0]["platform"] == "instagram"

    # Get single post details
    details_res = client.get(f"/api/posts/{post_id}", headers=headers)
    assert details_res.status_code == 200
    details = details_res.json()
    assert details["content"] == "Exciting hackathon work today!"

def test_delete_post(client):
    # Setup auth
    signup_res = client.post(
        "/api/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create post
    create_res = client.post(
        "/api/posts",
        json={"content": "Post to delete", "status": "draft"},
        headers=headers
    )
    post_id = create_res.json()["post_id"]

    # Delete post
    del_res = client.delete(f"/api/posts/{post_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Confirm deleted
    get_res = client.get(f"/api/posts/{post_id}", headers=headers)
    assert get_res.status_code == 404

def test_ai_generate_endpoint(client):
    signup_res = client.post(
        "/api/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    gen_payload = {
        "prompt": "hackathon coding photo",
        "media_url": "http://example.com/photo.jpg"
    }
    res = client.post("/api/posts/generate-ai", json=gen_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    
    # Assert generated structure matches requested schema
    assert "instagram" in data
    assert "linkedin" in data
    assert "twitter" in data
    assert "title" in data
    assert "recommended_platform" in data
    assert "best_posting_time" in data
    assert "Hackathon" in data["instagram"]["caption"] or "innovation" in data["instagram"]["caption"].lower()

def test_publish_without_accounts_fails(client):
    signup_res = client.post(
        "/api/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/posts",
        json={"content": "Direct post", "status": "draft"},
        headers=headers
    )
    post_id = create_res.json()["post_id"]

    # Publishing without social connections should raise 400
    res = client.post(f"/api/posts/{post_id}/publish", headers=headers)
    assert res.status_code == 400
    assert "No social accounts connected" in res.json()["detail"]
