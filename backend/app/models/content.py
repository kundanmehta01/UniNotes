import uuid
import enum
from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, String, Text, BigInteger, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, UUID, SoftDeleteMixin


class PaperStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class NoteStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Tag(Base, SoftDeleteMixin):
    __tablename__ = "tags"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    papers = relationship("Paper", secondary="paper_tags", back_populates="tags")
    notes = relationship("Note", secondary="note_tags", back_populates="tags")


class Paper(Base, SoftDeleteMixin):
    __tablename__ = "papers"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    exam_year = Column(Integer, nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    original_filename = Column(String(500))
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    
    status = Column(Enum(PaperStatus), default=PaperStatus.PENDING, nullable=False, index=True)
    moderation_notes = Column(Text)
    
    subject_id = Column(UUID(), ForeignKey("subjects.id"), nullable=False, index=True)
    uploader_id = Column(UUID(), ForeignKey("users.id"))
    
    download_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subject = relationship("Subject", back_populates="papers")
    uploader = relationship("User", back_populates="papers")
    downloads = relationship("Download", back_populates="paper")
    bookmarks = relationship("Bookmark", back_populates="paper")
    reports = relationship("Report", back_populates="paper")
    ratings = relationship("Rating", back_populates="paper")
    tags = relationship("Tag", secondary="paper_tags", back_populates="papers")
    activities = relationship("UserActivity", back_populates="paper")

    __table_args__ = (
        Index("idx_papers_status_year", "status", "exam_year"),
        Index("idx_papers_subject_status", "subject_id", "status"),
        Index("idx_papers_uploader", "uploader_id"),
    )


class Note(Base, SoftDeleteMixin):
    __tablename__ = "notes"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    semester_year = Column(Integer, nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    original_filename = Column(String(500))
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    
    status = Column(Enum(NoteStatus), default=NoteStatus.PENDING, nullable=False, index=True)
    moderation_notes = Column(Text)
    
    subject_id = Column(UUID(), ForeignKey("subjects.id"), nullable=False, index=True)
    uploader_id = Column(UUID(), ForeignKey("users.id"))
    
    download_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subject = relationship("Subject", back_populates="notes")
    uploader = relationship("User", back_populates="notes")
    downloads = relationship("NoteDownload", back_populates="note")
    bookmarks = relationship("NoteBookmark", back_populates="note")
    reports = relationship("NoteReport", back_populates="note")
    ratings = relationship("NoteRating", back_populates="note")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")
    activities = relationship("UserActivity", back_populates="note")

    __table_args__ = (
        Index("idx_notes_status_year", "status", "semester_year"),
        Index("idx_notes_subject_status", "subject_id", "status"),
        Index("idx_notes_uploader", "uploader_id"),
    )


class PaperTag(Base):
    __tablename__ = "paper_tags"
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NoteTag(Base):
    __tablename__ = "note_tags"
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
