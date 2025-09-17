import uuid
import enum
from sqlalchemy import (
    Column, DateTime, ForeignKey, Integer, String, Text, 
    UniqueConstraint, Index, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base, UUID


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


# Downloads
class Download(Base):
    __tablename__ = "downloads"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="SET NULL"))
    ip_hash = Column(String(64))
    user_agent = Column(Text)
    referer = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    paper = relationship("Paper", back_populates="downloads")
    user = relationship("User", back_populates="downloads")
    __table_args__ = (
        Index("idx_downloads_paper_created", "paper_id", "created_at"),
        Index("idx_downloads_user_created", "user_id", "created_at"),
    )


class NoteDownload(Base):
    __tablename__ = "note_downloads"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="SET NULL"))
    ip_hash = Column(String(64))
    user_agent = Column(Text)
    referer = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    note = relationship("Note", back_populates="downloads")
    user = relationship("User", back_populates="note_downloads")
    __table_args__ = (
        Index("idx_note_downloads_note_created", "note_id", "created_at"),
        Index("idx_note_downloads_user_created", "user_id", "created_at"),
    )


# Bookmarks
class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    user = relationship("User", back_populates="bookmarks")
    paper = relationship("Paper", back_populates="bookmarks")
    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", name="unique_bookmark_per_user_paper"),
        Index("idx_bookmarks_user_created", "user_id", "created_at"),
    )


class NoteBookmark(Base):
    __tablename__ = "note_bookmarks"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    user = relationship("User", back_populates="note_bookmarks")
    note = relationship("Note", back_populates="bookmarks")
    __table_args__ = (
        UniqueConstraint("user_id", "note_id", name="unique_note_bookmark_per_user_note"),
        Index("idx_note_bookmarks_user_created", "user_id", "created_at"),
    )


# Ratings
class Rating(Base):
    __tablename__ = "ratings"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    paper = relationship("Paper", back_populates="ratings")
    user = relationship("User", back_populates="ratings")
    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", name="unique_rating_per_user_paper"),
        Index("idx_ratings_paper", "paper_id"),
        Index("idx_ratings_user", "user_id"),
    )


class NoteRating(Base):
    __tablename__ = "note_ratings"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    note = relationship("Note", back_populates="ratings")
    user = relationship("User", back_populates="note_ratings")
    __table_args__ = (
        UniqueConstraint("user_id", "note_id", name="unique_note_rating_per_user_note"),
        Index("idx_note_ratings_note", "note_id"),
        Index("idx_note_ratings_user", "user_id"),
    )


# Reports
class Report(Base):
    __tablename__ = "reports"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(500), nullable=False)
    details = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.OPEN, nullable=False)
    admin_notes = Column(Text)
    resolved_by_id = Column(UUID(), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    
    paper = relationship("Paper", back_populates="reports")
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    __table_args__ = (
        Index("idx_reports_paper", "paper_id"),
        Index("idx_reports_status", "status"),
    )


class NoteReport(Base):
    __tablename__ = "note_reports"
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(500), nullable=False)
    details = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.OPEN, nullable=False)
    admin_notes = Column(Text)
    resolved_by_id = Column(UUID(), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    
    note = relationship("Note", back_populates="reports")
    reporter = relationship("User", back_populates="note_reports", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    __table_args__ = (
        Index("idx_note_reports_note", "note_id"),
        Index("idx_note_reports_status", "status"),
    )
