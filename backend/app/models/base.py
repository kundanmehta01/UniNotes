import uuid
from datetime import datetime
from sqlalchemy import CHAR, Column, DateTime, and_
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.types import TypeDecorator
from sqlalchemy.sql import func

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


class SoftDeleteMixin:
    """Mixin for soft delete functionality.
    
    Adds deleted_at field and helper methods for soft delete operations.
    """
    
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    @classmethod
    def active(cls):
        """Query only non-deleted records."""
        return cls.deleted_at.is_(None)
    
    @classmethod
    def deleted(cls):
        """Query only deleted records."""
        return cls.deleted_at.isnot(None)
    
    @classmethod
    def with_deleted(cls):
        """Query all records including deleted ones."""
        return True  # No filter applied
    
    def soft_delete(self, session: Session = None):
        """Mark record as deleted without removing from database."""
        self.deleted_at = func.now()
        if session:
            session.add(self)
            session.commit()
    
    def restore(self, session: Session = None):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        if session:
            session.add(self)
            session.commit()
    
    @property
    def is_deleted(self) -> bool:
        """Check if the record is soft-deleted."""
        return self.deleted_at is not None
