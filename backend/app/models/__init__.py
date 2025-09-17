# Import all models to make them available
from .base import Base
from .user import User, UserRole
from .academic import University, Program, Branch, Semester, Subject
from .content import Paper, Note, Tag, PaperTag, NoteTag, PaperStatus, NoteStatus
from .interaction import (
    Download, NoteDownload, Bookmark, NoteBookmark, 
    Rating, NoteRating, Report, NoteReport, ReportStatus
)
from .activity import UserActivity, ActivityTypeEnum
from .notification import Notification, NotificationType
from .audit import AuditLog

__all__ = [
    "Base",
    "User", "UserRole",
    "University", "Program", "Branch", "Semester", "Subject",
    "Paper", "Note", "Tag", "PaperTag", "NoteTag", "PaperStatus", "NoteStatus",
    "Download", "NoteDownload", "Bookmark", "NoteBookmark",
    "Rating", "NoteRating", "Report", "NoteReport", "ReportStatus",
    "UserActivity", "ActivityTypeEnum",
    "Notification", "NotificationType",
    "AuditLog"
]
