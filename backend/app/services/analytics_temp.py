from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
import logging

from app.db.models import User, Paper, PaperStatus

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_usage_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get usage statistics for the specified period."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # New registrations
        new_registrations = self.db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Papers uploaded
        papers_uploaded = self.db.query(Paper).filter(
            Paper.created_at >= start_date
        ).count()
        
        # Papers approved
        papers_approved = self.db.query(Paper).filter(
            and_(
                Paper.created_at >= start_date,
                Paper.status == PaperStatus.APPROVED
            )
        ).count()
        
        return {
            "period_days": days,
            "active_users": 0,  # TODO: Implement when AuditLog is available
            "new_registrations": new_registrations,
            "papers_uploaded": papers_uploaded,
            "papers_approved": papers_approved,
            "total_downloads": 0,  # TODO: Implement when AuditLog is available
            "total_searches": 0,  # TODO: Implement when AuditLog is available
            "start_date": start_date,
            "end_date": end_date
        }

    def get_system_metrics(self, days: int = 30) -> Dict[str, Any]:
        """Get basic system metrics."""
        
        total_users = self.db.query(User).count()
        total_papers = self.db.query(Paper).count()
        approved_papers = self.db.query(Paper).filter(
            Paper.status == PaperStatus.APPROVED
        ).count()
        
        return {
            "total_users": total_users,
            "total_papers": total_papers,
            "approved_papers": approved_papers,
            "total_storage_bytes": 0,  # TODO: Get from storage service
            "error_rate_percent": 0,  # TODO: Implement when AuditLog is available
            "average_response_time_ms": 0,  # TODO: Implement response time tracking
        }


def get_analytics_service(db: Session) -> AnalyticsService:
    """Get analytics service instance."""
    return AnalyticsService(db)
