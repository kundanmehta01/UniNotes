import uuid
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, UUID


class ActivityTypeEnum(str, enum.Enum):
    UPLOAD = "upload"
    BOOKMARK = "bookmark"
    VIEW = "view"
    DOWNLOAD = "download"
    RATING = "rating"
    SEARCH = "search"


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    activity_type = Column(Enum(ActivityTypeEnum), nullable=False)
    
    # Related paper (if activity is related to a specific paper)
    paper_id = Column(UUID(), ForeignKey("papers.id"), nullable=True)
    
    # Related note (if activity is related to a specific note)
    note_id = Column(UUID(), ForeignKey("notes.id"), nullable=True)
    
    # Additional activity data (stored as JSON-like text)
    activity_metadata = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    paper = relationship("Paper", back_populates="activities", lazy="joined")
    note = relationship("Note", back_populates="activities", lazy="joined")
    
    __table_args__ = (
        Index("idx_user_activities_user_created", "user_id", "created_at"),
        Index("idx_user_activities_type", "activity_type"),
        Index("idx_user_activities_paper", "paper_id"),
        Index("idx_user_activities_note", "note_id"),
    )

    def __repr__(self):
        return f"<UserActivity(user_id={self.user_id}, type={self.activity_type}, paper_id={self.paper_id})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        result = {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.activity_type.value,
            "metadata": self.activity_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
        # Add paper-specific fields if this is a paper activity
        if self.paper_id and self.paper:
            result.update({
                "paper_id": str(self.paper_id),
                "paper_title": self.paper.title,
                "paper_subject": self.paper.subject.name if self.paper.subject else None,
                "paper_university": self.paper.subject.semester.branch.program.university.name if self.paper.subject else None,
                "content_type": "paper",
                "content_id": str(self.paper_id),
                "content_title": self.paper.title
            })
        
        # Add note-specific fields if this is a note activity
        elif self.note_id and self.note:
            result.update({
                "note_id": str(self.note_id),
                "note_title": self.note.title,
                "note_subject": self.note.subject.name if self.note.subject else None,
                "note_university": self.note.subject.semester.branch.program.university.name if self.note.subject else None,
                "content_type": "note",
                "content_id": str(self.note_id),
                "content_title": self.note.title
            })
        
        # Legacy fields for backward compatibility
        result.update({
            "paper_id": str(self.paper_id) if self.paper_id else None,
            "paper_title": self.paper.title if self.paper else (self.note.title if self.note else None),
            "paper_subject": (self.paper.subject.name if self.paper and self.paper.subject else 
                            (self.note.subject.name if self.note and self.note.subject else None)),
            "paper_university": (self.paper.subject.semester.branch.program.university.name if self.paper and self.paper.subject else 
                                (self.note.subject.semester.branch.program.university.name if self.note and self.note.subject else None))
        })
        
        return result
