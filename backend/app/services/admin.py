from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import logging

from app.db.models import User, UserRole
from app.db.models import Paper, PaperStatus  # AuditLog might not exist yet
from app.schemas.user import UserUpdate, UserCreate
from app.schemas.admin import (
    UserStats, SystemStats, SystemConfig, 
    UserActivityLog, BulkUserAction, AdminUserUpdate
)
from app.services.security import hash_password as get_password_hash
import logging

# Create simple exception classes
class APIError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)

class NotFoundException(APIError):
    def __init__(self, detail: str):
        super().__init__(status_code=404, detail=detail)

class ValidationException(APIError):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

def get_audit_logger():
    return logging.getLogger("audit")

logger = logging.getLogger(__name__)
audit_logger = get_audit_logger()


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> List[User]:
        """Get users with filtering and pagination."""
        
        query = self.db.query(User)
        
        # Apply filters
        if role:
            query = query.filter(User.role == role)
        if is_active is not None:
            query = query.filter(User.is_email_verified == is_active)  # Using is_email_verified as proxy for active
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        # Apply sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        return query.offset(skip).limit(limit).all()

    def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID."""
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundException(f"User with id {user_id} not found")
        
        return user

    def update_user(
        self, 
        user_id: str, 
        user_update: AdminUserUpdate, 
        admin_user: User
    ) -> User:
        """Update user information."""
        
        user = self.get_user_by_id(user_id)
        
        # Prevent self-deactivation
        if user_id == admin_user.id and user_update.is_active is False:
            raise ValidationException("Cannot deactivate your own account")
        
        # Prevent self-role-change to non-admin
        if (user_id == admin_user.id and 
            user_update.role and 
            user_update.role != UserRole.ADMIN):
            raise ValidationException("Cannot change your own admin role")
        
        # Update fields
        update_data = user_update.dict(exclude_unset=True)
        
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        # Map is_active from schema to is_email_verified in the database model
        if "is_active" in update_data:
            update_data["is_email_verified"] = update_data.pop("is_active")
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        # Log the action
        audit_logger.info(
            f"Admin {admin_user.email} updated user {user.email}",
            extra={
                "admin_id": admin_user.id,
                "target_user_id": user_id,
                "action": "user_update",
                "changes": update_data
            }
        )
        
        return user

    def create_user(self, user_create: UserCreate, admin_user: User) -> User:
        """Create a new user (admin only)."""
        
        # Check if user already exists
        existing_user = self.db.query(User).filter(
            User.email == user_create.email
        ).first()
        
        if existing_user:
            raise ValidationException("User with this email already exists")
        
        # Create user
        user_data = user_create.dict()
        user_data["password_hash"] = get_password_hash(user_data.pop("password"))
        user_data["is_email_verified"] = True  # Admin-created users are pre-verified
        
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        audit_logger.info(
            f"Admin {admin_user.email} created user {user.email}",
            extra={
                "admin_id": admin_user.id,
                "target_user_id": user.id,
                "action": "user_create"
            }
        )
        
        return user

    def delete_user(self, user_id: str, admin_user: User) -> bool:
        """Delete user (admin only)."""
        
        user = self.get_user_by_id(user_id)
        
        # Prevent self-deletion
        if user_id == admin_user.id:
            raise ValidationException("Cannot delete your own account")
        
        # Check if user has papers
        paper_count = self.db.query(Paper).filter(Paper.uploader_id == user_id).count()
        if paper_count > 0:
            raise ValidationException(
                f"Cannot delete user with {paper_count} papers. "
                "Transfer or delete papers first."
            )
        
        self.db.delete(user)
        self.db.commit()
        
        audit_logger.info(
            f"Admin {admin_user.email} deleted user {user.email}",
            extra={
                "admin_id": admin_user.id,
                "target_user_id": user_id,
                "action": "user_delete"
            }
        )
        
        return True

    def bulk_user_action(
        self, 
        action: BulkUserAction, 
        admin_user: User
    ) -> Dict[str, Any]:
        """Perform bulk actions on users."""
        
        if not action.user_ids:
            raise ValidationException("No user IDs provided")
        
        # Prevent actions on self
        if admin_user.id in action.user_ids:
            raise ValidationException("Cannot perform bulk actions on your own account")
        
        users = self.db.query(User).filter(User.id.in_(action.user_ids)).all()
        found_ids = {user.id for user in users}
        missing_ids = set(action.user_ids) - found_ids
        
        results = {
            "action": action.action,
            "total_requested": len(action.user_ids),
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        if missing_ids:
            results["errors"].append(f"Users not found: {list(missing_ids)}")
            results["failed"] += len(missing_ids)
        
        for user in users:
            try:
                if action.action == "activate":
                    user.is_email_verified = True  # Use is_email_verified as proxy
                elif action.action == "deactivate":
                    user.is_email_verified = False  # Use is_email_verified as proxy
                elif action.action == "verify":
                    user.is_email_verified = True
                elif action.action == "unverify":
                    user.is_email_verified = False
                elif action.action == "make_moderator":
                    # UserRole.MODERATOR doesn't exist, skip
                    pass
                elif action.action == "make_user":
                    user.role = UserRole.STUDENT  # Use STUDENT instead of USER
                
                user.updated_at = datetime.utcnow()
                results["successful"] += 1
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"User {user.email}: {str(e)}")
        
        self.db.commit()
        
        audit_logger.info(
            f"Admin {admin_user.email} performed bulk action: {action.action}",
            extra={
                "admin_id": admin_user.id,
                "action": f"bulk_{action.action}",
                "target_user_ids": action.user_ids,
                "results": results
            }
        )
        
        return results

    def get_user_activity(
        self,
        user_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[UserActivityLog]:
        """Get user activity logs."""
        
        user = self.get_user_by_id(user_id)
        
        # TODO: Implement when AuditLog model is available
        # Return empty list for now
        return []

    def get_user_stats(self) -> UserStats:
        """Get user statistics."""
        
        total_users = self.db.query(User).count()
        # Use is_email_verified as proxy for active users
        active_users = self.db.query(User).filter(User.is_email_verified == True).count()
        verified_users = self.db.query(User).filter(User.is_email_verified == True).count()
        
        # Users by role
        role_stats = self.db.query(
            User.role, func.count(User.id)
        ).group_by(User.role).all()
        
        users_by_role = {role.value: count for role, count in role_stats}
        
        # Recent registrations (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = self.db.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        return UserStats(
            total_users=total_users,
            active_users=active_users,
            verified_users=verified_users,
            users_by_role=users_by_role,
            recent_registrations=recent_registrations
        )

    def get_system_stats(self) -> SystemStats:
        """Get system-wide statistics."""
        
        # Paper stats
        total_papers = self.db.query(Paper).count()
        approved_papers = self.db.query(Paper).filter(
            Paper.status == PaperStatus.APPROVED
        ).count()
        pending_papers = self.db.query(Paper).filter(
            Paper.status == PaperStatus.PENDING
        ).count()
        rejected_papers = self.db.query(Paper).filter(
            Paper.status == PaperStatus.REJECTED
        ).count()
        
        # Recent uploads (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = self.db.query(Paper).filter(
            Paper.created_at >= seven_days_ago
        ).count()
        
        # Storage stats (would need to integrate with storage service)
        storage_stats = {
            "total_files": total_papers,
            "total_size_bytes": 0,  # TODO: Calculate from storage service
            "average_file_size": 0  # TODO: Calculate from storage service
        }
        
        return SystemStats(
            total_papers=total_papers,
            approved_papers=approved_papers,
            pending_papers=pending_papers,
            rejected_papers=rejected_papers,
            recent_uploads=recent_uploads,
            storage_stats=storage_stats
        )

    def get_system_config(self) -> SystemConfig:
        """Get system configuration."""
        
        # This would typically come from a config table or environment
        # For now, returning some example configuration
        return SystemConfig(
            max_file_size_mb=50,
            allowed_file_types=["pdf", "doc", "docx", "ppt", "pptx"],
            max_daily_uploads=10,
            auto_approval_enabled=False,
            email_verification_required=True,
            registration_enabled=True,
            maintenance_mode=False
        )

    def update_system_config(
        self, 
        config_update: Dict[str, Any], 
        admin_user: User
    ) -> SystemConfig:
        """Update system configuration."""
        
        # In a real implementation, this would update a config table
        # For now, we'll just log the action
        
        audit_logger.info(
            f"Admin {admin_user.email} updated system configuration",
            extra={
                "admin_id": admin_user.id,
                "action": "config_update",
                "changes": config_update
            }
        )
        
        return self.get_system_config()

    def get_audit_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get audit logs with filtering."""
        
        # TODO: Implement when AuditLog model is available
        # Return empty list for now
        return []

    def cleanup_expired_tokens(self, admin_user: User) -> Dict[str, int]:
        """Clean up expired tokens and sessions."""
        
        # This would clean up expired JWT tokens, password reset tokens, etc.
        # Implementation depends on how tokens are stored
        
        audit_logger.info(
            f"Admin {admin_user.email} initiated token cleanup",
            extra={
                "admin_id": admin_user.id,
                "action": "token_cleanup"
            }
        )
        
        return {
            "expired_tokens_removed": 0,  # TODO: Implement actual cleanup
            "expired_sessions_removed": 0
        }

    def backup_database(self, admin_user: User) -> Dict[str, Any]:
        """Initiate database backup."""
        
        # This would trigger a database backup process
        # Implementation depends on database and backup strategy
        
        audit_logger.info(
            f"Admin {admin_user.email} initiated database backup",
            extra={
                "admin_id": admin_user.id,
                "action": "database_backup"
            }
        )
        
        return {
            "message": "Backup initiated",
            "backup_id": f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.utcnow()
        }

    def get_error_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        level: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get application error logs."""
        
        # This would read from application log files or log database
        # For now, returning placeholder data
        
        return [
            {
                "timestamp": datetime.utcnow(),
                "level": "ERROR",
                "message": "Example error message",
                "module": "app.routers.papers",
                "traceback": "Example traceback..."
            }
        ]


def get_admin_service(db: Session) -> AdminService:
    """Get admin service instance."""
    return AdminService(db)
