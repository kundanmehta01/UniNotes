import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.types import TypeDecorator, CHAR, String as SQLString
from sqlalchemy import JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()


class UUID(TypeDecorator):
    """Platform-independent UUID type.
    
    Uses PostgreSQL UUID when available,
    otherwise uses String for SQLite.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return str(value) if not isinstance(value, str) else value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            import uuid as uuid_lib
            return uuid_lib.UUID(value) if isinstance(value, str) else value


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"


class PaperStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class NoteStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
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


class University(Base):
    __tablename__ = "universities"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(20))  # University code like "VTU", "ANNA", etc.
    location = Column(String(255))
    website = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    programs = relationship("Program", back_populates="university")


class Program(Base):
    __tablename__ = "programs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # B.Tech, B.Sc, MBA, etc.
    slug = Column(String(255), nullable=False)
    duration_years = Column(Integer)  # 4 for B.Tech, 2 for MBA, etc.
    
    university_id = Column(UUID(), ForeignKey("universities.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    university = relationship("University", back_populates="programs")
    branches = relationship("Branch", back_populates="program")

    __table_args__ = (
        UniqueConstraint("university_id", "slug", name="unique_program_per_university"),
    )


class Branch(Base):
    __tablename__ = "branches"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # CSE, ECE, Mechanical, etc.
    slug = Column(String(255), nullable=False)
    code = Column(String(20))  # CSE, ECE, ME, etc.
    
    program_id = Column(UUID(), ForeignKey("programs.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    program = relationship("Program", back_populates="branches")
    semesters = relationship("Semester", back_populates="branch")

    __table_args__ = (
        UniqueConstraint("program_id", "slug", name="unique_branch_per_program"),
    )


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    name = Column(String(100))  # "First Semester", "Sem 1", etc.
    
    branch_id = Column(UUID(), ForeignKey("branches.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester")

    __table_args__ = (
        UniqueConstraint("branch_id", "number", name="unique_semester_per_branch"),
    )


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # Database Management Systems
    code = Column(String(50))  # CS301, 18CS53, etc.
    slug = Column(String(255), nullable=False)
    credits = Column(Integer)
    
    semester_id = Column(UUID(), ForeignKey("semesters.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="subjects")
    papers = relationship("Paper", back_populates="subject")
    notes = relationship("Note", back_populates="subject")

    __table_args__ = (
        UniqueConstraint("semester_id", "slug", name="unique_subject_per_semester"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    papers = relationship("Paper", secondary="paper_tags", back_populates="tags")
    notes = relationship("Note", secondary="note_tags", back_populates="tags")


class Paper(Base):
    __tablename__ = "papers"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    exam_year = Column(Integer, nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)  # S3 object key
    file_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA-256
    original_filename = Column(String(500))
    file_size = Column(BigInteger)  # in bytes
    mime_type = Column(String(100))
    
    # Status and moderation
    status = Column(Enum(PaperStatus), default=PaperStatus.PENDING, nullable=False, index=True)
    moderation_notes = Column(Text)
    
    # Foreign keys
    subject_id = Column(UUID(), ForeignKey("subjects.id"), nullable=False, index=True)
    uploader_id = Column(UUID(), ForeignKey("users.id"))
    
    # Stats
    download_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
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


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    semester_year = Column(Integer, nullable=False, index=True)  # Year when notes were taken
    storage_key = Column(String(500), nullable=False)  # S3 object key
    file_hash = Column(String(64), unique=True, nullable=False, index=True)  # SHA-256
    original_filename = Column(String(500))
    file_size = Column(BigInteger)  # in bytes
    mime_type = Column(String(100))
    
    # Status and moderation
    status = Column(Enum(NoteStatus), default=NoteStatus.PENDING, nullable=False, index=True)
    moderation_notes = Column(Text)
    
    # Foreign keys
    subject_id = Column(UUID(), ForeignKey("subjects.id"), nullable=False, index=True)
    uploader_id = Column(UUID(), ForeignKey("users.id"))
    
    # Stats
    download_count = Column(Integer, default=0, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
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


class NoteTag(Base):
    __tablename__ = "note_tags"

    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NoteDownload(Base):
    __tablename__ = "note_downloads"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Request metadata
    ip_hash = Column(String(64))  # Hashed IP for privacy
    user_agent = Column(Text)
    referer = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    note = relationship("Note", back_populates="downloads")
    user = relationship("User", back_populates="note_downloads")

    __table_args__ = (
        Index("idx_note_downloads_note_created", "note_id", "created_at"),
        Index("idx_note_downloads_user_created", "user_id", "created_at"),
    )


class NoteBookmark(Base):
    __tablename__ = "note_bookmarks"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="note_bookmarks")
    note = relationship("Note", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("user_id", "note_id", name="unique_note_bookmark_per_user_note"),
        Index("idx_note_bookmarks_user_created", "user_id", "created_at"),
    )


class NoteReport(Base):
    __tablename__ = "note_reports"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    reason = Column(String(500), nullable=False)
    details = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.OPEN, nullable=False)
    
    # Admin response
    admin_notes = Column(Text)
    resolved_by_id = Column(UUID(), ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True))

    # Relationships
    note = relationship("Note", back_populates="reports")
    reporter = relationship("User", back_populates="note_reports", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])

    __table_args__ = (
        Index("idx_note_reports_note", "note_id"),
        Index("idx_note_reports_status", "status"),
    )


class NoteRating(Base):
    __tablename__ = "note_ratings"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    note = relationship("Note", back_populates="ratings")
    user = relationship("User", back_populates="note_ratings")

    __table_args__ = (
        UniqueConstraint("user_id", "note_id", name="unique_note_rating_per_user_note"),
        Index("idx_note_ratings_note", "note_id"),
        Index("idx_note_ratings_user", "user_id"),
    )


class PaperTag(Base):
    __tablename__ = "paper_tags"

    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Download(Base):
    __tablename__ = "downloads"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Request metadata
    ip_hash = Column(String(64))  # Hashed IP for privacy
    user_agent = Column(Text)
    referer = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    paper = relationship("Paper", back_populates="downloads")
    user = relationship("User", back_populates="downloads")

    __table_args__ = (
        Index("idx_downloads_paper_created", "paper_id", "created_at"),
        Index("idx_downloads_user_created", "user_id", "created_at"),
    )


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookmarks")
    paper = relationship("Paper", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", name="unique_bookmark_per_user_paper"),
        Index("idx_bookmarks_user_created", "user_id", "created_at"),
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    reason = Column(String(500), nullable=False)
    details = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.OPEN, nullable=False)
    
    # Admin response
    admin_notes = Column(Text)
    resolved_by_id = Column(UUID(), ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True))

    # Relationships
    paper = relationship("Paper", back_populates="reports")
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])

    __table_args__ = (
        Index("idx_reports_paper", "paper_id"),
        Index("idx_reports_status", "status"),
    )


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


class ActivityTypeEnum(str, enum.Enum):
    UPLOAD = "upload"
    BOOKMARK = "bookmark"
    VIEW = "view"
    DOWNLOAD = "download"
    RATING = "rating"
    SEARCH = "search"


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    paper = relationship("Paper", back_populates="ratings")
    user = relationship("User", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", name="unique_rating_per_user_paper"),
        Index("idx_ratings_paper", "paper_id"),
        Index("idx_ratings_user", "user_id"),
    )


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
    activity_metadata = Column(Text, nullable=True)  # For storing additional context like rating value, search query, etc.
    
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
