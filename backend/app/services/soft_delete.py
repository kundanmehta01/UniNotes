"""
Soft Delete Service Utilities

This module provides utility functions and decorators for handling soft delete operations
across the application.
"""

from typing import Type, TypeVar, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session, Query
from sqlalchemy.sql import func
from sqlalchemy.exc import NoResultFound

from app.models.base import SoftDeleteMixin

T = TypeVar('T', bound=SoftDeleteMixin)


class SoftDeleteService:
    """Service class for managing soft delete operations."""
    
    @staticmethod
    def get_active_query(model: Type[T], session: Session) -> Query:
        """Get a query for active (non-deleted) records."""
        return session.query(model).filter(model.deleted_at.is_(None))
    
    @staticmethod
    def get_deleted_query(model: Type[T], session: Session) -> Query:
        """Get a query for deleted records."""
        return session.query(model).filter(model.deleted_at.isnot(None))
    
    @staticmethod
    def get_all_query(model: Type[T], session: Session) -> Query:
        """Get a query for all records (including deleted)."""
        return session.query(model)
    
    @staticmethod
    def soft_delete(instance: T, session: Session, commit: bool = True) -> None:
        """Soft delete a model instance."""
        instance.deleted_at = func.now()
        session.add(instance)
        if commit:
            session.commit()
    
    @staticmethod
    def soft_delete_by_id(
        model: Type[T], 
        instance_id: str, 
        session: Session, 
        commit: bool = True
    ) -> Optional[T]:
        """Soft delete a record by its ID."""
        instance = SoftDeleteService.get_active_query(model, session).filter(
            model.id == instance_id
        ).first()
        
        if instance:
            SoftDeleteService.soft_delete(instance, session, commit)
            return instance
        return None
    
    @staticmethod
    def restore(instance: T, session: Session, commit: bool = True) -> None:
        """Restore a soft-deleted model instance."""
        instance.deleted_at = None
        session.add(instance)
        if commit:
            session.commit()
    
    @staticmethod
    def restore_by_id(
        model: Type[T], 
        instance_id: str, 
        session: Session, 
        commit: bool = True
    ) -> Optional[T]:
        """Restore a soft-deleted record by its ID."""
        instance = SoftDeleteService.get_deleted_query(model, session).filter(
            model.id == instance_id
        ).first()
        
        if instance:
            SoftDeleteService.restore(instance, session, commit)
            return instance
        return None
    
    @staticmethod
    def hard_delete(instance: T, session: Session, commit: bool = True) -> None:
        """Permanently delete a model instance (use with caution)."""
        session.delete(instance)
        if commit:
            session.commit()
    
    @staticmethod
    def hard_delete_by_id(
        model: Type[T], 
        instance_id: str, 
        session: Session, 
        commit: bool = True
    ) -> bool:
        """Permanently delete a record by its ID (use with caution)."""
        instance = SoftDeleteService.get_all_query(model, session).filter(
            model.id == instance_id
        ).first()
        
        if instance:
            SoftDeleteService.hard_delete(instance, session, commit)
            return True
        return False
    
    @staticmethod
    def bulk_soft_delete(
        model: Type[T], 
        instance_ids: List[str], 
        session: Session, 
        commit: bool = True
    ) -> int:
        """Soft delete multiple records by their IDs."""
        count = session.query(model).filter(
            model.id.in_(instance_ids),
            model.deleted_at.is_(None)
        ).update(
            {model.deleted_at: func.now()},
            synchronize_session=False
        )
        
        if commit:
            session.commit()
        return count
    
    @staticmethod
    def bulk_restore(
        model: Type[T], 
        instance_ids: List[str], 
        session: Session, 
        commit: bool = True
    ) -> int:
        """Restore multiple soft-deleted records by their IDs."""
        count = session.query(model).filter(
            model.id.in_(instance_ids),
            model.deleted_at.isnot(None)
        ).update(
            {model.deleted_at: None},
            synchronize_session=False
        )
        
        if commit:
            session.commit()
        return count


def active_only(query_func):
    """
    Decorator to automatically filter out soft-deleted records from query methods.
    
    Usage:
    @active_only
    def get_papers(session):
        return session.query(Paper)
    """
    def wrapper(*args, **kwargs):
        query = query_func(*args, **kwargs)
        # Assuming the model has a deleted_at attribute
        model = query.column_descriptions[0]['type']
        if hasattr(model, 'deleted_at'):
            query = query.filter(model.deleted_at.is_(None))
        return query
    return wrapper


def include_deleted(query_func):
    """
    Decorator to explicitly include soft-deleted records in query methods.
    This is mainly for documentation purposes - it doesn't filter anything.
    
    Usage:
    @include_deleted
    def get_all_papers_including_deleted(session):
        return session.query(Paper)
    """
    def wrapper(*args, **kwargs):
        return query_func(*args, **kwargs)
    return wrapper


class SoftDeleteQueryMixin:
    """
    Mixin class to add soft delete query methods to service classes.
    
    Usage:
    class PaperService(SoftDeleteQueryMixin):
        model = Paper
        
        def get_by_subject(self, subject_id, session, include_deleted=False):
            query = self.get_base_query(session, include_deleted)
            return query.filter(Paper.subject_id == subject_id)
    """
    
    model: Type[SoftDeleteMixin] = None
    
    def get_base_query(self, session: Session, include_deleted: bool = False) -> Query:
        """Get base query with optional soft delete filtering."""
        if not self.model:
            raise ValueError("Model must be set for SoftDeleteQueryMixin")
            
        query = session.query(self.model)
        if not include_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        return query
    
    def get_deleted_query(self, session: Session) -> Query:
        """Get query for only deleted records."""
        if not self.model:
            raise ValueError("Model must be set for SoftDeleteQueryMixin")
            
        return session.query(self.model).filter(self.model.deleted_at.isnot(None))
    
    def soft_delete_by_id(self, instance_id: str, session: Session) -> Optional[SoftDeleteMixin]:
        """Soft delete a record by ID."""
        return SoftDeleteService.soft_delete_by_id(self.model, instance_id, session)
    
    def restore_by_id(self, instance_id: str, session: Session) -> Optional[SoftDeleteMixin]:
        """Restore a soft-deleted record by ID."""
        return SoftDeleteService.restore_by_id(self.model, instance_id, session)
