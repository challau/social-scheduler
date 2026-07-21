import datetime
from app.utils.crypto import encrypt_token, decrypt_token
from app.services.oauth_service import refresh_social_token
from app.database.models import SocialAccount, User

def test_token_encryption_decryption():
    token = "my_super_secret_token_12345"
    enc = encrypt_token(token)
    assert enc != token
    dec = decrypt_token(enc)
    assert dec == token

def test_oauth_listing_and_disconnect(client):
    # Register/login
    signup_res = client.post(
        "/auth/signup",
        json={"name": "Oauth Tester", "email": "oauth@example.com", "password": "securepassword123"}
    )
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate OAuth login connection
    login_res = client.get("/oauth/instagram/login?token=" + token, follow_redirects=False)
    assert login_res.status_code == 307 # Redirects back to settings
    
    # List connected accounts
    list_res = client.get("/oauth/accounts", headers=headers)
    assert list_res.status_code == 200
    accs = list_res.json()
    assert len(accs) == 1
    assert accs[0]["platform"] == "instagram"
    assert accs[0]["username"] == "socialflow_business"
    db_id = accs[0]["id"]

    # Disconnect account by ID
    del_res = client.delete(f"/oauth/accounts/{db_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Verify disconnect
    list_res2 = client.get("/oauth/accounts", headers=headers)
    assert len(list_res2.json()) == 0

def test_token_expiry_trigger_refresh(db):
    # Set up user and social account
    user = User(name="Refresh Guy", email="refresh@example.com", password_hash="hash")
    db.add(user)
    db.commit()

    # Expired token setup
    expired_time = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    account = SocialAccount(
        user_id=user.id,
        platform="twitter",
        access_token=encrypt_token("old_expired_access"),
        refresh_token=encrypt_token("valid_refresh_token"),
        token_expires_at=expired_time,
        username="refresher"
    )
    db.add(account)
    db.commit()

    # Trigger refresh logic
    active_token = refresh_social_token(db, account)
    assert active_token.startswith("mock_twitter_refreshed_")
    
    # Check that database now has updated expiry time
    db.refresh(account)
    assert account.token_expires_at > datetime.datetime.utcnow()
