import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import Notification, NotificationType, User, Paper, Report


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        related_paper_id: Optional[str] = None,
        related_report_id: Optional[str] = None
    ) -> Notification:
        """Create a new notification for a user."""
        
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_paper_id=related_paper_id,
            related_report_id=related_report_id
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        return notification
    
    def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """Get notifications for a user."""
        
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        query = query.order_by(desc(Notification.created_at))
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return False
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        
        updated_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        self.db.commit()
        return updated_count
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user."""
        
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    def create_warning_notification(
        self,
        user_id: str,
        paper_title: str,
        reason: str,
        admin_notes: str = "",
        paper_id: Optional[str] = None,
        report_id: Optional[str] = None
    ) -> Notification:
        """Create a warning notification for a user."""
        
        title = f"⚠️ Warning: Issue with your paper"
        message = f"Your paper '{paper_title}' has been reported for: {reason}."
        
        if admin_notes:
            message += f"\n\nAdmin notes: {admin_notes}"
        
        message += "\n\nPlease review our community guidelines to ensure your future uploads comply with our standards."
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=NotificationType.WARNING,
            related_paper_id=paper_id,
            related_report_id=report_id
        )
    
    def create_paper_status_notification(
        self,
        user_id: str,
        paper_title: str,
        status: str,
        admin_notes: str = "",
        paper_id: Optional[str] = None
    ) -> Notification:
        """Create a notification about paper status change."""
        
        if status.lower() == "approved":
            title = "✅ Paper Approved"
            message = f"Your paper '{paper_title}' has been approved and is now available for download."
            notification_type = NotificationType.SUCCESS
        elif status.lower() == "rejected":
            title = "❌ Paper Rejected"
            message = f"Your paper '{paper_title}' has been rejected."
            notification_type = NotificationType.ERROR
        else:
            title = "📄 Paper Status Update"
            message = f"Your paper '{paper_title}' status has been updated to: {status}"
            notification_type = NotificationType.INFO
        
        if admin_notes:
            message += f"\n\nReason: {admin_notes}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_paper_id=paper_id
        )


def get_notification_service(db: Session) -> NotificationService:
    """Get notification service instance."""
    return NotificationService(db)
