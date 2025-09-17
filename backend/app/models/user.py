import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, UUID, SoftDeleteMixin


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"


class User(Base, SoftDeleteMixin):
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # No password hash - OTP-only authentication
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)  # Controls login access
    
    # OTP fields for email-based login
    otp_code = Column(String(10), nullable=True)  # 6-digit OTP
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)  # Track failed attempts
    otp_last_sent_at = Column(DateTime(timezone=True), nullable=True)  # Rate limiting
    
    # Profile information
    first_name = Column(String(100))
    last_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))  # URL to profile picture
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def full_name(self) -> Optional[str]:
        """Return the user's full name by combining first and last names."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        elif self.first_name:
            return self.first_name.strip()
        elif self.last_name:
            return self.last_name.strip()
        return None

    def is_otp_valid(self) -> bool:
        """Check if current OTP is still valid (not expired)."""
        if not self.otp_code or not self.otp_expires_at:
            return False
        return datetime.utcnow() < self.otp_expires_at

    def can_request_new_otp(self, cooldown_minutes: int = 1) -> bool:
        """Check if user can request a new OTP (rate limiting)."""
        if not self.otp_last_sent_at:
            return True
        
        from datetime import timedelta
        cooldown_period = timedelta(minutes=cooldown_minutes)
        return datetime.utcnow() - self.otp_last_sent_at > cooldown_period

    # Relationships
    papers = relationship("Paper", back_populates="uploader")
    notes = relationship("Note", back_populates="uploader")
    downloads = relationship("Download", back_populates="user")
    note_downloads = relationship("NoteDownload", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    note_bookmarks = relationship("NoteBookmark", back_populates="user")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    note_reports = relationship("NoteReport", back_populates="reporter", foreign_keys="NoteReport.reporter_id")
    ratings = relationship("Rating", back_populates="user")
    note_ratings = relationship("NoteRating", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")
    activities = relationship("UserActivity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
