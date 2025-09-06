import logging
import hashlib
from datetime import datetime
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_
from sqlalchemy.exc import IntegrityError

from app.db.models import (
    User, Paper, Subject, Tag, PaperTag, Bookmark, Report, Download, AuditLog,
    PaperStatus, ReportStatus, University, Program, Branch, Semester,
    UserActivity, ActivityTypeEnum, Rating
)
from app.schemas.paper import (
    PaperCreate, PaperUpdate, PaperSearchFilters, PaperListResponse,
    BookmarkCreate, ReportCreate, ReportUpdate, RatingCreate, RatingUpdate
)
from app.services.storage import storage_service
from app.utils.errors import (
    PaperNotFoundError, DuplicateFileError, ValidationError,
    PaperNotApprovedError, InsufficientPrivilegesError
)

logger = logging.getLogger(__name__)


class PaperService:
    """Service for paper management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_paper(
        self,
        paper_data: PaperCreate,
        uploader: User,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> Paper:
        """Create a new paper."""
        
        # Check for duplicate file hash
        existing_paper = self.db.query(Paper).filter(
            Paper.file_hash == paper_data.file_hash
        ).first()
        
        if existing_paper:
            raise DuplicateFileError(
                detail="A paper with this file already exists",
                details={
                    "existing_paper_id": str(existing_paper.id),
                    "existing_paper_title": existing_paper.title,
                    "file_hash": paper_data.file_hash
                }
            )
        
        # Verify subject exists
        subject = self.db.query(Subject).filter(Subject.id == paper_data.subject_id).first()
        if not subject:
            raise ValidationError(
                detail="Subject not found",
                details={"subject_id": str(paper_data.subject_id)}
            )
        
        # Verify file exists in storage
        if not storage_service.check_file_exists(paper_data.storage_key):
            raise ValidationError(
                detail="File not found in storage",
                details={"storage_key": paper_data.storage_key}
            )
        
        try:
            # Create paper
            new_paper = Paper(
                title=paper_data.title,
                description=paper_data.description,
                exam_year=paper_data.exam_year,
                subject_id=paper_data.subject_id,
                storage_key=paper_data.storage_key,
                file_hash=paper_data.file_hash,
                original_filename=paper_data.original_filename,
                file_size=paper_data.file_size,
                mime_type=paper_data.mime_type,
                uploader_id=uploader.id,
                status=PaperStatus.PENDING,
            )
            
            self.db.add(new_paper)
            self.db.flush()  # Get ID without committing
            
            # Add tags
            if paper_data.tags:
                await self._add_tags_to_paper(new_paper, paper_data.tags)
            
            self.db.commit()
            self.db.refresh(new_paper)
            
            # Log paper creation
            await self._log_paper_event(
                paper_id=new_paper.id,
                user_id=uploader.id,
                action="paper_created",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "title": new_paper.title,
                    "subject_id": str(new_paper.subject_id),
                    "exam_year": new_paper.exam_year
                }
            )
            
            # Create activity record for recent activity tracking
            await self._create_activity_record(
                user_id=uploader.id,
                activity_type=ActivityTypeEnum.UPLOAD,
                paper_id=new_paper.id,
                metadata={
                    "title": new_paper.title,
                    "subject_id": str(new_paper.subject_id),
                    "exam_year": new_paper.exam_year,
                    "file_size": new_paper.file_size,
                    "original_filename": new_paper.original_filename
                }
            )
            
            logger.info(f"Paper created: {new_paper.id} by user {uploader.id}")
            return new_paper
            
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Failed to create paper due to integrity error: {e}")
            raise DuplicateFileError(detail="File with this hash already exists")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create paper: {e}")
            raise
    
    async def update_paper(
        self,
        paper_id: str,
        paper_data: PaperUpdate,
        user: User,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> Paper:
        """Update an existing paper."""
        
        paper = self.db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Check permissions - only uploader or admin can update
        if paper.uploader_id != user.id and user.role.value != "admin":
            raise InsufficientPrivilegesError(
                detail="You can only update papers you uploaded"
            )
        
        # Update fields
        update_data = paper_data.dict(exclude_unset=True)
        old_values = {}
        
        for field, value in update_data.items():
            if field == "tags":
                continue  # Handle tags separately
            if hasattr(paper, field):
                old_values[field] = getattr(paper, field)
                setattr(paper, field, value)
        
        # Update tags if provided
        if paper_data.tags is not None:
            await self._update_paper_tags(paper, paper_data.tags)
        
        self.db.commit()
        self.db.refresh(paper)
        
        # Log paper update
        await self._log_paper_event(
            paper_id=paper.id,
            user_id=user.id,
            action="paper_updated",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "updated_fields": list(update_data.keys()),
                "old_values": old_values
            }
        )
        
        logger.info(f"Paper updated: {paper.id} by user {user.id}")
        return paper
    
    async def delete_paper(
        self,
        paper_id: str,
        user: User,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> bool:
        """Delete a paper (admin only or uploader if pending)."""
        
        paper = self.db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Check permissions
        is_admin = user.role.value == "admin"
        is_uploader = paper.uploader_id == user.id
        is_pending = paper.status == PaperStatus.PENDING
        
        if not is_admin and not (is_uploader and is_pending):
            raise InsufficientPrivilegesError(
                detail="Only admins can delete approved papers, uploaders can delete pending papers"
            )
        
        storage_key = paper.storage_key
        
        try:
            # Delete from database (cascade will handle related records)
            self.db.delete(paper)
            self.db.commit()
            
            # Delete file from storage
            try:
                storage_service.delete_file(storage_key)
            except Exception as e:
                logger.warning(f"Failed to delete file from storage: {e}")
            
            # Log paper deletion
            await self._log_paper_event(
                paper_id=paper_id,
                user_id=user.id,
                action="paper_deleted",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "title": paper.title,
                    "storage_key": storage_key
                }
            )
            
            logger.info(f"Paper deleted: {paper_id} by user {user.id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete paper {paper_id}: {e}")
            raise
    
    def get_paper(self, paper_id: str, user: Optional[User] = None) -> Paper:
        """Get a single paper by ID."""
        
        query = self.db.query(Paper).options(
            joinedload(Paper.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
            joinedload(Paper.uploader),
            joinedload(Paper.tags)
        ).filter(Paper.id == paper_id)
        
        paper = query.first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Check if user can access this paper
        if paper.status != PaperStatus.APPROVED:
            if not user or (paper.uploader_id != user.id and user.role.value != "admin"):
                raise PaperNotFoundError(detail="Paper not found or not accessible")
        
        # Increment view count
        if paper.status == PaperStatus.APPROVED:
            paper.view_count += 1
            self.db.commit()
        
        # Add rating information
        rating_info = self._calculate_paper_rating_info(paper, user)
        
        # Attach rating info to paper object
        paper.average_rating = rating_info["average_rating"]
        paper.total_ratings = rating_info["total_ratings"]
        paper.user_rating = rating_info["user_rating"]
        paper.user_rating_id = rating_info["user_rating_id"]
        
        # Add flat taxonomy fields for easier frontend access
        self._add_flat_taxonomy_fields_to_paper(paper)
        
        return paper
    
    def search_papers(
        self,
        filters: PaperSearchFilters,
        page: int = 1,
        page_size: int = 20,
        user: Optional[User] = None
    ) -> PaperListResponse:
        """Search papers with filters and pagination."""
        
        # Base query - only approved papers for non-admin users
        query = self.db.query(Paper).options(
            joinedload(Paper.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
            joinedload(Paper.uploader),
            joinedload(Paper.tags)
        )
        
        # Filter by uploader ("My Papers" functionality)
        if filters.uploaded_by == "me" and user:
            query = query.filter(Paper.uploader_id == user.id)
            # For "My Papers", still apply status filter if specified
            if filters.status:
                query = query.filter(Paper.status == filters.status)
            # If no status filter, show all user's papers (pending, approved, rejected)
        else:
            # Default status filter for regular search (non-my papers)
            if not user or user.role.value != "admin":
                query = query.filter(Paper.status == PaperStatus.APPROVED)
            elif filters.status:
                query = query.filter(Paper.status == filters.status)
        
        # Apply taxonomy filters - handle joins carefully
        taxonomy_already_joined = False
        
        if filters.university_id or filters.program_id or filters.branch_id or filters.semester_id:
            # Join the full taxonomy chain if not already done
            query = query.join(Paper.subject).join(Subject.semester).join(Semester.branch).join(Branch.program).join(Program.university)
            taxonomy_already_joined = True
            
            if filters.university_id:
                query = query.filter(University.id == filters.university_id)
            if filters.program_id:
                query = query.filter(Program.id == filters.program_id)
            if filters.branch_id:
                query = query.filter(Branch.id == filters.branch_id)
            if filters.semester_id:
                query = query.filter(Semester.id == filters.semester_id)
        
        # Filter by subject
        if filters.subject_id:
            query = query.filter(Paper.subject_id == filters.subject_id)
        
        # Filter by exam year
        if filters.exam_year:
            query = query.filter(Paper.exam_year == filters.exam_year)
        
        # Filter by tags
        if filters.tags:
            query = query.join(Paper.tags).filter(Tag.name.in_(filters.tags))
        
        # Search in title and description
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Paper.title.ilike(search_term),
                    Paper.description.ilike(search_term)
                )
            )
        
        # Apply additional filters - handle complex joins carefully
        # Determine if we need taxonomy joins for any of the filters
        needs_taxonomy_join = bool(
            filters.university or 
            filters.academic_level or
            (not taxonomy_already_joined and (filters.university_id or filters.program_id or filters.branch_id or filters.semester_id))
        )
        
        # Determine if we only need subject join
        needs_subject_join = filters.subject and not needs_taxonomy_join and not taxonomy_already_joined
        
        # Apply the required joins once
        if needs_taxonomy_join and not taxonomy_already_joined:
            # Full taxonomy join
            query = query.join(Paper.subject).join(Subject.semester).join(Semester.branch).join(Branch.program).join(Program.university)
        elif needs_subject_join:
            # Only subject join
            query = query.join(Paper.subject)
        
        # Now apply the filters
        
        # Filter by university slug/name
        if filters.university:
            query = query.filter(
                or_(
                    University.slug == filters.university,
                    University.name.ilike(f"%{filters.university}%")
                )
            )
        
        # Filter by subject slug/name
        if filters.subject:
            query = query.filter(
                or_(
                    Subject.slug == filters.subject,
                    Subject.name.ilike(f"%{filters.subject}%")
                )
            )
        
        # Filter by academic level (based on program name patterns and duration)
        if filters.academic_level:
            if filters.academic_level == "undergraduate":
                # Look for undergraduate patterns in program names or duration <= 4 years
                undergraduate_conditions = [
                    Program.name.ilike('%bachelor%'),
                    Program.name.ilike('b.tech%'),
                    Program.name.ilike('b.sc%'),
                    Program.name.ilike('b.com%'),
                    Program.name.ilike('b.a%'),
                    Program.name.ilike('%btech%'),
                    Program.name.ilike('%b tech%'),
                    Program.name.ilike('%undergraduate%'),
                    # Duration-based logic
                    and_(Program.duration_years.isnot(None), Program.duration_years <= 4)
                ]
                
                # Include programs that match undergraduate patterns or have 4 years or less duration
                # Exclude programs that contain clear graduate keywords
                graduate_exclusions = [
                    Program.name.ilike('%master%'),
                    Program.name.ilike('%m.tech%'),
                    Program.name.ilike('%m.sc%'),
                    Program.name.ilike('%m.com%'),
                    Program.name.ilike('%m.a%'),
                    Program.name.ilike('%mtech%'),
                    Program.name.ilike('%phd%'),
                    Program.name.ilike('%doctorate%')
                ]
                
                query = query.filter(
                    and_(
                        or_(*undergraduate_conditions),
                        ~or_(*graduate_exclusions)  # Exclude graduate programs
                    )
                )
            elif filters.academic_level == "graduate":
                # Look for graduate patterns in program names or duration > 4 years
                graduate_conditions = [
                    Program.name.ilike('%master%'),
                    Program.name.ilike('%m.tech%'),
                    Program.name.ilike('%m.sc%'),
                    Program.name.ilike('%m.com%'),
                    Program.name.ilike('%m.a%'),
                    Program.name.ilike('%mtech%'),
                    Program.name.ilike('%m tech%'),
                    Program.name.ilike('%phd%'),
                    Program.name.ilike('%doctorate%'),
                    Program.name.ilike('%graduate%'),
                    # Duration-based logic
                    and_(Program.duration_years.isnot(None), Program.duration_years > 4)
                ]
                
                query = query.filter(
                    or_(*graduate_conditions)
                )
        
        # Filter by upload date range
        if filters.upload_date_range:
            from datetime import datetime, timedelta
            now = datetime.utcnow()
            
            if filters.upload_date_range == "1day":
                cutoff_date = now - timedelta(days=1)
            elif filters.upload_date_range == "1week":
                cutoff_date = now - timedelta(days=7)
            elif filters.upload_date_range == "1month":
                cutoff_date = now - timedelta(days=30)
            elif filters.upload_date_range == "3months":
                cutoff_date = now - timedelta(days=90)
            else:
                cutoff_date = None
            
            if cutoff_date:
                query = query.filter(Paper.created_at >= cutoff_date)
        
        # Filter by content type (currently only "exams" supported)
        # This is a placeholder - you might want to add a content_type field to papers
        # or derive it from tags/other fields
        if filters.content_type:
            # For now, all papers are considered "exams" since we only show past exams
            # Add more logic here when you have different content types
            pass
        
        # Count total results
        total = query.count()
        
        # Apply sorting
        if filters.sort == "download_count":
            query = query.order_by(desc(Paper.download_count) if filters.order == "desc" else asc(Paper.download_count))
        elif filters.sort == "exam_year":
            query = query.order_by(desc(Paper.exam_year) if filters.order == "desc" else asc(Paper.exam_year))
        elif filters.sort == "title":
            query = query.order_by(desc(Paper.title) if filters.order == "desc" else asc(Paper.title))
        elif filters.sort == "rating":
            # Sort by average rating - need to calculate it in the query
            rating_subquery = self.db.query(
                Rating.paper_id,
                func.avg(Rating.rating).label('avg_rating'),
                func.count(Rating.rating).label('rating_count')
            ).group_by(Rating.paper_id).subquery()
            
            query = query.outerjoin(rating_subquery, Paper.id == rating_subquery.c.paper_id)
            if filters.order == "desc":
                query = query.order_by(desc(rating_subquery.c.avg_rating.nullslast()))
            else:
                query = query.order_by(asc(rating_subquery.c.avg_rating.nullsfirst()))
        else:  # created_at
            query = query.order_by(desc(Paper.created_at) if filters.order == "desc" else asc(Paper.created_at))
        
        # Apply pagination
        offset = (page - 1) * page_size
        papers = query.offset(offset).limit(page_size).all()
        
        # Add rating information and flat taxonomy fields to each paper
        if papers:
            self._add_rating_info_to_papers(papers, user)
            for paper in papers:
                self._add_flat_taxonomy_fields_to_paper(paper)
        
        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size
        
        return PaperListResponse(
            items=papers,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    async def moderate_paper(
        self,
        paper_id: str,
        action: str,
        notes: Optional[str],
        moderator: User,
        ip_address: str = "unknown",
        user_agent: str = "",
        force: bool = False
    ) -> Paper:
        """Moderate a paper (approve or reject)."""
        
        paper = self.db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Only pending papers can be moderated, unless force=True for admin actions
        if not force and paper.status != PaperStatus.PENDING:
            raise ValidationError(
                detail="Only pending papers can be moderated",
                details={"current_status": paper.status.value}
            )
        
        # Update paper status
        old_status = paper.status
        if action == "approve":
            paper.status = PaperStatus.APPROVED
            paper.approved_at = datetime.utcnow()
        elif action == "reject":
            paper.status = PaperStatus.REJECTED
        else:
            raise ValidationError(detail="Invalid moderation action")
        
        paper.moderation_notes = notes
        self.db.commit()
        
        # Log moderation action
        action_name = f"paper_{action}d" if not force else f"paper_force_{action}d"
        await self._log_paper_event(
            paper_id=paper.id,
            user_id=moderator.id,
            action=action_name,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "old_status": old_status.value,
                "new_status": paper.status.value,
                "notes": notes,
                "forced": force
            }
        )
        
        logger.info(f"Paper {'force ' if force else ''}{action}d: {paper.id} by moderator {moderator.id}")
        return paper
    
    async def download_paper(
        self,
        paper_id: str,
        user: Optional[User],
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> str:
        """Get download URL for a paper."""
        
        paper = self.db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Only approved papers can be downloaded
        if paper.status != PaperStatus.APPROVED:
            raise PaperNotApprovedError()
        
        # Generate download URL
        download_url = storage_service.generate_presigned_download_url(
            storage_key=paper.storage_key,
            filename=paper.original_filename,
            expires_in=300  # 5 minutes
        )
        
        # Record download
        download_record = Download(
            paper_id=paper.id,
            user_id=user.id if user else None,
            ip_hash=hashlib.sha256((ip_address + "salt").encode()).hexdigest(),
            user_agent=user_agent[:500] if user_agent else "",
        )
        
        self.db.add(download_record)
        
        # Increment download count
        paper.download_count += 1
        self.db.commit()
        
        # Create activity record for downloads (only for authenticated users)
        if user:
            await self._create_activity_record(
                user_id=user.id,
                activity_type=ActivityTypeEnum.DOWNLOAD,
                paper_id=paper.id,
                metadata={
                    "title": paper.title,
                    "original_filename": paper.original_filename,
                    "file_size": paper.file_size
                }
            )
        
        logger.info(f"Paper downloaded: {paper.id} by user {user.id if user else 'anonymous'}")
        return download_url
    
    async def bookmark_paper(
        self,
        bookmark_data: BookmarkCreate,
        user: User
    ) -> Bookmark:
        """Add or toggle bookmark for a paper."""
        
        # Check if paper exists and is approved
        paper = self.db.query(Paper).filter(
            Paper.id == bookmark_data.paper_id,
            Paper.status == PaperStatus.APPROVED
        ).first()
        
        if not paper:
            raise PaperNotFoundError(details={"paper_id": str(bookmark_data.paper_id)})
        
        # Check if bookmark already exists
        existing_bookmark = self.db.query(Bookmark).filter(
            Bookmark.user_id == user.id,
            Bookmark.paper_id == bookmark_data.paper_id
        ).first()
        
        if existing_bookmark:
            # Remove bookmark
            self.db.delete(existing_bookmark)
            self.db.commit()
            return None
        else:
            # Add bookmark
            new_bookmark = Bookmark(
                user_id=user.id,
                paper_id=bookmark_data.paper_id
            )
            
            self.db.add(new_bookmark)
            self.db.commit()
            self.db.refresh(new_bookmark)
            
            # Create activity record for bookmarks
            await self._create_activity_record(
                user_id=user.id,
                activity_type=ActivityTypeEnum.BOOKMARK,
                paper_id=bookmark_data.paper_id,
                metadata={
                    "title": paper.title,
                    "action": "bookmarked"
                }
            )
            
            logger.info(f"Paper bookmarked: {bookmark_data.paper_id} by user {user.id}")
            return new_bookmark
    
    def get_user_bookmarks(self, user: User, page: int = 1, page_size: int = 20) -> PaperListResponse:
        """Get user's bookmarked papers."""
        
        query = self.db.query(Paper).join(Bookmark).filter(
            Bookmark.user_id == user.id,
            Paper.status == PaperStatus.APPROVED
        ).options(
            joinedload(Paper.subject).joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university),
            joinedload(Paper.uploader),
            joinedload(Paper.tags)
        ).order_by(desc(Bookmark.created_at))
        
        # Count total
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        papers = query.offset(offset).limit(page_size).all()
        
        # Add rating information and flat taxonomy fields to each paper
        if papers:
            self._add_rating_info_to_papers(papers, user)
            for paper in papers:
                self._add_flat_taxonomy_fields_to_paper(paper)
        
        total_pages = (total + page_size - 1) // page_size
        
        return PaperListResponse(
            items=papers,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    async def report_paper(
        self,
        report_data: ReportCreate,
        reporter: User,
        ip_address: str = "unknown",
        user_agent: str = ""
    ) -> Report:
        """Report a paper for issues."""
        
        # Check if paper exists
        paper = self.db.query(Paper).filter(Paper.id == report_data.paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": str(report_data.paper_id)})
        
        # Check if user already reported this paper
        existing_report = self.db.query(Report).filter(
            Report.paper_id == report_data.paper_id,
            Report.reporter_id == reporter.id,
            Report.status == ReportStatus.OPEN
        ).first()
        
        if existing_report:
            raise ValidationError(detail="You have already reported this paper")
        
        # Create report
        new_report = Report(
            paper_id=report_data.paper_id,
            reporter_id=reporter.id,
            reason=report_data.reason,
            details=report_data.details,
            status=ReportStatus.OPEN
        )
        
        self.db.add(new_report)
        self.db.commit()
        self.db.refresh(new_report)
        
        # Log report creation
        await self._log_paper_event(
            paper_id=report_data.paper_id,
            user_id=reporter.id,
            action="paper_reported",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "report_id": str(new_report.id),
                "reason": report_data.reason
            }
        )
        
        logger.info(f"Paper reported: {report_data.paper_id} by user {reporter.id}")
        return new_report
    
    async def rate_paper(
        self,
        rating_data: RatingCreate,
        user: User
    ) -> Rating:
        """Rate a paper or update existing rating."""
        
        # Check if paper exists and is approved
        paper = self.db.query(Paper).filter(
            Paper.id == rating_data.paper_id,
            Paper.status == PaperStatus.APPROVED
        ).first()
        
        if not paper:
            raise PaperNotFoundError(details={"paper_id": str(rating_data.paper_id)})
        
        # Users cannot rate their own papers
        if paper.uploader_id == user.id:
            raise ValidationError(detail="You cannot rate your own paper")
        
        # Check if rating already exists
        existing_rating = self.db.query(Rating).filter(
            Rating.user_id == user.id,
            Rating.paper_id == rating_data.paper_id
        ).first()
        
        if existing_rating:
            # Update existing rating
            old_rating = existing_rating.rating
            existing_rating.rating = rating_data.rating
            existing_rating.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing_rating)
            
            # Create activity record for rating update
            await self._create_activity_record(
                user_id=user.id,
                activity_type=ActivityTypeEnum.RATING,
                paper_id=rating_data.paper_id,
                metadata={
                    "title": paper.title,
                    "old_rating": old_rating,
                    "new_rating": rating_data.rating,
                    "action": "updated"
                }
            )
            
            logger.info(f"Paper rating updated: {rating_data.paper_id} by user {user.id} ({old_rating} -> {rating_data.rating})")
            return existing_rating
        else:
            # Create new rating
            new_rating = Rating(
                user_id=user.id,
                paper_id=rating_data.paper_id,
                rating=rating_data.rating
            )
            
            self.db.add(new_rating)
            self.db.commit()
            self.db.refresh(new_rating)
            
            # Create activity record for new rating
            await self._create_activity_record(
                user_id=user.id,
                activity_type=ActivityTypeEnum.RATING,
                paper_id=rating_data.paper_id,
                metadata={
                    "title": paper.title,
                    "rating": rating_data.rating,
                    "action": "created"
                }
            )
            
            logger.info(f"Paper rated: {rating_data.paper_id} by user {user.id} with {rating_data.rating} stars")
            return new_rating
    
    async def update_rating(
        self,
        rating_id: str,
        rating_data: RatingUpdate,
        user: User
    ) -> Rating:
        """Update an existing rating."""
        
        rating = self.db.query(Rating).filter(
            Rating.id == rating_id,
            Rating.user_id == user.id
        ).first()
        
        if not rating:
            raise ValidationError(detail="Rating not found or you don't have permission to update it")
        
        old_rating = rating.rating
        rating.rating = rating_data.rating
        rating.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(rating)
        
        # Get paper title for activity logging
        paper = self.db.query(Paper).filter(Paper.id == rating.paper_id).first()
        
        # Create activity record
        await self._create_activity_record(
            user_id=user.id,
            activity_type=ActivityTypeEnum.RATING,
            paper_id=rating.paper_id,
            metadata={
                "title": paper.title if paper else "Unknown Paper",
                "old_rating": old_rating,
                "new_rating": rating.rating,
                "action": "updated"
            }
        )
        
        logger.info(f"Rating updated: {rating_id} by user {user.id} ({old_rating} -> {rating.rating})")
        return rating
    
    async def delete_rating(
        self,
        rating_id: str,
        user: User
    ) -> bool:
        """Delete a rating."""
        
        rating = self.db.query(Rating).filter(
            Rating.id == rating_id,
            Rating.user_id == user.id
        ).first()
        
        if not rating:
            raise ValidationError(detail="Rating not found or you don't have permission to delete it")
        
        # Get paper title for activity logging
        paper = self.db.query(Paper).filter(Paper.id == rating.paper_id).first()
        
        old_rating = rating.rating
        paper_id = rating.paper_id
        
        self.db.delete(rating)
        self.db.commit()
        
        # Create activity record
        await self._create_activity_record(
            user_id=user.id,
            activity_type=ActivityTypeEnum.RATING,
            paper_id=paper_id,
            metadata={
                "title": paper.title if paper else "Unknown Paper",
                "old_rating": old_rating,
                "action": "deleted"
            }
        )
        
        logger.info(f"Rating deleted: {rating_id} by user {user.id}")
        return True
    
    def _calculate_paper_rating_info(self, paper: Paper, user: Optional[User] = None) -> Dict[str, Any]:
        """Calculate rating information for a paper."""
        # Get rating statistics
        ratings = self.db.query(Rating).filter(Rating.paper_id == paper.id).all()
        
        if not ratings:
            rating_info = {
                "average_rating": None,
                "total_ratings": 0,
                "user_rating": None,
                "user_rating_id": None
            }
        else:
            # Calculate statistics
            total_ratings = len(ratings)
            total_stars = sum(rating.rating for rating in ratings)
            average_rating = round(total_stars / total_ratings, 2)
            
            # Get user's rating if user is authenticated
            user_rating = None
            user_rating_id = None
            if user:
                user_rating_obj = next((r for r in ratings if str(r.user_id) == str(user.id)), None)
                if user_rating_obj:
                    user_rating = user_rating_obj.rating
                    user_rating_id = user_rating_obj.id
            
            rating_info = {
                "average_rating": average_rating,
                "total_ratings": total_ratings,
                "user_rating": user_rating,
                "user_rating_id": user_rating_id
            }
        
        return rating_info
    
    def _add_flat_taxonomy_fields_to_paper(self, paper: Paper) -> None:
        """Add convenient flat taxonomy fields to the paper object."""
        try:
            # Initialize all fields to None
            paper.subject_name = None
            paper.subject_code = None
            paper.semester_name = None
            paper.semester_number = None
            paper.branch_name = None
            paper.branch_code = None
            paper.program_name = None
            paper.university_name = None
            paper.university_code = None
            
            if paper.subject:
                # Subject fields
                paper.subject_name = paper.subject.name
                paper.subject_code = paper.subject.code
                
                # Check if semester is loaded
                if hasattr(paper.subject, 'semester') and paper.subject.semester:
                    # Semester fields
                    paper.semester_name = paper.subject.semester.name
                    paper.semester_number = paper.subject.semester.number
                    
                    # Check if branch is loaded
                    if hasattr(paper.subject.semester, 'branch') and paper.subject.semester.branch:
                        # Branch fields
                        paper.branch_name = paper.subject.semester.branch.name
                        paper.branch_code = paper.subject.semester.branch.code
                        
                        # Check if program is loaded
                        if hasattr(paper.subject.semester.branch, 'program') and paper.subject.semester.branch.program:
                            # Program fields
                            paper.program_name = paper.subject.semester.branch.program.name
                            
                            # Check if university is loaded
                            if hasattr(paper.subject.semester.branch.program, 'university') and paper.subject.semester.branch.program.university:
                                # University fields
                                paper.university_name = paper.subject.semester.branch.program.university.name
                                paper.university_code = paper.subject.semester.branch.program.university.code
        except Exception as e:
            logger.warning(f"Failed to add flat taxonomy fields to paper {paper.id}: {e}")
            # Don't fail the operation, just continue with None values
    
    def _add_rating_info_to_papers(self, papers: List[Paper], user: Optional[User] = None):
        """Efficiently add rating information to multiple papers."""
        if not papers:
            return
        
        paper_ids = [paper.id for paper in papers]
        
        # Get all ratings for these papers in one query
        ratings_query = self.db.query(Rating).filter(Rating.paper_id.in_(paper_ids))
        all_ratings = ratings_query.all()
        
        # Group ratings by paper_id
        ratings_by_paper = {}
        user_ratings_by_paper = {}
        
        for rating in all_ratings:
            paper_id = rating.paper_id
            if paper_id not in ratings_by_paper:
                ratings_by_paper[paper_id] = []
            ratings_by_paper[paper_id].append(rating)
            
            # Track user's ratings
            if user and str(rating.user_id) == str(user.id):
                user_ratings_by_paper[paper_id] = rating
        
        # Calculate and attach rating info for each paper
        for paper in papers:
            paper_ratings = ratings_by_paper.get(paper.id, [])
            
            if not paper_ratings:
                paper.average_rating = None
                paper.total_ratings = 0
                paper.user_rating = None
                paper.user_rating_id = None
            else:
                # Calculate average
                total_ratings = len(paper_ratings)
                total_stars = sum(r.rating for r in paper_ratings)
                average_rating = round(total_stars / total_ratings, 2)
                
                # Get user rating
                user_rating_obj = user_ratings_by_paper.get(paper.id)
                user_rating = user_rating_obj.rating if user_rating_obj else None
                user_rating_id = user_rating_obj.id if user_rating_obj else None
                
                paper.average_rating = average_rating
                paper.total_ratings = total_ratings
                paper.user_rating = user_rating
                paper.user_rating_id = user_rating_id
    
    def get_paper_rating_stats(self, paper_id: str) -> Dict[str, Any]:
        """Get rating statistics for a paper."""
        
        # Check if paper exists
        paper = self.db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            raise PaperNotFoundError(details={"paper_id": paper_id})
        
        # Get rating statistics
        ratings = self.db.query(Rating).filter(Rating.paper_id == paper_id).all()
        
        if not ratings:
            return {
                "paper_id": paper_id,
                "total_ratings": 0,
                "average_rating": 0.0,
                "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            }
        
        # Calculate statistics
        total_ratings = len(ratings)
        total_stars = sum(rating.rating for rating in ratings)
        average_rating = round(total_stars / total_ratings, 2)
        
        # Rating distribution
        distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for rating in ratings:
            distribution[str(rating.rating)] += 1
        
        return {
            "paper_id": paper_id,
            "total_ratings": total_ratings,
            "average_rating": average_rating,
            "rating_distribution": distribution
        }
    
    async def _add_tags_to_paper(self, paper: Paper, tag_names: List[str]):
        """Add tags to a paper."""
        for tag_name in tag_names:
            if not tag_name.strip():
                continue
            
            tag_name_clean = tag_name.strip().lower()
            
            # Get or create tag
            tag = self.db.query(Tag).filter(Tag.name == tag_name_clean).first()
            if not tag:
                tag_slug = tag_name_clean.replace(" ", "-")
                tag = Tag(name=tag_name_clean, slug=tag_slug)
                self.db.add(tag)
                self.db.flush()
            
            # Add tag to paper
            paper_tag = PaperTag(paper_id=paper.id, tag_id=tag.id)
            self.db.add(paper_tag)
    
    async def _update_paper_tags(self, paper: Paper, tag_names: List[str]):
        """Update tags for a paper."""
        # Remove existing tags
        self.db.query(PaperTag).filter(PaperTag.paper_id == paper.id).delete()
        
        # Add new tags
        if tag_names:
            await self._add_tags_to_paper(paper, tag_names)
    
    async def _log_paper_event(
        self,
        paper_id: str,
        user_id: str,
        action: str,
        ip_address: str = "unknown",
        user_agent: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log paper-related events for audit purposes."""
        
        try:
            log_entry = AuditLog(
                actor_user_id=user_id,
                action=action,
                target_type="paper",
                target_id=paper_id,
                metadata=metadata or {},
                ip_address=hashlib.sha256((ip_address + "salt").encode()).hexdigest(),
                user_agent=user_agent[:500] if user_agent else "",
            )
            
            self.db.add(log_entry)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log paper event: {e}")
            # Don't fail the main operation if logging fails
            self.db.rollback()
    
    async def _create_activity_record(
        self,
        user_id: str,
        activity_type: ActivityTypeEnum,
        paper_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Create a user activity record for recent activity tracking."""
        
        try:
            import json
            activity = UserActivity(
                user_id=user_id,
                activity_type=activity_type,
                paper_id=paper_id,
                activity_metadata=json.dumps(metadata) if metadata else None
            )
            
            self.db.add(activity)
            self.db.commit()
            
            logger.info(f"Activity recorded: {activity_type.value} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to create activity record: {e}")
            # Don't fail the main operation if activity logging fails
            self.db.rollback()


def get_paper_service(db: Session) -> PaperService:
    """Get paper service instance."""
    return PaperService(db)
