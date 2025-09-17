import uuid
import enum
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, UUID


class NotificationType(str, enum.Enum):
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"
    ERROR = "error"
    REPORT_UPDATE = "report_update"
    PAPER_STATUS = "paper_status"
    NOTE_STATUS = "note_status"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.INFO, nullable=False)
    
    # Related entities
    related_paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=True)
    related_report_id = Column(UUID(), ForeignKey("reports.id", ondelete="CASCADE"), nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    related_paper = relationship("Paper", foreign_keys=[related_paper_id])
    related_report = relationship("Report", foreign_keys=[related_report_id])
    
    __table_args__ = (
        Index("idx_notifications_user_created", "user_id", "created_at"),
        Index("idx_notifications_unread", "user_id", "is_read"),
        Index("idx_notifications_type", "notification_type"),
    )
