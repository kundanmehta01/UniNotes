from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import json

from app.db.models import AuditLog, User


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        actor_user_id: Optional[str] = None,
        action: str = "",
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an action to the audit trail."""
        
        audit_log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        
        return audit_log

    def log_user_login(self, user: User, ip_address: str, user_agent: str):
        """Log user login."""
        return self.log_action(
            actor_user_id=str(user.id),
            action="user_login",
            target_type="user",
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_user_logout(self, user: User, ip_address: str, user_agent: str):
        """Log user logout."""
        return self.log_action(
            actor_user_id=str(user.id),
            action="user_logout",
            target_type="user",
            target_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_paper_upload(self, user: User, paper_id: str, ip_address: str, user_agent: str):
        """Log paper upload."""
        return self.log_action(
            actor_user_id=str(user.id),
            action="paper_upload",
            target_type="paper",
            target_id=paper_id,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_paper_download(self, user: Optional[User], paper_id: str, ip_address: str, user_agent: str):
        """Log paper download."""
        return self.log_action(
            actor_user_id=str(user.id) if user else None,
            action="paper_download",
            target_type="paper",
            target_id=paper_id,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_paper_search(self, user: Optional[User], query: str, ip_address: str, user_agent: str):
        """Log paper search."""
        return self.log_action(
            actor_user_id=str(user.id) if user else None,
            action="paper_search",
            details={"search_query": query},
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_admin_action(
        self,
        admin_user: User,
        action: str,
        target_type: str,
        target_id: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log admin action."""
        return self.log_action(
            actor_user_id=str(admin_user.id),
            action=f"admin_{action}",
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_paper_moderation(
        self,
        admin_user: User,
        paper_id: str,
        action: str,  # approve/reject
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log paper moderation action."""
        return self.log_admin_action(
            admin_user=admin_user,
            action=f"paper_{action}",
            target_type="paper",
            target_id=paper_id,
            details={"moderation_notes": notes} if notes else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_user_management(
        self,
        admin_user: User,
        action: str,  # create/update/delete
        target_user_id: str,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log user management action."""
        return self.log_admin_action(
            admin_user=admin_user,
            action=f"user_{action}",
            target_type="user",
            target_id=target_user_id,
            details={"changes": changes} if changes else None,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def log_system_config_change(
        self,
        admin_user: User,
        changes: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log system configuration change."""
        return self.log_admin_action(
            admin_user=admin_user,
            action="config_update",
            target_type="system",
            target_id="config",
            details={"changes": changes},
            ip_address=ip_address,
            user_agent=user_agent
        )


def get_audit_service(db: Session) -> AuditService:
    """Get audit service instance."""
    return AuditService(db)
