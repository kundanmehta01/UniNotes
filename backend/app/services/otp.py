import random
import string
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.transactional_email import transactional_email_service
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OTPService:
    """Service for OTP generation, validation, and management."""
    
    def __init__(self, db: Session):
        self.db = db
        self.otp_expiry_minutes = 10  # OTP expires in 10 minutes
        self.max_attempts = 5  # Maximum OTP verification attempts
        self.resend_cooldown_minutes = 1  # Minimum time between OTP requests
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random numeric OTP."""
        return ''.join(random.choices(string.digits, k=length))
    
    async def send_login_otp(self, email: str, ip_address: str = "unknown", registration_data: dict = None) -> Tuple[bool, str]:
        """Send OTP for login to user's email."""
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            # Create new user for OTP-based registration
            user_data = {
                "email": email,
                "otp_attempts": 0
            }
            
            # If registration data is provided, include name fields
            if registration_data:
                if registration_data.get("first_name"):
                    user_data["first_name"] = registration_data["first_name"]
                if registration_data.get("last_name"):
                    user_data["last_name"] = registration_data["last_name"]
            
            user = User(**user_data)
            self.db.add(user)
            self.db.flush()  # To get user ID
            logger.info(f"Created new user for OTP login: {email}")
        
        # Check rate limiting
        if not user.can_request_new_otp(self.resend_cooldown_minutes):
            time_left = int((user.otp_last_sent_at + timedelta(minutes=self.resend_cooldown_minutes) - datetime.utcnow()).total_seconds())
            return False, f"Please wait {time_left} seconds before requesting another OTP"
        
        # Generate new OTP
        otp_code = self.generate_otp()
        otp_expires_at = datetime.utcnow() + timedelta(minutes=self.otp_expiry_minutes)
        
        # Update user with OTP details
        user.otp_code = otp_code
        user.otp_expires_at = otp_expires_at
        user.otp_attempts = 0  # Reset attempts
        user.otp_last_sent_at = datetime.utcnow()
        
        self.db.commit()
        
        # Send OTP email
        try:
            email_sent = await transactional_email_service.send_otp_email(email, otp_code, self.otp_expiry_minutes)
            if email_sent:
                logger.info(f"OTP sent to {email}")
                return True, "OTP sent successfully"
            else:
                logger.error(f"Failed to send OTP to {email}")
                return False, "Failed to send OTP. Please try again."
        except Exception as e:
            logger.error(f"Error sending OTP to {email}: {e}")
            return False, "Failed to send OTP. Please try again."
    
    def verify_otp(self, email: str, otp_code: str) -> Tuple[bool, str, Optional[User]]:
        """Verify OTP and return user if valid."""
        
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return False, "Invalid email or OTP", None
        
        # Check if OTP exists
        if not user.otp_code:
            return False, "No OTP found. Please request a new one.", None
        
        # Check attempts limit
        if user.otp_attempts >= self.max_attempts:
            # Clear OTP to force new request
            user.otp_code = None
            user.otp_expires_at = None
            self.db.commit()
            return False, "Too many invalid attempts. Please request a new OTP.", None
        
        # Check if OTP is expired
        if not user.is_otp_valid():
            # Clear expired OTP
            user.otp_code = None
            user.otp_expires_at = None
            self.db.commit()
            return False, "OTP has expired. Please request a new one.", None
        
        # Check if OTP matches
        if user.otp_code != otp_code:
            user.otp_attempts += 1
            self.db.commit()
            remaining_attempts = self.max_attempts - user.otp_attempts
            if remaining_attempts > 0:
                return False, f"Invalid OTP. {remaining_attempts} attempts remaining.", None
            else:
                # Clear OTP after max attempts
                user.otp_code = None
                user.otp_expires_at = None
                return False, "Too many invalid attempts. Please request a new OTP.", None
        
        # OTP is valid - clear it and update last login
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_attempts = 0
        user.last_login_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"OTP verified successfully for {email}")
        return True, "OTP verified successfully", user
    
    def clear_expired_otps(self):
        """Clear expired OTPs from database (cleanup task)."""
        expired_count = self.db.query(User).filter(
            User.otp_expires_at < datetime.utcnow()
        ).update({
            'otp_code': None,
            'otp_expires_at': None,
            'otp_attempts': 0
        }, synchronize_session=False)
        
        self.db.commit()
        
        if expired_count > 0:
            logger.info(f"Cleared {expired_count} expired OTPs")
        
        return expired_count


def get_otp_service(db: Session) -> OTPService:
    """Get OTP service instance."""
    return OTPService(db)
