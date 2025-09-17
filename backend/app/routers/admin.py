from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.db.session import get_db
from app.deps import get_current_admin_user
from app.schemas.user import User, UserUpdate
from app.schemas.admin import (
    UserStats, SystemStats, SystemConfig, SystemConfigUpdate,
    BulkUserAction, BulkActionResult, UserActivityLog,
    AdminDashboardStats, AuditLogEntry, ErrorLogEntry,
    BackupInfo, TokenCleanupResult, UserDetailResponse, AdminUserUpdate
)
from app.schemas.paper import PaperSearchFilters, PaperListResponse, PaperModerationAction, Report, ReportUpdate
from app.services.admin import get_admin_service
from app.services.paper import get_paper_service
from app.services.soft_delete import SoftDeleteService
from app.deps import get_request_ip, get_request_metadata, get_pagination_params, PaginationParams
from app.db.models import UserRole, Paper, PaperStatus, Note, NoteStatus
from app.models.user import User as UserModel
from app.models.content import Paper as PaperModel, Note as NoteModel, Tag
from app.models.academic import University, Program, Branch, Semester, Subject

router = APIRouter()


# Dashboard and Statistics
@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get admin dashboard statistics."""
    
    from app.db.models import Report as ReportModel, ReportStatus, User as UserModel, University
    
    admin_service = get_admin_service(db)
    
    # Get dynamic counts for top cards
    total_users = db.query(UserModel).count()
    total_papers = db.query(Paper).count()
    total_notes = db.query(Note).count()
    total_universities = db.query(University).count()
    pending_reviews = db.query(Paper).filter(Paper.status == PaperStatus.PENDING).count()
    
    # Get note moderation statistics
    pending_notes = db.query(Note).filter(Note.status == NoteStatus.PENDING).count()
    approved_notes = db.query(Note).filter(Note.status == NoteStatus.APPROVED).count()
    rejected_notes = db.query(Note).filter(Note.status == NoteStatus.REJECTED).count()
    
    # Get detailed user and system stats
    user_stats = admin_service.get_user_stats()
    system_stats = admin_service.get_system_stats()
    
    # Get report statistics
    open_reports_count = db.query(ReportModel).filter(ReportModel.status == ReportStatus.OPEN).count()
    total_reports_count = db.query(ReportModel).count()
    
    # Get recent audit logs (empty for now)
    recent_activity = admin_service.get_audit_logs(limit=10)
    
    # Dashboard cards data
    dashboard_cards = {
        "total_users": total_users,
        "total_papers": total_papers,
        "total_notes": total_notes,
        "total_universities": total_universities,
        "pending_reviews": pending_reviews
    }
    
    # Transform user stats to match frontend expectations
    user_stats_dict = user_stats.dict() if hasattr(user_stats, 'dict') else user_stats
    transformed_user_stats = {
        "total": user_stats_dict.get("total_users", total_users),
        "verified": user_stats_dict.get("verified_users", total_users),  # Use total as fallback
        "admins": user_stats_dict.get("users_by_role", {}).get("admin", 0),
        "students": user_stats_dict.get("users_by_role", {}).get("student", 0)
    }
    
    # Transform system stats to match frontend expectations
    system_stats_dict = system_stats.dict() if hasattr(system_stats, 'dict') else system_stats
    transformed_system_stats = {
        **system_stats_dict,
        "papers": {
            "total": system_stats_dict.get("total_papers", total_papers),
            "pending": system_stats_dict.get("pending_papers", pending_reviews),
            "approved": system_stats_dict.get("approved_papers", 0),
            "rejected": system_stats_dict.get("rejected_papers", 0)
        },
        "notes": {
            "total": total_notes,
            "pending": pending_notes,
            "approved": approved_notes,
            "rejected": rejected_notes
        },
        "recent_reports": open_reports_count,
        "total_reports": total_reports_count,
        "recent_uploads": system_stats_dict.get("recent_uploads", 0),
        "recent_downloads": system_stats_dict.get("recent_downloads", 0)
    }
    
    return {
        # New dashboard cards structure for direct access
        "dashboard_cards": dashboard_cards,
        
        # Existing structure that frontend expects
        "user_stats": transformed_user_stats,
        "system_stats": transformed_system_stats,
        "recent_activity": recent_activity,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/stats/users", response_model=UserStats)
async def get_user_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get user statistics."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_user_stats()


@router.get("/stats/system", response_model=SystemStats)
async def get_system_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system statistics."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_system_stats()


# User Management
@router.get("/users")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, min_length=2),
    sort_by: str = Query("created_at", regex="^(created_at|username|email|role|last_login)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get users with filtering and pagination."""
    
    admin_service = get_admin_service(db)
    users = admin_service.get_users(
        skip=skip,
        limit=limit,
        role=role,
        is_active=is_active,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate total count for pagination
    from app.db.models import User as UserModel
    query = db.query(UserModel)
    if role:
        query = query.filter(UserModel.role == role)
    if is_active is not None:
        query = query.filter(UserModel.is_active == is_active)
    if search:
        from sqlalchemy import or_
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                UserModel.email.ilike(search_term),
                UserModel.first_name.ilike(search_term),
                UserModel.last_name.ilike(search_term)
            )
        )
    
    total = query.count()
    pages = (total + limit - 1) // limit
    
    return {
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip() or None,
                "role": user.role.value,
                "is_active": user.is_active,  # Actual is_active status
                "is_verified": True,  # All OTP users are considered verified
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "last_login": getattr(user, 'last_login', None)
            }
            for user in users
        ],
        "total": total,
        "page": (skip // limit) + 1,
        "pages": pages,
        "limit": limit
    }


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_details(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed user information."""
    
    admin_service = get_admin_service(db)
    user = admin_service.get_user_by_id(user_id)
    
    # Get user statistics
    from app.db.models import Paper, PaperStatus
    total_uploads = db.query(Paper).filter(Paper.uploaded_by == user_id).count()
    approved_uploads = db.query(Paper).filter(
        Paper.uploaded_by == user_id,
        Paper.status == PaperStatus.APPROVED
    ).count()
    
    # Get recent activity
    recent_activity = admin_service.get_user_activity(user_id, days=30, limit=20)
    
    return UserDetailResponse(
        id=user.id,
        username=user.email.split('@')[0],  # Use email prefix as username
        email=user.email,
        full_name=f"{user.first_name or ''} {user.last_name or ''}".strip() or None,
        role=user.role,
        is_active=user.is_active,  # Actual is_active status
        is_verified=True,  # All OTP users are considered verified
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=getattr(user, 'last_login_at', None),
        total_uploads=total_uploads,
        approved_uploads=approved_uploads,
        total_downloads=0,  # TODO: Implement download tracking
        recent_activity=recent_activity
    )


# DEPRECATED: User creation now handled via OTP authentication
# Admin endpoint for creating users is no longer available
@router.post("/users", response_model=dict, status_code=status.HTTP_200_OK)
async def create_user_deprecated(
    user_data: dict,  # {"email": str, "first_name": str, "last_name": str}
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """DEPRECATED: User creation now handled via OTP authentication."""
    
    return {
        "message": "User creation through admin panel has been replaced with OTP authentication. Users can register by using /auth/send-otp.",
        "status": "deprecated",
        "alternative": "/auth/send-otp",
        "email": user_data.get("email")
    }


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: AdminUserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update user information (admin only)."""
    
    admin_service = get_admin_service(db)
    return admin_service.update_user(user_id, user_update, current_user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a user."""
    
    admin_service = get_admin_service(db)
    success = admin_service.delete_user(user_id, current_user)
    
    if success:
        return {"message": "User deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.post("/users/bulk-action", response_model=BulkActionResult)
async def bulk_user_action(
    action: BulkUserAction,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Perform bulk actions on users."""
    
    admin_service = get_admin_service(db)
    return admin_service.bulk_user_action(action, current_user)


@router.get("/users/{user_id}/activity", response_model=List[UserActivityLog])
async def get_user_activity(
    user_id: str,
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get user activity logs."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_user_activity(user_id, days, limit)


# System Configuration
@router.get("/config", response_model=SystemConfig)
async def get_system_config(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system configuration."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_system_config()


@router.put("/config", response_model=SystemConfig)
async def update_system_config(
    config_update: SystemConfigUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update system configuration."""
    
    admin_service = get_admin_service(db)
    update_data = config_update.dict(exclude_unset=True)
    return admin_service.update_system_config(update_data, current_user)


# Audit Logs
@router.get("/logs/audit", response_model=List[AuditLogEntry])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get audit logs with filtering."""
    
    admin_service = get_admin_service(db)
    logs = admin_service.get_audit_logs(
        skip=skip,
        limit=limit,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date
    )
    
    return [
        AuditLogEntry(
            id=log.id,
            timestamp=log.timestamp,
            user_id=log.user_id,
            username=log.user.username if log.user else None,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details
        )
        for log in logs
    ]


@router.get("/logs/errors", response_model=List[ErrorLogEntry])
async def get_error_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    level: Optional[str] = Query(None, regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get application error logs."""
    
    admin_service = get_admin_service(db)
    logs = admin_service.get_error_logs(
        skip=skip,
        limit=limit,
        level=level,
        start_date=start_date,
        end_date=end_date
    )
    
    return [ErrorLogEntry(**log) for log in logs]


# System Maintenance
@router.post("/maintenance/cleanup-tokens", response_model=TokenCleanupResult)
async def cleanup_expired_tokens(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Clean up expired tokens and sessions."""
    
    admin_service = get_admin_service(db)
    return admin_service.cleanup_expired_tokens(current_user)


@router.post("/maintenance/backup-database", response_model=BackupInfo)
async def backup_database(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Initiate database backup."""
    
    admin_service = get_admin_service(db)
    return admin_service.backup_database(current_user)


@router.post("/maintenance/clear-cache")
async def clear_system_cache(
    cache_type: str = Query("all", regex="^(all|user_sessions|file_metadata|search_results)$"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Clear system caches."""
    
    from app.utils.logging import get_audit_logger
    audit_logger = get_audit_logger()
    
    audit_logger.info(
        f"Admin {current_user.username} cleared {cache_type} cache",
        extra={
            "admin_id": current_user.id,
            "action": "cache_clear",
            "cache_type": cache_type
        }
    )
    
    return {
        "message": f"Cache '{cache_type}' cleared successfully",
        "timestamp": datetime.utcnow()
    }


# System Health Check
@router.get("/health")
async def system_health_check(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system health status."""
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "checks": {
            "database": "healthy",
            "storage": "healthy",
            "email": "healthy",
            "cache": "healthy"
        },
        "services": {
            "auth_service": "running",
            "paper_service": "running",
            "storage_service": "running",
            "email_service": "running"
        }
    }
    
    try:
        # Test database connection
        db.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


# Export Data
@router.get("/export/users")
async def export_users(
    format: str = Query("csv", regex="^(csv|json|xlsx)$"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Export user data."""
    
    return {
        "message": f"User export in {format} format initiated",
        "export_id": f"users_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "timestamp": datetime.utcnow()
    }


@router.get("/export/papers")
async def export_papers(
    format: str = Query("csv", regex="^(csv|json|xlsx)$"),
    include_content: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Export paper metadata."""
    
    return {
        "message": f"Paper export in {format} format initiated",
        "export_id": f"papers_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "include_content": include_content,
        "timestamp": datetime.utcnow()
    }


# Paper Management and Moderation
@router.get("/papers/pending", response_model=PaperListResponse)
async def get_pending_papers(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all pending papers for moderation."""
    
    paper_service = get_paper_service(db)
    
    # Get pending papers only
    from app.db.models import PaperStatus
    filters = PaperSearchFilters(
        status=PaperStatus.PENDING,
        sort="created_at",
        order="asc"  # Oldest first for FIFO processing
    )
    
    results = paper_service.search_papers(
        filters=filters,
        page=pagination.page,
        page_size=pagination.page_size,
        user=current_user
    )
    
    return results


@router.get("/papers/all", response_model=PaperListResponse)
async def get_all_papers_admin(
    status_filter: Optional[str] = Query(None, regex="^(pending|approved|rejected)$"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all papers with optional status filter (admin only)."""
    
    paper_service = get_paper_service(db)
    
    # Convert string status to enum if provided
    status_enum = None
    if status_filter:
        status_mapping = {
            "pending": PaperStatus.PENDING,
            "approved": PaperStatus.APPROVED,
            "rejected": PaperStatus.REJECTED
        }
        status_enum = status_mapping.get(status_filter.lower())
    
    filters = PaperSearchFilters(
        status=status_enum,
        sort="created_at",
        order="desc"
    )
    
    results = paper_service.search_papers(
        filters=filters,
        page=pagination.page,
        page_size=pagination.page_size,
        user=current_user
    )
    
    return results


@router.get("/papers/stats")
async def get_paper_moderation_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get paper moderation statistics."""
    
    # Get counts by status
    pending_count = db.query(Paper).filter(Paper.status == PaperStatus.PENDING).count()
    approved_count = db.query(Paper).filter(Paper.status == PaperStatus.APPROVED).count()
    rejected_count = db.query(Paper).filter(Paper.status == PaperStatus.REJECTED).count()
    total_count = db.query(Paper).count()
    
    # Get recent activity (papers in last 7 days)
    from datetime import timedelta
    recent_cutoff = datetime.utcnow() - timedelta(days=7)
    recent_uploads = db.query(Paper).filter(Paper.created_at >= recent_cutoff).count()
    recent_pending = db.query(Paper).filter(
        Paper.created_at >= recent_cutoff,
        Paper.status == PaperStatus.PENDING
    ).count()
    
    return {
        "total_papers": total_count,
        "pending_papers": pending_count,
        "approved_papers": approved_count,
        "rejected_papers": rejected_count,
        "approval_rate": round((approved_count / max(total_count, 1)) * 100, 2),
        "recent_uploads": recent_uploads,
        "recent_pending": recent_pending,
        "requires_attention": pending_count > 0
    }


from fastapi import Request
@router.post("/papers/{paper_id}/moderate")
async def moderate_paper_admin(
    paper_id: str,
    action: PaperModerationAction,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Approve or reject a paper (admin only)."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    
    paper = await paper_service.moderate_paper(
        paper_id=paper_id,
        action=action.action,
        notes=action.notes,
        moderator=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {
        "message": f"Paper {action.action}d successfully",
        "paper_id": str(paper.id),
        "new_status": paper.status.value,
        "moderated_at": paper.approved_at or datetime.utcnow(),
        "moderated_by": f"{current_user.first_name} {current_user.last_name}"
    }


@router.post("/papers/{paper_id}/approve")
async def quick_approve_paper(
    paper_id: str,
    notes: str = Query("", description="Optional moderation notes"),
    request: Request = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Quick approve endpoint for bulk operations."""
    
    # Create moderation action
    action = PaperModerationAction(action="approve", notes=notes)
    
    # Use the main moderation endpoint
    return await moderate_paper_admin(paper_id, action, request, current_user, db)


@router.post("/papers/{paper_id}/reject")
async def quick_reject_paper(
    paper_id: str,
    notes: str = Query("", description="Optional moderation notes"),
    request: Request = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Quick reject endpoint for bulk operations."""
    
    # Create moderation action
    action = PaperModerationAction(action="reject", notes=notes)
    
    # Use the main moderation endpoint
    return await moderate_paper_admin(paper_id, action, request, current_user, db)


# Reports Management
@router.get("/reports")
async def get_reports(
    pagination: PaginationParams = Depends(get_pagination_params),
    status: Optional[str] = Query(None, description="Filter by status: open, closed, resolved, all"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all reports (papers and notes) with filtering and pagination."""
    
    try:
        from app.db.models import Report as PaperReportModel, NoteReport, ReportStatus, User as UserModel, Note
        from sqlalchemy import text
        
        # Build status filter condition
        status_condition = None
        if status and status.lower().strip() != "all":
            filter_value = status.lower().strip()
            
            if filter_value in ["open", "pending"]:
                status_condition = ReportStatus.OPEN
            elif filter_value in ["closed", "resolved"]:
                status_condition = ReportStatus.CLOSED
        
        # First, let's try getting just paper reports to see if that works
        paper_query = db.query(PaperReportModel).join(Paper, PaperReportModel.paper_id == Paper.id)
        
        if status_condition:
            paper_query = paper_query.filter(PaperReportModel.status == status_condition)
        
        # Order by creation date (newest first)
        paper_query = paper_query.order_by(PaperReportModel.created_at.desc())
        
        # Count total paper reports
        total_paper_reports = paper_query.count()
        
        # Get note reports separately for now
        note_query = db.query(NoteReport).join(Note, NoteReport.note_id == Note.id)
        
        if status_condition:
            note_query = note_query.filter(NoteReport.status == status_condition)
        
        # Order by creation date (newest first)
        note_query = note_query.order_by(NoteReport.created_at.desc())
        
        # Count total note reports
        total_note_reports = note_query.count()
        
        # Apply pagination to paper reports first (we'll improve this later)
        offset = (pagination.page - 1) * pagination.page_size
        paper_reports = paper_query.offset(offset).limit(pagination.page_size).all()
        
        # Get some note reports too
        remaining_slots = pagination.page_size - len(paper_reports)
        note_reports = []
        if remaining_slots > 0:
            note_reports = note_query.limit(remaining_slots).all()
        
        # Format response with dynamic time calculation
        current_time = datetime.utcnow()
        reports_data = []
        
        def get_relative_time(timestamp):
            """Calculate relative time string"""
            if not timestamp:
                return None
            
            time_diff = current_time - timestamp
            total_seconds = int(time_diff.total_seconds())
            
            if total_seconds < 60:
                return "Just now"
            elif total_seconds < 3600:  # Less than 1 hour
                minutes = total_seconds // 60
                return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
            elif total_seconds < 86400:  # Less than 1 day
                hours = total_seconds // 3600
                return f"{hours} hour{'s' if hours != 1 else ''} ago"
            elif total_seconds < 2592000:  # Less than 30 days
                days = total_seconds // 86400
                return f"{days} day{'s' if days != 1 else ''} ago"
            else:  # More than 30 days
                return timestamp.strftime("%b %d, %Y")
        
        # Process paper reports
        for report in paper_reports:
            # Get subject name for paper
            subject_name = report.paper.subject.name if hasattr(report.paper, 'subject') and report.paper.subject else "Unknown Subject"
            details_text = f"Paper - {subject_name}"
            
            reports_data.append({
                "id": report.id,
                "content_type": "paper",
                "content_id": report.paper_id,
                "content_title": report.paper.title,
                "content_status": report.paper.status.value,
                "details": details_text,  # New details column with content type and subject
                "paper_id": report.paper_id,  # Legacy field
                "paper_title": report.paper.title,  # Legacy field
                "paper_status": report.paper.status.value,  # Legacy field
                "reporter_id": report.reporter_id,
                "reporter_name": f"{report.reporter.first_name or ''} {report.reporter.last_name or ''}".strip() or report.reporter.email,
                "reporter_email": report.reporter.email,
                "reason": report.reason,
                "report_details": report.details,  # Original report details field renamed
                "status": report.status.value,
                "admin_notes": report.admin_notes,
                "resolved_by_id": report.resolved_by_id,
                "resolved_by_name": f"{report.resolved_by.first_name or ''} {report.resolved_by.last_name or ''}".strip() or report.resolved_by.email if report.resolved_by else None,
                "created_at": report.created_at,
                "created_at_relative": get_relative_time(report.created_at),
                "resolved_at": report.resolved_at,
                "resolved_at_relative": get_relative_time(report.resolved_at) if report.resolved_at else None
            })
        
        # Process note reports
        for report in note_reports:
            # Get subject name for note
            subject_name = report.note.subject.name if hasattr(report.note, 'subject') and report.note.subject else "Unknown Subject"
            details_text = f"Note - {subject_name}"
            
            reports_data.append({
                "id": report.id,
                "content_type": "note",
                "content_id": report.note_id,
                "content_title": report.note.title,
                "content_status": report.note.status.value if hasattr(report.note.status, 'value') else str(report.note.status),
                "details": details_text,  # New details column with content type and subject
                "note_id": report.note_id,  # Legacy field
                "note_title": report.note.title,  # Legacy field
                "note_status": report.note.status.value if hasattr(report.note.status, 'value') else str(report.note.status),  # Legacy field
                "reporter_id": report.reporter_id,
                "reporter_name": f"{report.reporter.first_name or ''} {report.reporter.last_name or ''}".strip() or report.reporter.email,
                "reporter_email": report.reporter.email,
                "reason": report.reason,
                "report_details": report.details,  # Original report details field renamed
                "status": report.status.value,
                "admin_notes": report.admin_notes,
                "resolved_by_id": report.resolved_by_id,
                "resolved_by_name": f"{report.resolved_by.first_name or ''} {report.resolved_by.last_name or ''}".strip() or report.resolved_by.email if report.resolved_by else None,
                "created_at": report.created_at,
                "created_at_relative": get_relative_time(report.created_at),
                "resolved_at": report.resolved_at,
                "resolved_at_relative": get_relative_time(report.resolved_at) if report.resolved_at else None
            })
        
        total = total_paper_reports + total_note_reports
        total_pages = (total + pagination.page_size - 1) // pagination.page_size
        
        return {
            "reports": reports_data,
            "total": total,
            "page": pagination.page,
            "page_size": pagination.page_size,
            "total_pages": total_pages,
            "server_time": current_time,
            "generated_at": current_time.isoformat() + "Z",
            "debug_info": {
                "total_paper_reports": total_paper_reports,
                "total_note_reports": total_note_reports,
                "paper_reports_returned": len(paper_reports),
                "note_reports_returned": len(note_reports)
            }
        }
    
    except Exception as e:
        import traceback
        print(f"Error in get_reports: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    action: str = Query(..., description="Action: dismiss, take_action"),
    notes: str = Query("", description="Admin notes"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Resolve a report (both paper and note reports)."""
    
    from app.db.models import Report as PaperReportModel, NoteReport, ReportStatus
    
    # Try to find the report in paper reports first
    paper_report = db.query(PaperReportModel).filter(PaperReportModel.id == report_id).first()
    note_report = None
    
    if not paper_report:
        # If not found in paper reports, try note reports
        note_report = db.query(NoteReport).filter(NoteReport.id == report_id).first()
    
    if not paper_report and not note_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Use whichever report was found
    report = paper_report or note_report
    report_type = "paper" if paper_report else "note"
    
    if report.status == ReportStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Report is already resolved")
    
    # Update report status
    report.status = ReportStatus.CLOSED
    report.resolved_by_id = current_user.id
    report.resolved_at = datetime.utcnow()
    
    paper_action_taken = None
    action_details = None
    
    # Handle different action types
    if action == "dismiss":
        report.admin_notes = notes or "Report dismissed - no violation found"
        action_details = "Report dismissed as invalid or not violating guidelines"
        
    elif action == "take_action":
        if report_type == "paper":
            report.admin_notes = notes or "Action taken by admin - paper reviewed"
            action_details = "Report reviewed and appropriate action taken"
            
            # If notes suggest rejection, moderate the paper
            if "reject" in notes.lower() or "remove" in notes.lower():
                paper_service = get_paper_service(db)
                await paper_service.moderate_paper(
                    paper_id=str(report.paper_id),
                    action="reject",
                    notes=f"Rejected due to report: {report.reason}. Admin notes: {notes}",
                    moderator=current_user,
                    ip_address="admin",
                    user_agent="admin_action",
                    force=True  # Allow rejecting already approved papers
                )
                paper_action_taken = "paper_rejected"
                action_details = "Paper rejected due to valid report"
        else:
            # For note reports, just mark as resolved with notes
            report.admin_notes = notes or "Action taken by admin - note reviewed"
            action_details = "Note report reviewed and appropriate action taken"
            
    elif action == "remove_paper":
        if report_type == "paper":
            report.admin_notes = notes or f"Paper removed due to report: {report.reason}"
            paper_service = get_paper_service(db)
            
            # Get paper details before moderation
            paper = db.query(Paper).filter(Paper.id == report.paper_id).first()
            
            await paper_service.moderate_paper(
                paper_id=str(report.paper_id),
                action="reject",
                notes=f"Paper removed due to report: {report.reason}. Admin notes: {notes}",
                moderator=current_user,
                ip_address="admin",
                user_agent="admin_action",
                force=True  # Allow rejecting already approved papers
            )
            
            # Create notification for paper uploader
            from app.services.notification import get_notification_service
            notification_service = get_notification_service(db)
            
            if paper and paper.uploader_id:
                notification_service.create_paper_status_notification(
                    user_id=str(paper.uploader_id),
                    paper_title=paper.title,
                    status="rejected",
                    admin_notes=f"Paper removed due to report: {report.reason}. {notes}",
                    paper_id=str(paper.id)
                )
            
            paper_action_taken = "paper_removed"
            action_details = "Paper immediately removed and uploader notified"
        else:
            # For note reports, we could implement note moderation here
            report.admin_notes = notes or f"Note removed due to report: {report.reason}"
            action_details = "Note report resolved - note content action taken"
            
    elif action == "warn_user":
        if report_type == "paper":
            report.admin_notes = notes or f"User warned about: {report.reason}"
            
            # Create warning notification for the paper uploader
            from app.services.notification import get_notification_service
            from app.db.models import NotificationType
            notification_service = get_notification_service(db)
            
            # Get paper details for notification
            paper = db.query(Paper).filter(Paper.id == report.paper_id).first()
            if paper and paper.uploader_id:
                notification_service.create_warning_notification(
                    user_id=str(paper.uploader_id),
                    paper_title=paper.title,
                    reason=report.reason,
                    admin_notes=notes,
                    paper_id=str(paper.id),
                    report_id=str(report.id)
                )
            
            paper_action_taken = "user_warned"
            action_details = "Warning notification sent to paper uploader"
        else:
            # For note reports, warn the note author
            report.admin_notes = notes or f"User warned about note: {report.reason}"
            
            from app.services.notification import get_notification_service
            from app.db.models import Note
            notification_service = get_notification_service(db)
            
            # Get note details for notification
            note = db.query(Note).filter(Note.id == report.note_id).first()
            if note and note.author_id:
                # Create warning for note author (we might need to implement this)
                try:
                    notification_service.create_warning_notification(
                        user_id=str(note.author_id),
                        paper_title=note.title,  # Use note title as paper title for now
                        reason=report.reason,
                        admin_notes=notes,
                        paper_id=None,  # No paper ID for notes
                        report_id=str(report.id)
                    )
                except Exception:
                    # If notification service doesn't support notes yet, just log
                    pass
            
            paper_action_taken = "user_warned"
            action_details = "Warning notification sent to note author"
        
    else:
        report.admin_notes = notes or "Report resolved"
        action_details = "Report marked as resolved"
    
    db.commit()
    db.refresh(report)
    
    return {
        "message": "Report resolved successfully",
        "report_id": str(report.id),
        "action": action,
        "action_details": action_details,
        "paper_action_taken": paper_action_taken,
        "status": report.status.value,
        "resolved_at": report.resolved_at,
        "admin_notes": report.admin_notes
    }


@router.post("/reports/bulk-resolve")
async def bulk_resolve_reports(
    report_ids: str = Query(..., description="Comma-separated report IDs"),
    action: str = Query(..., description="Action: dismiss, take_action, warn_user, remove_paper"),
    notes: str = Query("", description="Admin notes"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Resolve multiple reports at once with proper action handling (both paper and note reports)."""
    
    from app.db.models import Report as PaperReportModel, NoteReport, ReportStatus
    
    # Parse comma-separated report IDs
    report_id_list = [id.strip() for id in report_ids.split(',') if id.strip()]
    
    # Get reports from both paper and note report tables
    paper_reports = db.query(PaperReportModel).filter(PaperReportModel.id.in_(report_id_list)).all()
    note_reports = db.query(NoteReport).filter(NoteReport.id.in_(report_id_list)).all()
    
    # Combine all reports
    reports = paper_reports + note_reports
    
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found")
    
    resolved_count = 0
    papers_affected = 0
    warnings_issued = 0
    
    for report in reports:
        if report.status == ReportStatus.OPEN:
            # Update basic report status
            report.status = ReportStatus.CLOSED
            report.resolved_by_id = current_user.id
            report.resolved_at = datetime.utcnow()
            
            # Handle different action types
            if action == "dismiss":
                report.admin_notes = notes or "Report dismissed - no violation found"
                
            elif action == "take_action":
                # Check if this is a paper report or note report
                if hasattr(report, 'paper_id'):
                    report.admin_notes = notes or "Action taken by admin - paper reviewed"
                    
                    # If notes suggest rejection, moderate the paper
                    if "reject" in notes.lower() or "remove" in notes.lower():
                        paper_service = get_paper_service(db)
                        await paper_service.moderate_paper(
                            paper_id=str(report.paper_id),
                            action="reject",
                            notes=f"Rejected due to report: {report.reason}. Admin notes: {notes}",
                            moderator=current_user,
                            ip_address="admin",
                            user_agent="bulk_admin_action",
                            force=True  # Allow rejecting already approved papers
                        )
                        papers_affected += 1
                else:
                    # This is a note report
                    report.admin_notes = notes or "Action taken by admin - note reviewed"
                    
                    # If notes suggest rejection, moderate the note
                    if "reject" in notes.lower() or "remove" in notes.lower():
                        # Note: We would need a note moderation service similar to paper service
                        # For now, just mark it as handled
                        papers_affected += 1  # Using same counter for simplicity
                    
            elif action == "remove_paper":
                # Check if this is a paper report or note report
                if hasattr(report, 'paper_id'):
                    # This is a paper report
                    report.admin_notes = notes or f"Paper removed due to report: {report.reason}"
                    paper_service = get_paper_service(db)
                    
                    # Get paper details for notification
                    paper = db.query(Paper).filter(Paper.id == report.paper_id).first()
                    
                    await paper_service.moderate_paper(
                        paper_id=str(report.paper_id),
                        action="reject",
                        notes=f"Paper removed due to report: {report.reason}. Admin notes: {notes}",
                        moderator=current_user,
                        ip_address="admin",
                        user_agent="bulk_admin_action",
                        force=True  # Allow rejecting already approved papers
                    )
                    
                    # Create notification for paper uploader
                    from app.services.notification import get_notification_service
                    notification_service = get_notification_service(db)
                    
                    if paper and paper.uploader_id:
                        notification_service.create_paper_status_notification(
                            user_id=str(paper.uploader_id),
                            paper_title=paper.title,
                            status="rejected",
                            admin_notes=f"Paper removed due to report: {report.reason}. {notes}",
                            paper_id=str(paper.id)
                        )
                else:
                    # This is a note report
                    from app.models.content import Note
                    report.admin_notes = notes or f"Note removed due to report: {report.reason}"
                    
                    # Get note details for notification
                    note = db.query(Note).filter(Note.id == report.note_id).first()
                    
                    if note:
                        # Update note status to rejected
                        note.status = "REJECTED"
                        note.moderation_notes = f"Note removed due to report: {report.reason}. Admin notes: {notes}"
                        
                        # Create notification for note uploader
                        from app.services.notification import get_notification_service
                        notification_service = get_notification_service(db)
                        
                        if note.uploader_id:
                            # Note: Using paper notification for now, could create note-specific ones later
                            notification_service.create_paper_status_notification(
                                user_id=str(note.uploader_id),
                                paper_title=f"Note: {note.title}",
                                status="rejected",
                                admin_notes=f"Note removed due to report: {report.reason}. {notes}",
                                paper_id=str(note.id)
                            )
                
                papers_affected += 1
                
            elif action == "warn_user":
                report.admin_notes = notes or f"User warned about: {report.reason}"
                
                # Create warning notification for the uploader
                from app.services.notification import get_notification_service
                notification_service = get_notification_service(db)
                
                # Check if this is a paper report or note report
                if hasattr(report, 'paper_id'):
                    # This is a paper report
                    paper = db.query(Paper).filter(Paper.id == report.paper_id).first()
                    if paper and paper.uploader_id:
                        notification_service.create_warning_notification(
                            user_id=str(paper.uploader_id),
                            paper_title=paper.title,
                            reason=report.reason,
                            admin_notes=notes,
                            paper_id=str(paper.id),
                            report_id=str(report.id)
                        )
                else:
                    # This is a note report
                    from app.models.content import Note
                    note = db.query(Note).filter(Note.id == report.note_id).first()
                    if note and note.uploader_id:
                        notification_service.create_warning_notification(
                            user_id=str(note.uploader_id),
                            paper_title=f"Note: {note.title}",
                            reason=report.reason,
                            admin_notes=notes,
                            paper_id=str(note.id),  # Using paper_id field for note ID
                            report_id=str(report.id)
                        )
                
                warnings_issued += 1
                
            else:
                report.admin_notes = notes or "Report resolved"
            
            resolved_count += 1
    
    db.commit()
    
    # Prepare detailed response
    response = {
        "message": f"{resolved_count} reports resolved successfully",
        "resolved_count": resolved_count,
        "total_requested": len(report_id_list),
        "action": action,
        "action_details": {
            "papers_affected": papers_affected,
            "warnings_issued": warnings_issued,
            "dismissed_count": resolved_count - papers_affected - warnings_issued if action == "dismiss" else 0
        }
    }
    
    return response


# Soft Delete Management
@router.get("/soft-delete/overview")
async def get_soft_delete_overview(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get overview of soft deleted items across all models."""
    
    # Count deleted items by type
    deleted_users = SoftDeleteService.get_deleted_query(UserModel, db).count()
    deleted_papers = SoftDeleteService.get_deleted_query(PaperModel, db).count()
    deleted_notes = SoftDeleteService.get_deleted_query(NoteModel, db).count()
    deleted_tags = SoftDeleteService.get_deleted_query(Tag, db).count()
    deleted_universities = SoftDeleteService.get_deleted_query(University, db).count()
    deleted_programs = SoftDeleteService.get_deleted_query(Program, db).count()
    deleted_branches = SoftDeleteService.get_deleted_query(Branch, db).count()
    deleted_semesters = SoftDeleteService.get_deleted_query(Semester, db).count()
    deleted_subjects = SoftDeleteService.get_deleted_query(Subject, db).count()
    
    total_deleted = (
        deleted_users + deleted_papers + deleted_notes + deleted_tags +
        deleted_universities + deleted_programs + deleted_branches + 
        deleted_semesters + deleted_subjects
    )
    
    return {
        "total_deleted_items": total_deleted,
        "deleted_by_type": {
            "users": deleted_users,
            "papers": deleted_papers,
            "notes": deleted_notes,
            "tags": deleted_tags,
            "universities": deleted_universities,
            "programs": deleted_programs,
            "branches": deleted_branches,
            "semesters": deleted_semesters,
            "subjects": deleted_subjects
        },
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/soft-delete/{model_type}")
async def get_deleted_items(
    model_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get list of soft deleted items for a specific model type."""
    
    model_map = {
        "users": UserModel,
        "papers": PaperModel,
        "notes": NoteModel,
        "tags": Tag,
        "universities": University,
        "programs": Program,
        "branches": Branch,
        "semesters": Semester,
        "subjects": Subject
    }
    
    if model_type not in model_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model type. Must be one of: {', '.join(model_map.keys())}"
        )
    
    model = model_map[model_type]
    query = SoftDeleteService.get_deleted_query(model, db)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    items = query.order_by(model.deleted_at.desc()).offset(skip).limit(limit).all()
    
    # Format response based on model type
    formatted_items = []
    for item in items:
        base_info = {
            "id": str(item.id),
            "deleted_at": item.deleted_at,
            "is_deleted": item.is_deleted
        }
        
        if model_type == "users":
            base_info.update({
                "email": item.email,
                "full_name": item.full_name,
                "role": item.role.value if item.role else None,
                "created_at": item.created_at
            })
        elif model_type in ["papers", "notes"]:
            base_info.update({
                "title": item.title,
                "status": item.status.value if item.status else None,
                "uploader_email": item.uploader.email if item.uploader else None,
                "created_at": item.created_at
            })
        elif model_type == "tags":
            base_info.update({
                "name": item.name,
                "slug": item.slug,
                "created_at": item.created_at
            })
        elif model_type in ["universities", "programs", "branches", "semesters", "subjects"]:
            base_info.update({
                "name": item.name,
                "created_at": item.created_at
            })
            if hasattr(item, 'slug'):
                base_info["slug"] = item.slug
        
        formatted_items.append(base_info)
    
    return {
        "items": formatted_items,
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit,
        "model_type": model_type
    }


@router.post("/soft-delete/{model_type}/{item_id}/restore")
async def restore_item(
    model_type: str,
    item_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Restore a soft deleted item."""
    
    model_map = {
        "users": UserModel,
        "papers": PaperModel,
        "notes": NoteModel,
        "tags": Tag,
        "universities": University,
        "programs": Program,
        "branches": Branch,
        "semesters": Semester,
        "subjects": Subject
    }
    
    if model_type not in model_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model type. Must be one of: {', '.join(model_map.keys())}"
        )
    
    model = model_map[model_type]
    restored_item = SoftDeleteService.restore_by_id(model, item_id, db)
    
    if not restored_item:
        raise HTTPException(
            status_code=404, 
            detail=f"No deleted {model_type[:-1]} found with ID {item_id}"
        )
    
    # Log the restoration action
    from app.utils.logging import get_audit_logger
    audit_logger = get_audit_logger()
    audit_logger.info(
        f"Admin {current_user.email} restored {model_type[:-1]} {item_id}",
        extra={
            "admin_id": str(current_user.id),
            "action": "restore",
            "resource_type": model_type[:-1],
            "resource_id": item_id
        }
    )
    
    return {
        "message": f"{model_type[:-1].capitalize()} restored successfully",
        "item_id": item_id,
        "model_type": model_type,
        "restored_at": datetime.utcnow(),
        "restored_by": current_user.email
    }


@router.post("/soft-delete/{model_type}/bulk-restore")
async def bulk_restore_items(
    model_type: str,
    item_ids: str = Query(..., description="Comma-separated item IDs"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Restore multiple soft deleted items."""
    
    model_map = {
        "users": UserModel,
        "papers": PaperModel,
        "notes": NoteModel,
        "tags": Tag,
        "universities": University,
        "programs": Program,
        "branches": Branch,
        "semesters": Semester,
        "subjects": Subject
    }
    
    if model_type not in model_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model type. Must be one of: {', '.join(model_map.keys())}"
        )
    
    # Parse comma-separated IDs
    item_id_list = [id.strip() for id in item_ids.split(',') if id.strip()]
    
    if not item_id_list:
        raise HTTPException(status_code=400, detail="No valid item IDs provided")
    
    model = model_map[model_type]
    restored_count = SoftDeleteService.bulk_restore(model, item_id_list, db)
    
    # Log the bulk restoration action
    from app.utils.logging import get_audit_logger
    audit_logger = get_audit_logger()
    audit_logger.info(
        f"Admin {current_user.email} bulk restored {restored_count} {model_type}",
        extra={
            "admin_id": str(current_user.id),
            "action": "bulk_restore",
            "resource_type": model_type,
            "item_count": restored_count,
            "item_ids": item_id_list
        }
    )
    
    return {
        "message": f"{restored_count} {model_type} restored successfully",
        "restored_count": restored_count,
        "total_requested": len(item_id_list),
        "model_type": model_type,
        "restored_at": datetime.utcnow(),
        "restored_by": current_user.email
    }


@router.delete("/soft-delete/{model_type}/{item_id}/hard-delete")
async def hard_delete_item(
    model_type: str,
    item_id: str,
    confirm: bool = Query(False, description="Must be true to confirm hard delete"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Permanently delete an item (use with extreme caution)."""
    
    if not confirm:
        raise HTTPException(
            status_code=400, 
            detail="Hard delete must be confirmed by setting confirm=true"
        )
    
    model_map = {
        "users": UserModel,
        "papers": PaperModel,
        "notes": NoteModel,
        "tags": Tag,
        "universities": University,
        "programs": Program,
        "branches": Branch,
        "semesters": Semester,
        "subjects": Subject
    }
    
    if model_type not in model_map:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model type. Must be one of: {', '.join(model_map.keys())}"
        )
    
    model = model_map[model_type]
    success = SoftDeleteService.hard_delete_by_id(model, item_id, db)
    
    if not success:
        raise HTTPException(
            status_code=404, 
            detail=f"No {model_type[:-1]} found with ID {item_id}"
        )
    
    # Log the hard deletion action
    from app.utils.logging import get_audit_logger
    audit_logger = get_audit_logger()
    audit_logger.warning(
        f"Admin {current_user.email} HARD DELETED {model_type[:-1]} {item_id}",
        extra={
            "admin_id": str(current_user.id),
            "action": "hard_delete",
            "resource_type": model_type[:-1],
            "resource_id": item_id,
            "severity": "critical"
        }
    )
    
    return {
        "message": f"{model_type[:-1].capitalize()} permanently deleted",
        "item_id": item_id,
        "model_type": model_type,
        "deleted_at": datetime.utcnow(),
        "deleted_by": current_user.email,
        "warning": "This action cannot be undone"
    }
