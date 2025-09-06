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
    UserCreate,
    UserUpdate,
    UserLogin,
    Token,
    User,
    EmailVerification,
    UserPasswordReset,
    UserPasswordResetConfirm,
    TokenRefresh,
)
from app.services.auth import get_auth_service
from app.services.security import verify_token, create_token_pair
from app.utils.errors import AuthenticationError

router = APIRouter()




@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
):
    """Register a new user account."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Register user
    user, verification_token = await auth_service.register_user(
        user_data=user_data,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "User registered successfully. Please check your email to verify your account.",
        "user_id": str(user.id),
        "email": user.email,
    }


@router.post("/login", response_model=dict)
async def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    """Authenticate user and return access tokens with user data."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Authenticate user
    login_response = await auth_service.login_user(
        email=login_data.email,
        password=login_data.password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return login_response


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
    from app.db.models import User
    user = db.query(User).filter(
        User.id == user_id,
        User.is_email_verified == True
    ).first()
    
    if not user:
        raise AuthenticationError(detail="User not found or inactive")
    
    # Create new token pair
    new_tokens = create_token_pair(user_id, email)
    
    return Token(**new_tokens)


@router.get("/verify-email")
async def verify_email_get(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify user email address via GET request (from email link)."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Verify email
    user = await auth_service.verify_email(
        token=token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "Email verified successfully! You can now log in to your account.",
        "user_id": str(user.id),
        "email": user.email,
        "status": "verified"
    }


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify user email address via POST request (API)."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Verify email
    user = await auth_service.verify_email(
        token=verification_data.token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "Email verified successfully. You can now log in.",
        "user_id": str(user.id),
        "email": user.email,
    }


@router.post("/resend-verification")
async def resend_verification_email(
    email_data: UserPasswordReset,  # Reuse schema since it has email field
    request: Request,
    db: Session = Depends(get_db),
):
    """Resend email verification."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Resend verification email
    success = await auth_service.resend_verification_email(
        email=email_data.email,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "If an account with this email exists and is unverified, a verification email has been sent.",
        "success": success,
    }


@router.post("/request-password-reset")
async def request_password_reset(
    reset_data: UserPasswordReset,
    request: Request,
    db: Session = Depends(get_db),
):
    """Request password reset email."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Request password reset
    success = await auth_service.request_password_reset(
        email=reset_data.email,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "If an account with this email exists, a password reset email has been sent.",
        "success": success,
    }


@router.post("/reset-password")
async def reset_password(
    reset_data: UserPasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db),
):
    """Reset password using reset token."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Reset password
    user = await auth_service.reset_password(
        token=reset_data.token,
        new_password=reset_data.new_password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "Password reset successfully. You can now log in with your new password.",
        "user_id": str(user.id),
        "email": user.email,
    }


@router.post("/change-password")
async def change_password(
    password_data: dict,  # {"current_password": str, "new_password": str}
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Change user password (requires authentication)."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get auth service
    auth_service = get_auth_service(db)
    
    # Change password
    success = await auth_service.change_password(
        user=current_user,
        current_password=password_data.get("current_password"),
        new_password=password_data.get("new_password"),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {
        "message": "Password changed successfully.",
        "success": success,
    }


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
    from app.db.models import Paper, Download, Bookmark
    
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
