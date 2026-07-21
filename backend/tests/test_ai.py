import io

def test_ai_generate_response_schema(client):
    # Register/login
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice_ai@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload first to get media_id
    upload_res = client.post(
        "/media/upload",
        files={"file": ("test_photo.jpg", io.BytesIO(b"fake image data"), "image/jpeg")},
        headers=headers
    )
    media_id = upload_res.json()["media_id"]

    gen_payload = {
        "prompt": "hackathon coding photo",
        "media_id": media_id
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
