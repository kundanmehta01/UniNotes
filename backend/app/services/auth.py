import logging
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models import User, UserRole, AuditLog
from app.schemas.user import UserUpdate, Token
from app.services.security import (
    hash_password, 
    verify_password, 
    create_token_pair,
    create_email_verification_token,
    create_password_reset_token,
    verify_email_verification_token,
    verify_password_reset_token,
    validate_password_strength,
    hash_ip_address,
)
from app.services.email import email_service
from app.utils.errors import (
    UserAlreadyExistsError,
    UserNotFoundError,
    AuthenticationError,
    EmailNotVerifiedError,
    ValidationError,
)
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # DEPRECATED: User registration is now handled via OTP authentication
    # This method is kept for backward compatibility but should not be used
    async def register_user_deprecated(
        self, 
        email: str,
        first_name: str = None,
        last_name: str = None,
        bio: str = None,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> User:
        """DEPRECATED: User registration is now handled via OTP authentication."""
        
        # Create user without password (OTP-based auth)
        try:
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                bio=bio,
                role=UserRole.ADMIN if email == settings.ADMIN_EMAIL else UserRole.STUDENT,
            )
            
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            
            # Log registration
            await self._log_auth_event(
                user_id=new_user.id,
                action="user_registered_otp",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": new_user.email, "role": new_user.role.value}
            )
            
            return new_user
            
        except IntegrityError:
            self.db.rollback()
            raise UserAlreadyExistsError(
                detail="User with this email already exists",
                details={"email": email}
            )
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to register user {email}: {e}")
            raise
    
    # DEPRECATED: Password-based login replaced with OTP authentication
    async def login_user_deprecated(
        self,
        email: str,
        password: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> dict:
        """DEPRECATED: Password-based login replaced with OTP authentication."""
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            await self._log_auth_event(
                action="login_failed",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": email, "reason": "user_not_found"}
            )
            raise AuthenticationError(detail="Invalid email or password")
        
        # NOTE: This method is deprecated and should not be used
        # Always return error message indicating OTP authentication should be used
        raise AuthenticationError(
            detail="Password-based login has been replaced with OTP authentication. Please use /auth/send-otp to receive a login code."
        )
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        self.db.commit()
        
        # Create token pair
        tokens = create_token_pair(str(user.id), user.email)
        
        # Prepare user data for response
        from app.schemas.user import User as UserSchema
        user_data = UserSchema.from_orm(user)
        
        # Log successful login
        await self._log_auth_event(
            user_id=user.id,
            action="login_successful",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": user.email}
        )
        
        logger.info(f"User {user.email} logged in successfully")
        
        # Return tokens with user data
        return {
            **tokens,
            "user": user_data.dict()
        }
    
    async def verify_email(
        self,
        token: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> User:
        """Verify user email with token."""
        
        # Verify token
        email = verify_email_verification_token(token)
        if not email:
            raise AuthenticationError(detail="Invalid or expired verification token")
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise UserNotFoundError(detail="User not found")
        
        # Check if already verified
        if user.is_email_verified:
            return user
        
        # Verify email
        user.is_email_verified = True
        self.db.commit()
        
        # Log email verification
        await self._log_auth_event(
            user_id=user.id,
            action="email_verified",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": user.email}
        )
        
        # Send welcome email
        try:
            await email_service.send_welcome_email(
                user.email,
                user.first_name or ""
            )
            logger.info(f"Welcome email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {e}")
        
        logger.info(f"Email verified for user {user.email}")
        return user
    
    async def request_password_reset(
        self,
        email: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> bool:
        """Send password reset email."""
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        
        # Always return True to prevent email enumeration
        # But only send email if user exists
        if user:
            # Create reset token
            reset_token = create_password_reset_token(email)
            
            # Send reset email
            try:
                await email_service.send_password_reset_email(email, reset_token)
                logger.info(f"Password reset email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send password reset email to {email}: {e}")
            
            # Log password reset request
            await self._log_auth_event(
                user_id=user.id,
                action="password_reset_requested",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": email}
            )
        else:
            # Log attempt for non-existent user
            await self._log_auth_event(
                action="password_reset_requested",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": email, "reason": "user_not_found"}
            )
        
        return True
    
    async def reset_password(
        self,
        token: str,
        new_password: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> User:
        """Reset user password with token."""
        
        # Validate new password
        is_valid, errors = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(
                detail="Password does not meet security requirements",
                details={"password_errors": errors}
            )
        
        # Verify token
        email = verify_password_reset_token(token)
        if not email:
            raise AuthenticationError(detail="Invalid or expired reset token")
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise UserNotFoundError(detail="User not found")
        
        # Hash new password
        user.password_hash = hash_password(new_password)
        self.db.commit()
        
        # Log password reset
        await self._log_auth_event(
            user_id=user.id,
            action="password_reset",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": user.email}
        )
        
        logger.info(f"Password reset completed for user {user.email}")
        return user
    
    async def resend_verification_email(
        self,
        email: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> bool:
        """Resend verification email."""
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if user exists
            return True
        
        # Check if already verified
        if user.is_email_verified:
            return True
        
        # Create new verification token
        verification_token = create_email_verification_token(email)
        
        # Send verification email
        try:
            await email_service.send_verification_email(email, verification_token)
            logger.info(f"Verification email resent to {email}")
        except Exception as e:
            logger.error(f"Failed to resend verification email to {email}: {e}")
            return False
        
        # Log resend
        await self._log_auth_event(
            user_id=user.id,
            action="verification_email_resent",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": email}
        )
        
        return True
    
    async def update_profile(
        self,
        user: User,
        profile_data: UserUpdate,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> User:
        """Update user profile information."""
        
        # Track what fields are being updated
        updated_fields = []
        
        # Update profile fields
        if profile_data.first_name is not None:
            user.first_name = profile_data.first_name
            updated_fields.append("first_name")
        
        if profile_data.last_name is not None:
            user.last_name = profile_data.last_name
            updated_fields.append("last_name")
        
        if profile_data.bio is not None:
            user.bio = profile_data.bio
            updated_fields.append("bio")
        
        if profile_data.avatar_url is not None:
            user.avatar_url = profile_data.avatar_url
            updated_fields.append("avatar_url")
        
        # Only commit if there were changes
        if updated_fields:
            self.db.commit()
            self.db.refresh(user)
            
            # Log profile update
            await self._log_auth_event(
                user_id=user.id,
                action="profile_updated",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "email": user.email,
                    "updated_fields": updated_fields
                }
            )
            
            logger.info(f"Profile updated for user {user.email}, fields: {updated_fields}")
        
        return user
    
    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> bool:
        """Change user password (requires current password)."""
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            await self._log_auth_event(
                user_id=user.id,
                action="password_change_failed",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": user.email, "reason": "invalid_current_password"}
            )
            raise AuthenticationError(detail="Current password is incorrect")
        
        # Validate new password
        is_valid, errors = validate_password_strength(new_password)
        if not is_valid:
            raise ValidationError(
                detail="Password does not meet security requirements",
                details={"password_errors": errors}
            )
        
        # Check if new password is same as current
        if verify_password(new_password, user.password_hash):
            raise ValidationError(detail="New password must be different from current password")
        
        # Update password
        user.password_hash = hash_password(new_password)
        self.db.commit()
        
        # Log password change
        await self._log_auth_event(
            user_id=user.id,
            action="password_changed",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": user.email}
        )
        
        logger.info(f"Password changed for user {user.email}")
        return True
    
    async def _log_auth_event(
        self,
        action: str,
        ip_address: str = "unknown",
        user_agent: str = "",
        user_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        """Log authentication event for audit purposes."""
        
        try:
            log_entry = AuditLog(
                actor_user_id=user_id,
                action=action,
                target_type="user",
                target_id=user_id,
                metadata=metadata or {},
                ip_address=hash_ip_address(ip_address),
                user_agent=user_agent[:500] if user_agent else "",  # Truncate if too long
            )
            
            self.db.add(log_entry)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log auth event: {e}")
            # Don't fail the main operation if logging fails
            self.db.rollback()


def get_auth_service(db: Session) -> AuthService:
    """Get authentication service instance."""
    return AuthService(db)
