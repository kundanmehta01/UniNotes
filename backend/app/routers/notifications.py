from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.deps import get_current_active_user
from app.schemas.user import User
from app.services.notification import get_notification_service

router = APIRouter()


@router.get("/")
async def get_user_notifications(
    unread_only: bool = Query(False, description="Get only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's notifications."""
    
    notification_service = get_notification_service(db)
    
    notifications = notification_service.get_user_notifications(
        user_id=str(current_user.id),
        unread_only=unread_only,
        limit=limit,
        offset=offset
    )
    
    unread_count = notification_service.get_unread_count(str(current_user.id))
    
    notifications_data = []
    for notification in notifications:
        notifications_data.append({
            "id": str(notification.id),
            "title": notification.title,
            "message": notification.message,
            "type": notification.notification_type.value,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
            "read_at": notification.read_at,
            "related_paper_id": str(notification.related_paper_id) if notification.related_paper_id else None,
            "related_report_id": str(notification.related_report_id) if notification.related_report_id else None
        })
    
    return {
        "notifications": notifications_data,
        "unread_count": unread_count,
        "total": len(notifications_data),
        "has_more": len(notifications_data) == limit
    }


@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    
    notification_service = get_notification_service(db)
    
    success = notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=str(current_user.id)
    )
    
    if not success:
        return {"message": "Notification not found", "success": False}
    
    return {"message": "Notification marked as read", "success": True}


@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    
    notification_service = get_notification_service(db)
    
    updated_count = notification_service.mark_all_as_read(str(current_user.id))
    
    return {
        "message": f"{updated_count} notifications marked as read",
        "updated_count": updated_count,
        "success": True
    }


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get count of unread notifications."""
    
    notification_service = get_notification_service(db)
    unread_count = notification_service.get_unread_count(str(current_user.id))
    
    return {"unread_count": unread_count}
