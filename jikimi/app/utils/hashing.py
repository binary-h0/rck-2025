"""Hashing utilities for tokens and sensitive data."""

import hashlib
import secrets


def hash_token(token: str) -> str:
    """Hash a token using SHA-256.
    
    Args:
        token: Token string to hash
        
    Returns:
        Hex-encoded hash string
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_token(length: int = 32) -> str:
    """Generate a secure random token.
    
    Args:
        length: Length of token in bytes
        
    Returns:
        URL-safe base64-encoded token
    """
    return secrets.token_urlsafe(length)

