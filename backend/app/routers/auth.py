from fastapi import APIRouter, Depends, status, Request, BackgroundTasks, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
import uuid as uuid_lib

from app.db.session import get_db
from app.deps import (
    get_current_user,
    get_current_active_user,
    get_request_ip,
    get_request_metadata,
)
from app.schemas.user import (
    UserUpdate,
    Token,
    User,
    TokenRefresh,
)
from app.services.auth import get_auth_service
from app.services.otp import get_otp_service
from app.services.security import verify_token, create_token_pair, create_token_pair
from app.utils.errors import AuthenticationError

router = APIRouter()




# Registration is now handled automatically via OTP login


# Traditional login endpoint removed - use OTP authentication instead
# Legacy endpoint kept for backward compatibility
@router.post("/login", response_model=dict)
async def login_deprecated(
    login_data: dict,  # {"email": str, "password": str}
    request: Request,
    db: Session = Depends(get_db),
):
    """DEPRECATED: Password login replaced with OTP authentication."""
    return {
        "message": "Password-based login has been replaced with OTP authentication. Please use /auth/send-otp to receive a login code.",
        "status": "deprecated",
        "redirect": "/auth/send-otp",
        "email": login_data.get("email")
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: TokenRefresh,
    request: Request,
    db: Session = Depends(get_db),
):
    """Refresh access token using refresh token."""
    
    # Verify refresh token
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    if not payload:
        raise AuthenticationError(detail="Invalid or expired refresh token")
    
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id or not email:
        raise AuthenticationError(detail="Invalid token payload")
    
    # Verify user still exists and is active
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(
        UserModel.id == user_id
    ).first()
    
    if not user:
        raise AuthenticationError(detail="User not found or inactive")
    
    # Create new token pair
    new_tokens = create_token_pair(user_id, email)
    
    return Token(**new_tokens)


# Email verification has been completely removed in favor of OTP authentication
# All authentication now flows through the OTP system


# Password reset and change password functionality removed
# With OTP authentication, users can simply request a new OTP to regain access


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user information."""
    return current_user


@router.put("/me", response_model=User)
async def update_profile(
    profile_data: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Update profile
    updated_user = await auth_service.update_profile(
        user=current_user,
        profile_data=profile_data,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return updated_user


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Logout user (client-side token removal)."""
    
    # Note: With JWT tokens, logout is primarily handled client-side
    # by removing the tokens from storage. We just log the event here.
    
    # Log logout event
    from app.services.auth import get_auth_service
    from app.db.session import get_db
    
    # This is a bit hacky since we need a db session, but for logging only
    # In a real implementation, you might want to maintain a token blacklist
    
    return {
        "message": "Logged out successfully. Please remove tokens from client storage.",
        "user_id": str(current_user.id),
    }


@router.post("/upload-avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload user avatar image."""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if avatar.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    file_content = await avatar.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5MB limit"
        )
    
    # Create uploads directory if it doesn't exist
    uploads_dir = "uploads/avatars"
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
    unique_filename = f"{current_user.id}_{uuid_lib.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(uploads_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Create avatar URL (relative to server)
    avatar_url = f"/uploads/avatars/{unique_filename}"
    
    # Update user's avatar_url in database
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url,
        "user_id": str(current_user.id),
    }


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user dashboard statistics."""
    from sqlalchemy import func
    from app.models import Paper, Download, Bookmark
    
    # Get user's download count
    downloads_count = db.query(Download).filter(
        Download.user_id == current_user.id
    ).count()
    
    # Get user's upload count (approved papers only)
    uploads_count = db.query(Paper).filter(
        Paper.uploader_id == current_user.id,
        Paper.status.in_(['APPROVED', 'PENDING'])  # Include pending papers as "My Uploads"
    ).count()
    
    # Get user's bookmark count
    bookmarks_count = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id
    ).count()
    
    return {
        "downloads": downloads_count,
        "uploads": uploads_count,
        "bookmarks": bookmarks_count,
    }


# Check if user exists with given email
@router.post("/check-user")
async def check_user_exists(
    email_data: dict,  # {"email": str}
    db: Session = Depends(get_db),
):
    """Check if user exists with the provided email."""
    
    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )
    
    # Find user
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    return {
        "exists": user is not None,
        "email": email,
    }


# OTP-based authentication endpoints

@router.post("/send-otp")
async def send_otp(
    email_data: dict,  # {"email": str, "first_name": str, "last_name": str, "is_registration": bool}
    request: Request,
    db: Session = Depends(get_db),
):
    """Send OTP to email for login/registration."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    
    # Get OTP service
    otp_service = get_otp_service(db)
    
    # Prepare registration data if provided
    registration_data = None
    if email_data.get("is_registration") or email_data.get("first_name") or email_data.get("last_name"):
        registration_data = {
            "first_name": email_data.get("first_name"),
            "last_name": email_data.get("last_name")
        }
    
    # Send OTP
    success, message = await otp_service.send_login_otp(
        email=email_data.get("email"),
        ip_address=ip_address,
        registration_data=registration_data
    )
    
    if success:
        return {
            "message": message,
            "email": email_data.get("email"),
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=message
        )


@router.post("/verify-otp")
async def verify_otp(
    otp_data: dict,  # {"email": str, "otp": str}
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify OTP and login user."""
    
    email = otp_data.get("email")
    otp_code = otp_data.get("otp")
    
    if not email or not otp_code:
        raise HTTPException(
            status_code=400,
            detail="Email and OTP are required"
        )
    
    # Get OTP service
    otp_service = get_otp_service(db)
    
    # Verify OTP
    success, message, user = otp_service.verify_otp(email, otp_code)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail=message
        )
    
    # Check if this is a new user (first login)
    is_new_user = user.last_login_at is None or (
        user.last_login_at and 
        (datetime.utcnow() - user.last_login_at).total_seconds() < 60
    )
    
    # Create token pair
    tokens = create_token_pair(str(user.id), user.email)
    
    # Prepare user data for response
    from app.schemas.user import User as UserSchema
    user_data = UserSchema.from_orm(user)
    
    return {
        **tokens,
        "user": user_data.dict(),
        "is_new_user": is_new_user,
        "message": "Login successful"
    }
