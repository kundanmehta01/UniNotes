from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import uuid

from app.db.models import PaperStatus


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)


class TagCreate(BaseModel):
    """Schema for creating a tag."""
    name: str = Field(..., max_length=100)


class Tag(TagBase):
    """Tag schema."""
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubjectBase(BaseModel):
    """Base subject schema."""
    name: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    slug: Optional[str] = Field(None, max_length=255)
    credits: Optional[int] = None


class Subject(SubjectBase):
    """Subject schema with relationships."""
    id: uuid.UUID
    semester_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class SemesterBase(BaseModel):
    """Base semester schema."""
    number: int = Field(..., ge=1, le=12)
    name: Optional[str] = Field(None, max_length=100)


class Semester(SemesterBase):
    """Semester schema."""
    id: uuid.UUID
    branch_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class SemesterWithSubjects(Semester):
    """Semester schema with subjects."""
    subjects: List[Subject] = []
    
    class Config:
        from_attributes = True


class BranchBase(BaseModel):
    """Base branch schema."""
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=20)


class Branch(BranchBase):
    """Branch schema."""
    id: uuid.UUID
    program_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class BranchWithSemesters(Branch):
    """Branch schema with semesters."""
    semesters: List[SemesterWithSubjects] = []
    
    class Config:
        from_attributes = True


class ProgramBase(BaseModel):
    """Base program schema."""
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    duration_years: Optional[int] = Field(None, ge=1, le=10)


class Program(ProgramBase):
    """Program schema."""
    id: uuid.UUID
    university_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProgramWithBranches(Program):
    """Program schema with branches."""
    branches: List[BranchWithSemesters] = []
    
    class Config:
        from_attributes = True


class UniversityBase(BaseModel):
    """Base university schema."""
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    code: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)


class University(UniversityBase):
    """University schema."""
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class UniversityWithPrograms(University):
    """University schema with programs."""
    programs: List[ProgramWithBranches] = []
    
    class Config:
        from_attributes = True


class PaperBase(BaseModel):
    """Base paper schema."""
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    exam_year: int = Field(..., ge=1990, le=2030)


class PaperCreate(PaperBase):
    """Schema for creating a paper."""
    subject_id: uuid.UUID
    tags: List[str] = Field(default=[], max_items=10)
    storage_key: str = Field(..., max_length=500)
    file_hash: str = Field(..., max_length=64)
    original_filename: str = Field(..., max_length=500)
    file_size: int = Field(..., gt=0)
    mime_type: str = Field(..., max_length=100)
    
    @validator("tags")
    def validate_tags(cls, v):
        """Validate tags list."""
        # Remove duplicates and empty strings
        tags = list(set(tag.strip().lower() for tag in v if tag.strip()))
        if len(tags) > 10:
            raise ValueError("Maximum 10 tags allowed")
        return tags


class PaperUpdate(BaseModel):
    """Schema for updating a paper."""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    exam_year: Optional[int] = Field(None, ge=1990, le=2030)
    tags: Optional[List[str]] = Field(None, max_items=10)


class PaperInDB(PaperBase):
    """Schema for paper as stored in database."""
    id: uuid.UUID
    storage_key: str
    file_hash: str
    original_filename: str
    file_size: int
    mime_type: str
    status: PaperStatus
    moderation_notes: Optional[str]
    subject_id: uuid.UUID
    uploader_id: Optional[uuid.UUID]
    download_count: int
    view_count: int
    created_at: datetime
    approved_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class Paper(PaperInDB):
    """Public paper schema."""
    subject: Subject
    uploader: Optional["User"] = None
    tags: List[Tag] = []
    
    # Rating information
    average_rating: Optional[float] = None
    total_ratings: Optional[int] = None
    user_rating: Optional[int] = None  # Current user's rating
    user_rating_id: Optional[uuid.UUID] = None  # ID of current user's rating
    
    # Flat taxonomy fields for frontend convenience
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    semester_name: Optional[str] = None
    semester_number: Optional[int] = None
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    program_name: Optional[str] = None
    university_name: Optional[str] = None
    university_code: Optional[str] = None
    
    class Config:
        from_attributes = True


class SemesterWithTaxonomy(Semester):
    """Semester schema with full taxonomy information."""
    branch: "BranchWithTaxonomy"
    
    class Config:
        from_attributes = True


class BranchWithTaxonomy(Branch):
    """Branch schema with full taxonomy information."""
    program: "ProgramWithTaxonomy"
    
    class Config:
        from_attributes = True


class ProgramWithTaxonomy(Program):
    """Program schema with full taxonomy information."""
    university: "University"
    
    class Config:
        from_attributes = True


class SubjectWithTaxonomy(Subject):
    """Subject schema with full taxonomy information."""
    semester: "SemesterWithTaxonomy"
    
    class Config:
        from_attributes = True


class PaperWithTaxonomy(Paper):
    """Paper schema with full taxonomy information."""
    subject: SubjectWithTaxonomy
    
    class Config:
        from_attributes = True


class PaperListResponse(BaseModel):
    """Schema for paginated paper list response."""
    items: List[Paper]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaperSearchFilters(BaseModel):
    """Schema for paper search filters."""
    university_id: Optional[uuid.UUID] = None
    program_id: Optional[uuid.UUID] = None
    branch_id: Optional[uuid.UUID] = None
    semester_id: Optional[uuid.UUID] = None
    subject_id: Optional[uuid.UUID] = None
    exam_year: Optional[int] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = Field(None, max_length=500)
    status: Optional[PaperStatus] = None
    uploaded_by: Optional[str] = None  # Filter papers by uploader ('me' for current user)
    # Additional filter fields
    academic_level: Optional[str] = None  # undergraduate, graduate
    content_type: Optional[str] = None    # exams, notes, etc.
    upload_date_range: Optional[str] = None  # 1day, 1week, 1month, 3months
    university: Optional[str] = None  # University slug/name filter
    subject: Optional[str] = None     # Subject slug/name filter
    sort: Optional[str] = Field(default="created_at", pattern="^(created_at|download_count|exam_year|title|rating)$")
    order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")


class PaperModerationAction(BaseModel):
    """Schema for paper moderation actions."""
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = Field(None, max_length=1000)


class BookmarkCreate(BaseModel):
    """Schema for creating a bookmark."""
    paper_id: uuid.UUID


class Bookmark(BaseModel):
    """Bookmark schema."""
    id: uuid.UUID
    user_id: uuid.UUID
    paper_id: uuid.UUID
    created_at: datetime
    paper: Paper
    
    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    """Schema for creating a report."""
    paper_id: uuid.UUID
    reason: str = Field(..., max_length=500)
    details: Optional[str] = None


class ReportRequest(BaseModel):
    """Schema for report request (paper_id comes from URL)."""
    reason: str = Field(..., max_length=500)
    details: Optional[str] = None


class ReportUpdate(BaseModel):
    """Schema for updating a report (admin only)."""
    admin_notes: Optional[str] = None
    status: str = Field(..., pattern="^(open|closed)$")


class Report(BaseModel):
    """Report schema."""
    id: uuid.UUID
    paper_id: uuid.UUID
    reporter_id: uuid.UUID
    reason: str
    details: Optional[str]
    status: str
    admin_notes: Optional[str]
    resolved_by_id: Optional[uuid.UUID]
    created_at: datetime
    resolved_at: Optional[datetime]
    
    paper: Paper
    reporter: "User"
    resolved_by: Optional["User"] = None
    
    class Config:
        from_attributes = True


class PresignedUploadRequest(BaseModel):
    """Schema for requesting presigned upload URL."""
    filename: str = Field(..., max_length=500)
    content_type: str = Field(..., max_length=100)
    file_size: int = Field(..., gt=0, le=20971520)  # Max 20MB


class PresignedUploadResponse(BaseModel):
    """Schema for presigned upload response."""
    upload_url: str
    storage_key: str
    expires_in: int


class DownloadRequest(BaseModel):
    """Schema for download request."""
    paper_id: uuid.UUID


class DownloadResponse(BaseModel):
    """Schema for download response."""
    download_url: str
    expires_in: int


class RatingCreate(BaseModel):
    """Schema for creating a rating."""
    paper_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)


class RatingRequest(BaseModel):
    """Schema for rating request (paper_id comes from URL)."""
    rating: int = Field(..., ge=1, le=5)


class RatingUpdate(BaseModel):
    """Schema for updating a rating."""
    rating: int = Field(..., ge=1, le=5)


class Rating(BaseModel):
    """Rating schema."""
    id: uuid.UUID
    paper_id: uuid.UUID
    user_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FilterOption(BaseModel):
    """Schema for a single filter option."""
    value: str
    label: str
    count: int


class FilterSection(BaseModel):
    """Schema for a filter section with options."""
    key: str
    title: str
    icon: str
    options: List[FilterOption]


class FilterOptions(BaseModel):
    """Schema for all available filter options."""
    universities: List[FilterOption]
    subjects: List[FilterOption]
    academic_levels: List[FilterOption]
    content_types: List[FilterOption]
    upload_date_ranges: List[FilterOption]
    exam_years: List[FilterOption]


# Forward references
from app.schemas.user import User
SemesterWithTaxonomy.model_rebuild()
BranchWithTaxonomy.model_rebuild()
ProgramWithTaxonomy.model_rebuild()
SubjectWithTaxonomy.model_rebuild()
PaperWithTaxonomy.model_rebuild()
Paper.model_rebuild()
Bookmark.model_rebuild()
Report.model_rebuild()
