from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import argon2
import secrets
import hashlib

from app.config import get_settings

settings = get_settings()

# Password hashing context using Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT settings
ALGORITHM = settings.JWT_ALGORITHM


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_TTL)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_REFRESH_TTL)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            return None
            
        return payload
    except JWTError:
        return None


def create_email_verification_token(email: str) -> str:
    """Create a token for email verification."""
    data = {"email": email, "purpose": "email_verification"}
    return create_token_with_expiry(data, hours=24)  # 24 hour expiry


def create_password_reset_token(email: str) -> str:
    """Create a token for password reset."""
    data = {"email": email, "purpose": "password_reset"}
    return create_token_with_expiry(data, hours=1)  # 1 hour expiry


def create_token_with_expiry(data: Dict[str, Any], hours: int = 1) -> str:
    """Create a general purpose token with custom expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=hours)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def verify_email_verification_token(token: str) -> Optional[str]:
    """Verify email verification token and return email."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        
        if payload.get("purpose") != "email_verification":
            return None
            
        return payload.get("email")
    except JWTError:
        return None


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        
        if payload.get("purpose") != "password_reset":
            return None
            
        return payload.get("email")
    except JWTError:
        return None


def generate_secure_random_string(length: int = 32) -> str:
    """Generate a secure random string for various purposes."""
    return secrets.token_urlsafe(length)


def hash_ip_address(ip_address: str) -> str:
    """Hash IP address for privacy-preserving logging."""
    # Add salt to prevent rainbow table attacks
    salt = settings.JWT_SECRET[:16]  # Use part of JWT secret as salt
    return hashlib.sha256((ip_address + salt).encode()).hexdigest()


def generate_api_key() -> str:
    """Generate a secure API key."""
    return f"unh_{secrets.token_urlsafe(32)}"


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password strength and return validation result with error messages."""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        errors.append("Password must be no more than 128 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
    
    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        errors.append("Password must contain at least one special character")
    
    # Check for common weak passwords
    weak_passwords = [
        "password", "123456", "password123", "admin", "qwerty", 
        "letmein", "welcome", "monkey", "dragon"
    ]
    if password.lower() in weak_passwords:
        errors.append("Password is too common and easily guessable")
    
    return len(errors) == 0, errors


def create_token_pair(user_id: str, email: str) -> Dict[str, Any]:
    """Create access and refresh token pair."""
    token_data = {
        "sub": user_id,
        "email": email,
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TTL,
    }
