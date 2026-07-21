def test_signup(client):
    response = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice Tester"

def test_signup_duplicate_email(client):
    # Register first user
    client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    # Attempt second registration with same email
    response = client.post(
        "/auth/signup",
        json={"name": "Bob Tester", "email": "alice@example.com", "password": "anotherpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register
    client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_login_invalid_password(client):
    # Register
    client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    # Try incorrect password
    response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_profile(client):
    # Register and get token
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Alice Tester", "email": "alice@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    
    # Get profile with bearer token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["name"] == "Alice Tester"
