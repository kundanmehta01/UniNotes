import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Index
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, UUID


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)  # "paper_approved", "user_login", etc.
    target_type = Column(String(50))  # "paper", "user", etc.
    target_id = Column(UUID())
    details = Column(JSON)  # Additional context data
    
    # Request context
    ip_address = Column(String(45))  # IPv6 support
    user_agent = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    actor = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_logs_actor_created", "actor_user_id", "created_at"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_target", "target_type", "target_id"),
    )
