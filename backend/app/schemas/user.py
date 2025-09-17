from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
import uuid

from app.db.models import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, description="Computed from first_name and last_name")
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)


# UserCreate schema removed - registration is now handled via OTP


class UserUpdate(BaseModel):
    """Schema for user profile updates."""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserInDB(UserBase):
    """Schema for user data as stored in database."""
    id: uuid.UUID
    role: UserRole
    created_at: datetime
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """Public user schema (without sensitive data)."""
    pass


class UserWithStats(User):
    """User schema with statistics."""
    upload_count: int = 0
    download_count: int = 0
    bookmark_count: int = 0


# UserLogin schema removed - login is now handled via OTP


# Password reset schemas removed - OTP authentication doesn't require password reset


class EmailVerification(BaseModel):
    """Schema for email verification."""
    token: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Schema for token refresh."""
    refresh_token: str


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: Optional[uuid.UUID] = None
    email: Optional[str] = None
