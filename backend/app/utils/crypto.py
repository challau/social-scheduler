import base64
import hashlib
from cryptography.fernet import Fernet
from ..config import settings

def get_fernet_key() -> bytes:
    """Derives a base64-encoded 32-byte key from the configuration SECRET_KEY"""
    raw_secret = settings.SECRET_KEY or "default_fallback_social_flow_secret_key"
    key_hash = hashlib.sha256(raw_secret.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)

def encrypt_token(token: str) -> str:
    """Encrypts a token string for rest storage"""
    if not token:
        return ""
    try:
        f = Fernet(get_fernet_key())
        return f.encrypt(token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        raise ValueError(f"Token encryption failed: {e}")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts an encrypted token string"""
    if not encrypted_token:
        return ""
    try:
        f = Fernet(get_fernet_key())
        return f.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        raise ValueError(f"Token decryption failed: {e}")
