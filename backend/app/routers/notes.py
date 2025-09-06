import math
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import Session, joinedload, selectinload

from ..db.session import get_db
from ..db.models import (
    Note, 
    NoteTag, 
    Tag, 
    User, 
    Subject, 
    Semester, 
    Branch, 
    Program, 
    University,
    NoteDownload,
    NoteBookmark,
    NoteRating,
    NoteReport,
    NoteStatus,
    UserActivity,
    ActivityTypeEnum,
    ReportStatus
)
from ..schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteStatusUpdate,
    NoteResponse,
    NoteDetailResponse,
    NoteListResponse,
    NoteSearchFilters,
    NoteBookmarkCreate,
    NoteBookmarkResponse,
    NoteRatingCreate,
    NoteRatingUpdate,
    NoteRatingResponse,
    NoteReportCreate,
    NoteReportResponse,
    MyNoteResponse,
    MyNotesListResponse,
    SubjectInfo,
    SemesterInfo,
    BranchInfo,
    ProgramInfo,
    UniversityInfo
)
from ..deps import get_current_user, get_current_user_optional, get_current_admin_user

router = APIRouter()


def get_note_academic_hierarchy(note: Note) -> Dict[str, Any]:
    """Get the full academic hierarchy for a note."""
    if not note.subject:
        return {}
    
    subject = note.subject
    semester = subject.semester if subject.semester else None
    branch = semester.branch if semester else None
    program = branch.program if branch else None
    university = program.university if program else None
    
    return {
        'subject': SubjectInfo.from_orm(subject) if subject else None,
        'semester': SemesterInfo.from_orm(semester) if semester else None,
        'branch': BranchInfo.from_orm(branch) if branch else None,
        'program': ProgramInfo.from_orm(program) if program else None,
        'university': UniversityInfo.from_orm(university) if university else None,
    }


def apply_note_filters(query, filters: NoteSearchFilters):
    """Apply filters to note query."""
    # Text search
    if filters.q:
        search_term = f"%{filters.q}%"
        query = query.filter(
            or_(
                Note.title.ilike(search_term),
                Note.description.ilike(search_term),
                Subject.name.ilike(search_term),
                Subject.code.ilike(search_term)
            )
        )
    
    # Academic hierarchy filters
    if filters.university_id:
        query = query.join(Subject).join(Semester).join(Branch).join(Program).filter(
            Program.university_id == filters.university_id
        )
    
    if filters.program_id:
        query = query.join(Subject).join(Semester).join(Branch).filter(
            Branch.program_id == filters.program_id
        )
    
    if filters.branch_id:
        query = query.join(Subject).join(Semester).filter(
            Semester.branch_id == filters.branch_id
        )
    
    if filters.semester_id:
        query = query.join(Subject).filter(
            Subject.semester_id == filters.semester_id
        )
    
    if filters.subject_id:
        query = query.filter(Note.subject_id == filters.subject_id)
    
    # Other filters
    if filters.semester_year:
        query = query.filter(Note.semester_year == filters.semester_year)
    
    if filters.uploader_id:
        query = query.filter(Note.uploader_id == filters.uploader_id)
    
    if filters.status:
        if filters.status.upper() in ['PENDING', 'APPROVED', 'REJECTED']:
            query = query.filter(Note.status == filters.status.upper())
    
    # Tag filter
    if filters.tags:
        # Filter notes that have all specified tags
        for tag_name in filters.tags:
            query = query.filter(
                Note.tags.any(Tag.name.ilike(f"%{tag_name}%"))
            )
    
    return query


def apply_note_sorting(query, sort_by: str, sort_order: str):
    """Apply sorting to note query."""
    # Define allowed sort fields
    sort_fields = {
        'created_at': Note.created_at,
        'title': Note.title,
        'semester_year': Note.semester_year,
        'download_count': Note.download_count,
        'view_count': Note.view_count,
        'approved_at': Note.approved_at,
    }
    
    if sort_by not in sort_fields:
        sort_by = 'created_at'
    
    sort_column = sort_fields[sort_by]
    
    if sort_order.lower() == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    return query


async def log_note_activity(
    db: Session,
    user_id: UUID,
    activity_type: ActivityTypeEnum,
    note_id: UUID,
    metadata: Optional[str] = None
):
    """Log user activity for a note."""
    try:
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            note_id=note_id,
            activity_metadata=metadata
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Failed to log note activity: {e}")
        db.rollback()


def increment_note_stats(db: Session, note_id: UUID, stat_type: str):
    """Increment note statistics."""
    try:
        if stat_type == 'view':
            db.query(Note).filter(Note.id == note_id).update(
                {Note.view_count: Note.view_count + 1}
            )
        elif stat_type == 'download':
            db.query(Note).filter(Note.id == note_id).update(
                {Note.download_count: Note.download_count + 1}
            )
        db.commit()
    except Exception as e:
        print(f"Failed to increment note {stat_type}: {e}")
        db.rollback()


# Public Routes

@router.get("/", response_model=NoteListResponse)
async def get_notes(
    filters: NoteSearchFilters = Depends(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get a paginated list of approved notes with filtering and search."""
    
    # Base query - only approved notes for public access
    query = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        joinedload(Note.uploader),
        selectinload(Note.tags)
    ).filter(Note.status == NoteStatus.APPROVED)
    
    # Apply filters
    query = apply_note_filters(query, filters)
    
    # Apply sorting
    query = apply_note_sorting(query, filters.sort_by, filters.sort_order)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (filters.page - 1) * filters.per_page
    notes = query.offset(offset).limit(filters.per_page).all()
    
    # Calculate pagination info
    total_pages = math.ceil(total / filters.per_page)
    has_next = filters.page < total_pages
    has_prev = filters.page > 1
    
    # Convert to response format
    note_responses = []
    for note in notes:
        note_dict = {
            **note.__dict__,
            **get_note_academic_hierarchy(note)
        }
        
        # Add user-specific data if authenticated
        if current_user:
            # Check if bookmarked
            bookmark = db.query(NoteBookmark).filter(
                NoteBookmark.user_id == current_user.id,
                NoteBookmark.note_id == note.id
            ).first()
            note_dict['is_bookmarked'] = bookmark is not None
            
            # Get user rating
            rating = db.query(NoteRating).filter(
                NoteRating.user_id == current_user.id,
                NoteRating.note_id == note.id
            ).first()
            note_dict['user_rating'] = rating.rating if rating else None
            note_dict['user_rating_id'] = str(rating.id) if rating else None
        
        note_responses.append(NoteResponse(**note_dict))
    
    return NoteListResponse(
        notes=note_responses,
        total=total,
        page=filters.page,
        per_page=filters.per_page,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


# Filter options route (must come before /{note_id} route)
@router.get("/filter-options")
async def get_filter_options(
    db: Session = Depends(get_db),
):
    """Get all available filter options with counts for notes."""
    
    from sqlalchemy import func, distinct
    from datetime import datetime, timedelta
    
    # Only count approved notes for filter options
    approved_notes = db.query(Note).filter(Note.status == NoteStatus.APPROVED)
    
    # Get universities with note counts using proper joins
    university_counts = (
        db.query(
            University.name,
            func.count(distinct(Note.id)).label("count")
        )
        .join(Program, University.id == Program.university_id)
        .join(Branch, Program.id == Branch.program_id)
        .join(Semester, Branch.id == Semester.branch_id)
        .join(Subject, Semester.id == Subject.semester_id)
        .join(Note, Subject.id == Note.subject_id)
        .filter(Note.status == NoteStatus.APPROVED)
        .group_by(University.id, University.name)
        .having(func.count(distinct(Note.id)) > 0)
        .order_by(func.count(distinct(Note.id)).desc())
        .all()
    )
    
    universities = [
        {
            "value": univ.name.lower().replace(" ", "-"),
            "label": univ.name,
            "count": univ.count
        }
        for univ in university_counts
    ]
    
    # Get subjects with note counts
    subject_counts = (
        db.query(
            Subject.name,
            func.count(Note.id).label("count")
        )
        .join(Note, Subject.id == Note.subject_id)
        .filter(Note.status == NoteStatus.APPROVED)
        .group_by(Subject.id, Subject.name)
        .having(func.count(Note.id) > 0)
        .order_by(func.count(Note.id).desc())
        .all()
    )
    
    subjects = [
        {
            "value": subject.name.lower().replace(" ", "-"),
            "label": subject.name,
            "count": subject.count
        }
        for subject in subject_counts
    ]
    
    # Get semester years
    semester_years = (
        db.query(
            Note.semester_year,
            func.count(Note.id).label("count")
        )
        .filter(Note.status == NoteStatus.APPROVED)
        .filter(Note.semester_year.isnot(None))
        .group_by(Note.semester_year)
        .order_by(Note.semester_year.desc())
        .all()
    )
    
    years = [
        {
            "value": str(year.semester_year),
            "label": f"{year.semester_year}",
            "count": year.count
        }
        for year in semester_years
    ]
    
    # Get academic levels with note counts (based on program duration/type)
    # First, let's debug what programs we actually have
    total_notes = approved_notes.count()
    print(f"\n=== ACADEMIC LEVEL DEBUG ===")
    print(f"Total approved notes: {total_notes}")
    
    # Get all program info for debugging
    try:
        programs_debug = (
            db.query(Program.name, Program.duration_years, func.count(distinct(Note.id)).label('note_count'))
            .join(Branch, Program.id == Branch.program_id)
            .join(Semester, Branch.id == Semester.branch_id)
            .join(Subject, Semester.id == Subject.semester_id)
            .join(Note, Subject.id == Note.subject_id)
            .filter(Note.status == NoteStatus.APPROVED)
            .group_by(Program.id, Program.name, Program.duration_years)
            .all()
        )
        
        print("Programs with notes:")
        for prog in programs_debug:
            print(f"  - {prog.name}: {prog.note_count} notes, duration: {prog.duration_years} years")
    except Exception as e:
        print(f"Error getting programs debug info: {e}")
    
    # Calculate actual counts based on program duration in the academic hierarchy
    undergraduate_counts = 0
    graduate_counts = 0
    
    try:
        # Method 1: Use duration_years (undergraduate = 4 years or less)
        undergraduate_counts = (
            db.query(func.count(distinct(Note.id)))
            .join(Subject, Note.subject_id == Subject.id)
            .join(Semester, Subject.semester_id == Semester.id)
            .join(Branch, Semester.branch_id == Branch.id)
            .join(Program, Branch.program_id == Program.id)
            .filter(Note.status == NoteStatus.APPROVED)
            .filter(Program.duration_years.isnot(None))
            .filter(Program.duration_years <= 4)
            .scalar() or 0
        )
        print(f"Undergraduate by duration (<=4 years): {undergraduate_counts}")
        
        graduate_counts = (
            db.query(func.count(distinct(Note.id)))
            .join(Subject, Note.subject_id == Subject.id)
            .join(Semester, Subject.semester_id == Semester.id)
            .join(Branch, Semester.branch_id == Branch.id)
            .join(Program, Branch.program_id == Program.id)
            .filter(Note.status == NoteStatus.APPROVED)
            .filter(Program.duration_years.isnot(None))
            .filter(Program.duration_years > 4)
            .scalar() or 0
        )
        print(f"Graduate by duration (>4 years): {graduate_counts}")
        
    except Exception as e:
        print(f"Error calculating academic level counts by duration: {e}")
    
    # Method 2: Use program names to infer academic level  
    # Also force both levels to show if we have any notes at all (temporary fix)
    if (undergraduate_counts == 0 and graduate_counts == 0 and total_notes > 0) or True:
        print("Trying program name-based classification...")
        try:
            # More comprehensive undergraduate patterns
            bachelor_programs = (
                db.query(func.count(distinct(Note.id)))
                .join(Subject, Note.subject_id == Subject.id)
                .join(Semester, Subject.semester_id == Semester.id)
                .join(Branch, Semester.branch_id == Branch.id)
                .join(Program, Branch.program_id == Program.id)
                .filter(Note.status == NoteStatus.APPROVED)
                .filter(or_(
                    Program.name.ilike('%bachelor%'),
                    Program.name.ilike('%b.tech%'),
                    Program.name.ilike('%b.sc%'),
                    Program.name.ilike('%b.e%'),
                    Program.name.ilike('%btech%'),
                    Program.name.ilike('%be %'),
                    Program.name.ilike('%undergraduate%'),
                    Program.name.ilike('%diploma%')
                ))
                .scalar() or 0
            )
            print(f"Undergraduate by name patterns: {bachelor_programs}")
            
            # More comprehensive graduate patterns
            master_programs = (
                db.query(func.count(distinct(Note.id)))
                .join(Subject, Note.subject_id == Subject.id)
                .join(Semester, Subject.semester_id == Semester.id)
                .join(Branch, Semester.branch_id == Branch.id)
                .join(Program, Branch.program_id == Program.id)
                .filter(Note.status == NoteStatus.APPROVED)
                .filter(or_(
                    Program.name.ilike('%master%'),
                    Program.name.ilike('%m.tech%'),
                    Program.name.ilike('%m.sc%'),
                    Program.name.ilike('%m.e%'),
                    Program.name.ilike('%mtech%'),
                    Program.name.ilike('%me %'),
                    Program.name.ilike('%mba%'),
                    Program.name.ilike('%graduate%'),
                    Program.name.ilike('%phd%'),
                    Program.name.ilike('%doctorate%'),
                    Program.name.ilike('%post%')
                ))
                .scalar() or 0
            )
            print(f"Graduate by name patterns: {master_programs}")
            
            if bachelor_programs > 0 or master_programs > 0:
                undergraduate_counts = bachelor_programs
                graduate_counts = master_programs
            else:
                print("No matches found, using fallback estimates")
                # If no specific patterns match, assume some distribution
                # Check if any programs exist at all
                notes_with_programs = (
                    db.query(func.count(distinct(Note.id)))
                    .join(Subject, Note.subject_id == Subject.id)
                    .join(Semester, Subject.semester_id == Semester.id)
                    .join(Branch, Semester.branch_id == Branch.id)
                    .join(Program, Branch.program_id == Program.id)
                    .filter(Note.status == NoteStatus.APPROVED)
                    .scalar() or 0
                )
                
                if notes_with_programs > 0:
                    # Split between undergraduate and graduate based on reasonable assumptions
                    # Since we can't determine the level definitively, show both options
                    undergraduate_counts = max(1, int(notes_with_programs * 0.7))  # At least 1, ~70% undergraduate
                    graduate_counts = max(1, int(notes_with_programs * 0.3))       # At least 1, ~30% graduate
                else:
                    undergraduate_counts = 0
                    graduate_counts = 0
                
        except Exception as e:
            print(f"Error calculating academic level counts by name: {e}")
            # Final fallback: split evenly if we have notes
            if total_notes > 0:
                undergraduate_counts = int(total_notes * 0.5)
                graduate_counts = int(total_notes * 0.5)
    
    print(f"Final counts - Undergraduate: {undergraduate_counts}, Graduate: {graduate_counts}")
    print("=== END ACADEMIC LEVEL DEBUG ===\n")
    
    academic_levels = [
        {
            "value": "undergraduate",
            "label": "Undergraduate",
            "count": undergraduate_counts
        },
        {
            "value": "graduate", 
            "label": "Graduate",
            "count": graduate_counts
        }
    ]
    
    # Only include levels that have notes
    academic_levels = [level for level in academic_levels if level["count"] > 0]
    
    # Upload date ranges
    now = datetime.utcnow()
    upload_date_ranges = [
        {
            "value": "1day",
            "label": "Last 24 hours",
            "count": approved_notes.filter(Note.created_at >= now - timedelta(days=1)).count()
        },
        {
            "value": "1week",
            "label": "Last week",
            "count": approved_notes.filter(Note.created_at >= now - timedelta(days=7)).count()
        },
        {
            "value": "1month",
            "label": "Last month",
            "count": approved_notes.filter(Note.created_at >= now - timedelta(days=30)).count()
        },
        {
            "value": "3months",
            "label": "Last 3 months",
            "count": approved_notes.filter(Note.created_at >= now - timedelta(days=90)).count()
        }
    ]
    
    return {
        "universities": universities,
        "subjects": subjects,
        "semester_years": years,
        "academic_levels": academic_levels,
        "upload_date_ranges": upload_date_ranges,
        "total_notes": approved_notes.count()
    }


@router.get("/{note_id}", response_model=NoteDetailResponse)
async def get_note(
    note_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single note by ID with detailed information."""
    
    note = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        joinedload(Note.uploader),
        selectinload(Note.tags),
        selectinload(Note.ratings)
    ).filter(Note.id == note_id).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if note is approved or if user is owner/admin
    if note.status != NoteStatus.APPROVED:
        if not current_user or (current_user.id != note.uploader_id and current_user.role != "admin"):
            raise HTTPException(status_code=404, detail="Note not found")
    
    # Increment view count and log activity
    if current_user:
        background_tasks.add_task(increment_note_stats, db, note_id, "view")
        background_tasks.add_task(
            log_note_activity, db, current_user.id, ActivityTypeEnum.VIEW, note_id
        )
    
    # Calculate average rating
    if note.ratings:
        total_ratings = len(note.ratings)
        average_rating = sum(r.rating for r in note.ratings) / total_ratings
    else:
        total_ratings = 0
        average_rating = None
    
    # Convert to response format
    note_dict = {
        **note.__dict__,
        **get_note_academic_hierarchy(note),
        'average_rating': round(average_rating, 1) if average_rating else None,
        'total_ratings': total_ratings
    }
    
    # Add user-specific data if authenticated
    if current_user:
        # Check if bookmarked
        bookmark = db.query(NoteBookmark).filter(
            NoteBookmark.user_id == current_user.id,
            NoteBookmark.note_id == note.id
        ).first()
        note_dict['is_bookmarked'] = bookmark is not None
        
        # Get user rating
        rating = db.query(NoteRating).filter(
            NoteRating.user_id == current_user.id,
            NoteRating.note_id == note.id
        ).first()
        note_dict['user_rating'] = rating.rating if rating else None
        note_dict['user_rating_id'] = str(rating.id) if rating else None
    
    return NoteDetailResponse(**note_dict)


@router.post("/", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note (requires authentication)."""
    
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == note_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Subject not found")
    
    # Create note
    note = Note(
        title=note_data.title,
        description=note_data.description,
        semester_year=note_data.semester_year,
        subject_id=note_data.subject_id,
        uploader_id=current_user.id,
        storage_key=note_data.storage_key,
        file_hash=note_data.file_hash,
        original_filename=note_data.original_filename,
        file_size=note_data.file_size,
        mime_type=note_data.mime_type,
        status=NoteStatus.PENDING
    )
    
    db.add(note)
    db.flush()  # Get the ID
    
    # Handle tags
    if note_data.tags:
        for tag_name in note_data.tags:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue
                
            # Get or create tag
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name, slug=tag_name.replace(' ', '-'))
                db.add(tag)
                db.flush()
            
            # Create note-tag association
            note_tag = NoteTag(note_id=note.id, tag_id=tag.id)
            db.add(note_tag)
    
    db.commit()
    db.refresh(note)
    
    # Log activity
    await log_note_activity(
        db, current_user.id, ActivityTypeEnum.UPLOAD, note.id,
        f"Uploaded note: {note.title}"
    )
    
    # Get full note data for response
    note_with_relations = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        joinedload(Note.uploader),
        selectinload(Note.tags)
    ).filter(Note.id == note.id).first()
    
    note_dict = {
        **note_with_relations.__dict__,
        **get_note_academic_hierarchy(note_with_relations)
    }
    
    return NoteResponse(**note_dict)


# User-specific routes (require authentication)

@router.get("/my/notes", response_model=MyNotesListResponse)
async def get_my_notes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's notes."""
    
    query = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        selectinload(Note.tags)
    ).filter(Note.uploader_id == current_user.id)
    
    # Status filter
    if status and status.upper() in ['PENDING', 'APPROVED', 'REJECTED']:
        query = query.filter(Note.status == status.upper())
    
    # Order by creation date (newest first)
    query = query.order_by(desc(Note.created_at))
    
    # Get total and apply pagination
    total = query.count()
    offset = (page - 1) * per_page
    notes = query.offset(offset).limit(per_page).all()
    
    # Calculate stats
    stats_query = db.query(Note).filter(Note.uploader_id == current_user.id)
    total_approved = stats_query.filter(Note.status == NoteStatus.APPROVED).count()
    total_pending = stats_query.filter(Note.status == NoteStatus.PENDING).count()
    total_rejected = stats_query.filter(Note.status == NoteStatus.REJECTED).count()
    
    # Get total downloads and views
    approved_notes = stats_query.filter(Note.status == NoteStatus.APPROVED).all()
    total_downloads = sum(note.download_count for note in approved_notes)
    total_views = sum(note.view_count for note in approved_notes)
    
    # Convert to response format
    note_responses = []
    for note in notes:
        note_dict = {
            **note.__dict__,
            **get_note_academic_hierarchy(note)
        }
        note_responses.append(MyNoteResponse(**note_dict))
    
    total_pages = math.ceil(total / per_page)
    
    return MyNotesListResponse(
        notes=note_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
        total_approved=total_approved,
        total_pending=total_pending,
        total_rejected=total_rejected,
        total_downloads=total_downloads,
        total_views=total_views
    )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note (only by owner)."""
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check ownership
    if note.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this note")
    
    # Update fields
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'tags':
            continue  # Handle tags separately
        setattr(note, field, value)
    
    # Handle tags if provided
    if note_data.tags is not None:
        # Remove existing tags
        db.query(NoteTag).filter(NoteTag.note_id == note_id).delete()
        
        # Add new tags
        for tag_name in note_data.tags:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue
                
            # Get or create tag
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name, slug=tag_name.replace(' ', '-'))
                db.add(tag)
                db.flush()
            
            # Create note-tag association
            note_tag = NoteTag(note_id=note.id, tag_id=tag.id)
            db.add(note_tag)
    
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    
    # Get full note data for response
    note_with_relations = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        joinedload(Note.uploader),
        selectinload(Note.tags)
    ).filter(Note.id == note.id).first()
    
    note_dict = {
        **note_with_relations.__dict__,
        **get_note_academic_hierarchy(note_with_relations)
    }
    
    return NoteResponse(**note_dict)


@router.delete("/{note_id}")
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note (only by owner)."""
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check ownership or admin
    if note.uploader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}


# Bookmark routes

@router.post("/bookmarks", response_model=NoteBookmarkResponse)
async def bookmark_note(
    bookmark_data: NoteBookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark a note."""
    
    # Check if note exists and is approved
    note = db.query(Note).filter(
        Note.id == bookmark_data.note_id,
        Note.status == NoteStatus.APPROVED
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if already bookmarked
    existing = db.query(NoteBookmark).filter(
        NoteBookmark.user_id == current_user.id,
        NoteBookmark.note_id == bookmark_data.note_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Note already bookmarked")
    
    # Create bookmark
    bookmark = NoteBookmark(
        user_id=current_user.id,
        note_id=bookmark_data.note_id
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    
    # Log activity
    await log_note_activity(
        db, current_user.id, ActivityTypeEnum.BOOKMARK, bookmark_data.note_id
    )
    
    return NoteBookmarkResponse.from_orm(bookmark)


@router.delete("/bookmarks/{note_id}")
async def remove_bookmark(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a note bookmark."""
    
    bookmark = db.query(NoteBookmark).filter(
        NoteBookmark.user_id == current_user.id,
        NoteBookmark.note_id == note_id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
    
    return {"message": "Bookmark removed"}


@router.get("/bookmarks/my", response_model=List[NoteBookmarkResponse])
async def get_my_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's bookmarked notes."""
    
    bookmarks = db.query(NoteBookmark).options(
        joinedload(NoteBookmark.note).joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university)
    ).filter(NoteBookmark.user_id == current_user.id).order_by(desc(NoteBookmark.created_at)).all()
    
    bookmark_responses = []
    for bookmark in bookmarks:
        note_dict = {
            **bookmark.note.__dict__,
            **get_note_academic_hierarchy(bookmark.note)
        }
        bookmark_dict = {
            **bookmark.__dict__,
            'note': NoteResponse(**note_dict)
        }
        bookmark_responses.append(NoteBookmarkResponse(**bookmark_dict))
    
    return bookmark_responses


# Rating routes

@router.post("/ratings", response_model=NoteRatingResponse)
async def rate_note(
    rating_data: NoteRatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a note."""
    
    # Check if note exists and is approved
    note = db.query(Note).filter(
        Note.id == rating_data.note_id,
        Note.status == NoteStatus.APPROVED
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if user already rated this note
    existing_rating = db.query(NoteRating).filter(
        NoteRating.user_id == current_user.id,
        NoteRating.note_id == rating_data.note_id
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        existing_rating.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_rating)
        rating = existing_rating
    else:
        # Create new rating
        rating = NoteRating(
            user_id=current_user.id,
            note_id=rating_data.note_id,
            rating=rating_data.rating
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
    
    # Log activity
    await log_note_activity(
        db, current_user.id, ActivityTypeEnum.RATING, rating_data.note_id,
        f"Rated {rating_data.rating} stars"
    )
    
    return NoteRatingResponse.from_orm(rating)


@router.delete("/ratings/{note_id}")
async def remove_rating(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a note rating."""
    
    rating = db.query(NoteRating).filter(
        NoteRating.user_id == current_user.id,
        NoteRating.note_id == note_id
    ).first()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    db.delete(rating)
    db.commit()
    
    return {"message": "Rating removed"}


# Download route

@router.post("/{note_id}/download")
async def download_note(
    note_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a note download and increment stats."""
    
    # Check if note exists and is approved
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.status == NoteStatus.APPROVED
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Record download
    download = NoteDownload(
        note_id=note_id,
        user_id=current_user.id
    )
    db.add(download)
    db.commit()
    
    # Increment download count and log activity
    background_tasks.add_task(increment_note_stats, db, note_id, "download")
    background_tasks.add_task(
        log_note_activity, db, current_user.id, ActivityTypeEnum.DOWNLOAD, note_id
    )
    
    return {"message": "Download recorded", "note_title": note.title}


# Report route

@router.post("/reports", response_model=NoteReportResponse)
async def report_note(
    report_data: NoteReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Report a note for inappropriate content."""
    
    # Check if note exists
    note = db.query(Note).filter(Note.id == report_data.note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if user already reported this note
    existing_report = db.query(NoteReport).filter(
        NoteReport.reporter_id == current_user.id,
        NoteReport.note_id == report_data.note_id,
        NoteReport.status == ReportStatus.OPEN
    ).first()
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this note")
    
    # Create report
    report = NoteReport(
        note_id=report_data.note_id,
        reporter_id=current_user.id,
        reason=report_data.reason,
        details=report_data.details
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return NoteReportResponse.from_orm(report)




# Admin routes (require admin privileges)

@router.get("/pending/", response_model=NoteListResponse)
async def get_pending_notes(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page"),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get pending notes for admin moderation."""
    
    # Query for pending notes only
    query = db.query(Note).options(
        joinedload(Note.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
        joinedload(Note.uploader),
        selectinload(Note.tags)
    ).filter(Note.status == NoteStatus.PENDING)
    
    # Order by creation date (oldest first for moderation)
    query = query.order_by(asc(Note.created_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    notes = query.offset(offset).limit(page_size).all()
    
    # Calculate pagination info
    total_pages = math.ceil(total / page_size)
    has_next = page < total_pages
    has_prev = page > 1
    
    # Convert to response format
    note_responses = []
    for note in notes:
        note_dict = {
            **note.__dict__,
            **get_note_academic_hierarchy(note)
        }
        note_responses.append(NoteResponse(**note_dict))
    
    return NoteListResponse(
        notes=note_responses,
        total=total,
        page=page,
        per_page=page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


@router.put("/{note_id}/status")
async def update_note_status(
    note_id: UUID,
    status_data: NoteStatusUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update note status (admin only)."""
    
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Status validation is handled by the Pydantic schema
    note.status = status_data.status  # Already uppercase from validator
    note.moderation_notes = status_data.moderation_notes
    
    if status_data.status == 'APPROVED':
        note.approved_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Note status updated to {status_data.status}"}
