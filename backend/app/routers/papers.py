from fastapi import APIRouter, Depends, status, Request, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import get_db
from app.deps import (
    get_current_active_user, get_current_admin_user, get_current_user_optional,
    get_request_ip, get_request_metadata, get_pagination_params, PaginationParams
)
from app.schemas.paper import (
    PaperCreate, PaperUpdate, Paper, PaperWithTaxonomy, PaperListResponse, PaperSearchFilters,
    PaperModerationAction, BookmarkCreate, Bookmark, ReportCreate, ReportRequest, Report,
    RatingCreate, RatingRequest, RatingUpdate, Rating, FilterOptions, FilterOption
)
from app.schemas.user import User
from app.services.paper import get_paper_service
from app.services.storage import storage_service
from app.utils.errors import ValidationError

router = APIRouter()


@router.post("/", response_model=Paper, status_code=status.HTTP_201_CREATED)
async def create_paper(
    paper_data: PaperCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new paper."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    # Get paper service
    paper_service = get_paper_service(db)
    
    # Create paper
    paper = await paper_service.create_paper(
        paper_data=paper_data,
        uploader=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return paper


@router.get("/", response_model=PaperListResponse)
async def search_papers(
    request: Request,
    # Search filters
    university_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    exam_year: Optional[int] = Query(None),
    tags: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    uploaded_by: Optional[str] = Query(None),  # New parameter for "My Papers"
    # Additional filter parameters
    academic_level: Optional[str] = Query(None, description="Filter by academic level: undergraduate, graduate"),
    content_type: Optional[str] = Query(None, description="Filter by content type: exams, notes, etc."),
    upload_date_range: Optional[str] = Query(None, description="Filter by upload date: 1day, 1week, 1month, 3months"),
    university: Optional[str] = Query(None, description="Filter by university slug/name"),
    subject: Optional[str] = Query(None, description="Filter by subject slug/name"),
    sort: Optional[str] = Query("created_at", description="Sort by: created_at, download_count, exam_year, title, rating"),
    order: Optional[str] = Query("desc"),
    # Pagination
    pagination: PaginationParams = Depends(get_pagination_params),
    # User context
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Search and filter papers."""
    
    # Build search filters
    filters = PaperSearchFilters(
        university_id=university_id,
        program_id=program_id,
        branch_id=branch_id,
        semester_id=semester_id,
        subject_id=subject_id,
        exam_year=exam_year,
        tags=tags,
        search=search,
        status=status,
        uploaded_by=uploaded_by,
        # New filter parameters
        academic_level=academic_level,
        content_type=content_type,
        upload_date_range=upload_date_range,
        university=university,
        subject=subject,
        sort=sort,
        order=order
    )
    
    # Get paper service
    paper_service = get_paper_service(db)
    
    # Search papers
    results = paper_service.search_papers(
        filters=filters,
        page=pagination.page,
        page_size=pagination.page_size,
        user=current_user
    )
    
    return results


@router.get("/filter-options", response_model=FilterOptions)
async def get_filter_options(
    db: Session = Depends(get_db),
):
    """Get all available filter options with counts for both papers and notes."""
    
    from app.db.models import Paper, Note, University, Subject, PaperStatus, NoteStatus
    from sqlalchemy import func, distinct, text
    from datetime import datetime, timedelta
    
    # Only count approved papers and notes for filter options
    approved_papers = db.query(Paper).filter(Paper.status == PaperStatus.APPROVED)
    approved_notes = db.query(Note).filter(Note.status == NoteStatus.APPROVED)
    
    # Get universities with paper counts using proper joins
    from app.db.models import Program, Branch, Semester
    
    university_counts = (
        db.query(
            University.name,
            University.slug,
            func.count(distinct(Paper.id)).label("count")
        )
        .join(Program, University.id == Program.university_id)
        .join(Branch, Program.id == Branch.program_id)
        .join(Semester, Branch.id == Semester.branch_id)
        .join(Subject, Semester.id == Subject.semester_id)
        .join(Paper, Subject.id == Paper.subject_id)
        .filter(Paper.status == PaperStatus.APPROVED)
        .group_by(University.id, University.name, University.slug)
        .having(func.count(distinct(Paper.id)) > 0)
        .order_by(func.count(distinct(Paper.id)).desc())
        .all()
    )
    
    universities = [
        FilterOption(
            value=univ.slug or univ.name.lower().replace(" ", "-"),
            label=univ.name,
            count=univ.count
        )
        for univ in university_counts
    ]
    
    # Get subjects with paper counts
    subject_counts = (
        db.query(
            Subject.name,
            Subject.slug,
            func.count(Paper.id).label("count")
        )
        .join(Paper, Subject.id == Paper.subject_id)
        .filter(Paper.status == PaperStatus.APPROVED)
        .group_by(Subject.id, Subject.name, Subject.slug)
        .having(func.count(Paper.id) > 0)
        .all()
    )
    
    subjects = [
        FilterOption(
            value=subject.slug or subject.name.lower().replace(" ", "-"),
            label=subject.name,
            count=subject.count
        )
        for subject in subject_counts
    ]
    
    # Get academic levels with paper counts (based on program duration/type)
    # This is a simplified version - you might want to add actual academic level fields
    academic_levels = [
        FilterOption(value="undergraduate", label="Undergraduate", count=approved_papers.count() // 2),
        FilterOption(value="graduate", label="Graduate", count=approved_papers.count() // 3)
    ]
    
    # Content types - include both papers and notes
    total_papers = approved_papers.count()
    total_notes = approved_notes.count()
    content_types = [
        FilterOption(value="exams", label="Past Exams", count=total_papers),
        FilterOption(value="notes", label="Study Notes", count=total_notes),
    ]
    
    # Upload date ranges
    now = datetime.utcnow()
    upload_date_ranges = [
        FilterOption(
            value="1day",
            label="Last 24 hours",
            count=approved_papers.filter(Paper.created_at >= now - timedelta(days=1)).count()
        ),
        FilterOption(
            value="1week",
            label="Last week",
            count=approved_papers.filter(Paper.created_at >= now - timedelta(days=7)).count()
        ),
        FilterOption(
            value="1month",
            label="Last month",
            count=approved_papers.filter(Paper.created_at >= now - timedelta(days=30)).count()
        ),
        FilterOption(
            value="3months",
            label="Last 3 months",
            count=approved_papers.filter(Paper.created_at >= now - timedelta(days=90)).count()
        ),
    ]
    
    # Get exam years with counts
    exam_year_counts = (
        db.query(
            Paper.exam_year,
            func.count(Paper.id).label("count")
        )
        .filter(Paper.status == PaperStatus.APPROVED)
        .group_by(Paper.exam_year)
        .order_by(Paper.exam_year.desc())
        .all()
    )
    
    exam_years = [
        FilterOption(
            value=str(year.exam_year),
            label=str(year.exam_year),
            count=year.count
        )
        for year in exam_year_counts
    ]
    
    return FilterOptions(
        universities=universities,
        subjects=subjects,
        academic_levels=academic_levels,
        content_types=content_types,
        upload_date_ranges=upload_date_ranges,
        exam_years=exam_years
    )


@router.get("/{paper_id}", response_model=Paper)
async def get_paper(
    paper_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get a single paper by ID."""
    
    paper_service = get_paper_service(db)
    paper = paper_service.get_paper(paper_id, user=current_user)
    
    return paper


@router.put("/{paper_id}", response_model=Paper)
async def update_paper(
    paper_id: str,
    paper_data: PaperUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a paper."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    paper = await paper_service.update_paper(
        paper_id=paper_id,
        paper_data=paper_data,
        user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return paper


@router.delete("/{paper_id}")
async def delete_paper(
    paper_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a paper."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    success = await paper_service.delete_paper(
        paper_id=paper_id,
        user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {
        "message": "Paper deleted successfully",
        "success": success
    }


@router.post("/{paper_id}/moderate", response_model=Paper)
async def moderate_paper(
    paper_id: str,
    moderation_action: PaperModerationAction,
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Moderate a paper (approve or reject) - Admin only."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    paper = await paper_service.moderate_paper(
        paper_id=paper_id,
        action=moderation_action.action,
        notes=moderation_action.notes,
        moderator=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return paper


@router.post("/{paper_id}/download")
async def download_paper(
    paper_id: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get download URL for a paper."""
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    download_url = await paper_service.download_paper(
        paper_id=paper_id,
        user=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {
        "download_url": download_url,
        "expires_in": 300  # 5 minutes
    }


@router.post("/{paper_id}/bookmark", response_model=dict)
async def toggle_bookmark(
    paper_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Add or remove bookmark for a paper."""
    
    paper_service = get_paper_service(db)
    bookmark_data = BookmarkCreate(paper_id=paper_id)
    
    bookmark = await paper_service.bookmark_paper(
        bookmark_data=bookmark_data,
        user=current_user
    )
    
    if bookmark:
        return {
            "message": "Paper bookmarked",
            "bookmarked": True,
            "bookmark_id": str(bookmark.id)
        }
    else:
        return {
            "message": "Bookmark removed",
            "bookmarked": False
        }


@router.get("/bookmarks/", response_model=PaperListResponse)
async def get_user_bookmarks(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get user's bookmarked papers."""
    
    paper_service = get_paper_service(db)
    bookmarks = paper_service.get_user_bookmarks(
        user=current_user,
        page=pagination.page,
        page_size=pagination.page_size
    )
    
    return bookmarks


@router.post("/{paper_id}/report", response_model=Report, status_code=status.HTTP_201_CREATED)
async def report_paper(
    paper_id: str,
    report_request: ReportRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Report a paper for issues."""
    
    # Create ReportCreate with paper_id from URL
    report_data = ReportCreate(
        paper_id=paper_id,
        reason=report_request.reason,
        details=report_request.details
    )
    
    # Get request metadata
    ip_address = get_request_ip(request)
    metadata = get_request_metadata(request)
    user_agent = metadata.get("user_agent", "")
    
    paper_service = get_paper_service(db)
    report = await paper_service.report_paper(
        report_data=report_data,
        reporter=current_user,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return report


@router.get("/stats/overview")
async def get_papers_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get paper statistics (admin only)."""
    
    from app.db.models import Paper, PaperStatus
    from sqlalchemy import func
    
    # Get paper counts by status
    stats = {
        "total": db.query(Paper).count(),
        "pending": db.query(Paper).filter(Paper.status == PaperStatus.PENDING).count(),
        "approved": db.query(Paper).filter(Paper.status == PaperStatus.APPROVED).count(),
        "rejected": db.query(Paper).filter(Paper.status == PaperStatus.REJECTED).count(),
    }
    
    # Get download stats
    download_stats = db.query(func.sum(Paper.download_count)).scalar() or 0
    view_stats = db.query(func.sum(Paper.view_count)).scalar() or 0
    
    stats.update({
        "total_downloads": download_stats,
        "total_views": view_stats,
    })
    
    # Get recent activity (papers uploaded in last 7 days)
    from datetime import datetime, timedelta
    recent_cutoff = datetime.utcnow() - timedelta(days=7)
    recent_uploads = db.query(Paper).filter(Paper.created_at >= recent_cutoff).count()
    
    stats["recent_uploads"] = recent_uploads
    
    return stats


@router.get("/pending/", response_model=PaperListResponse)
async def get_pending_papers(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get pending papers for moderation (admin only)."""
    
    from app.db.models import PaperStatus
    filters = PaperSearchFilters(status=PaperStatus.PENDING, sort="created_at", order="asc")
    
    paper_service = get_paper_service(db)
    results = paper_service.search_papers(
        filters=filters,
        page=pagination.page,
        page_size=pagination.page_size,
        user=current_user
    )
    
    return results


@router.post("/{paper_id}/rate", response_model=dict)
async def rate_paper(
    paper_id: str,
    rating_request: RatingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Rate a paper."""
    
    # Create RatingCreate with paper_id from URL
    rating_data = RatingCreate(
        paper_id=paper_id,
        rating=rating_request.rating
    )
    
    paper_service = get_paper_service(db)
    rating = await paper_service.rate_paper(
        rating_data=rating_data,
        user=current_user
    )
    
    # Get updated rating stats for the paper
    rating_stats = paper_service.get_paper_rating_stats(paper_id)
    
    return {
        "message": "Paper rated successfully",
        "rating": rating.rating,
        "rating_id": str(rating.id),
        "average_rating": rating_stats["average_rating"],
        "total_ratings": rating_stats["total_ratings"]
    }


@router.put("/ratings/{rating_id}", response_model=dict)
async def update_rating(
    rating_id: str,
    rating_data: RatingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update an existing rating."""
    
    paper_service = get_paper_service(db)
    rating = await paper_service.update_rating(
        rating_id=rating_id,
        rating_data=rating_data,
        user=current_user
    )
    
    # Get updated rating stats for the paper
    rating_stats = paper_service.get_paper_rating_stats(str(rating.paper_id))
    
    return {
        "message": "Rating updated successfully",
        "rating": rating.rating,
        "rating_id": str(rating.id),
        "average_rating": rating_stats["average_rating"],
        "total_ratings": rating_stats["total_ratings"]
    }


@router.delete("/ratings/{rating_id}")
async def delete_rating(
    rating_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a rating."""
    
    # First get the rating to know which paper it belongs to
    from app.db.models import Rating
    rating = db.query(Rating).filter(
        Rating.id == rating_id,
        Rating.user_id == current_user.id
    ).first()
    
    if not rating:
        from app.utils.errors import ValidationError
        raise ValidationError(detail="Rating not found or you don't have permission to delete it")
    
    paper_id = str(rating.paper_id)
    
    paper_service = get_paper_service(db)
    success = await paper_service.delete_rating(
        rating_id=rating_id,
        user=current_user
    )
    
    # Get updated rating stats
    rating_stats = paper_service.get_paper_rating_stats(paper_id)
    
    return {
        "message": "Rating deleted successfully",
        "success": success,
        "average_rating": rating_stats["average_rating"],
        "total_ratings": rating_stats["total_ratings"]
    }




@router.get("/{paper_id}/rating-stats")
async def get_paper_rating_stats(
    paper_id: str,
    db: Session = Depends(get_db),
):
    """Get rating statistics for a paper."""
    
    paper_service = get_paper_service(db)
    stats = paper_service.get_paper_rating_stats(paper_id)
    
    return stats
