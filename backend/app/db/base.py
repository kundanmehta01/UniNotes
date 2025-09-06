"""Database base for SQLAlchemy models."""

# Import the Base from models to ensure it's available for Alembic
from app.db.models import Base

# Import all models to ensure they're registered with SQLAlchemy
from app.db.models import (
    User,
    University,
    Program,
    Branch,
    Semester,
    Subject,
    Tag,
    Paper,
    PaperTag,
    Download,
    Bookmark,
    Report,
    AuditLog,
    UserRole,
    PaperStatus,
    ReportStatus,
)

# Export Base so it can be imported by Alembic
__all__ = ["Base"]
