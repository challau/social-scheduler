import io

def test_upload_media_success(client):
    # Register/login
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Bob Media", "email": "bob@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload clean image
    file_content = b"fake image byte data"
    res = client.post(
        "/media/upload",
        files={"file": ("test_photo.jpg", io.BytesIO(file_content), "image/jpeg")},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "media_id" in data
    assert "file_url" in data
    assert data["file_type"] == "image"

def test_upload_media_rejection(client):
    # Register/login
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Bob Media", "email": "bob@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload text file
    file_content = b"fake text data"
    res = client.post(
        "/media/upload",
        files={"file": ("test_doc.txt", io.BytesIO(file_content), "text/plain")},
        headers=headers
    )
    assert res.status_code == 400
    assert "Only images and videos are allowed" in res.json()["detail"]
