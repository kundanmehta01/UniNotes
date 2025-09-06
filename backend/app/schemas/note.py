from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, validator
from .user import User


class NoteBase(BaseModel):
    title: str = Field(..., max_length=500, description="Title of the note")
    description: Optional[str] = Field(None, description="Description of the note")
    semester_year: int = Field(..., ge=2000, le=2040, description="Year when notes were taken")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for the note")


class NoteCreate(NoteBase):
    subject_id: UUID = Field(..., description="Subject ID the note belongs to")
    storage_key: str = Field(..., description="S3 storage key")
    file_hash: str = Field(..., description="SHA-256 hash of the file")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")

    @validator('tags', pre=True)
    def validate_tags(cls, v):
        if isinstance(v, str):
            # Split comma-separated string
            tags = [tag.strip() for tag in v.split(',') if tag.strip()]
            return tags
        return v or []


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    semester_year: Optional[int] = Field(None, ge=2000, le=2040)
    tags: Optional[List[str]] = None

    @validator('tags', pre=True)
    def validate_tags(cls, v):
        if isinstance(v, str):
            # Split comma-separated string
            tags = [tag.strip() for tag in v.split(',') if tag.strip()]
            return tags
        return v


class NoteStatusUpdate(BaseModel):
    status: str = Field(..., description="New status (PENDING, APPROVED, REJECTED)")
    moderation_notes: Optional[str] = Field(None, description="Admin notes about the status change")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['PENDING', 'APPROVED', 'REJECTED']
        if v.upper() not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}. Got: {v}')
        return v.upper()


# Response Models
class SubjectInfo(BaseModel):
    id: UUID
    name: str
    code: Optional[str]
    
    class Config:
        from_attributes = True


class SemesterInfo(BaseModel):
    id: UUID
    number: int
    name: Optional[str]
    
    class Config:
        from_attributes = True


class BranchInfo(BaseModel):
    id: UUID
    name: str
    code: Optional[str]
    
    class Config:
        from_attributes = True


class ProgramInfo(BaseModel):
    id: UUID
    name: str
    duration_years: Optional[int]
    
    class Config:
        from_attributes = True


class UniversityInfo(BaseModel):
    id: UUID
    name: str
    code: Optional[str]
    
    class Config:
        from_attributes = True


class NoteResponse(NoteBase):
    id: UUID
    status: str
    download_count: int
    view_count: int
    storage_key: Optional[str]
    original_filename: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    approved_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    # Foreign key info
    subject_id: UUID
    uploader_id: Optional[UUID]
    
    # Relationships
    subject: Optional[SubjectInfo] = None
    uploader: Optional[User] = None
    
    # Additional computed fields
    semester: Optional[SemesterInfo] = None
    branch: Optional[BranchInfo] = None
    program: Optional[ProgramInfo] = None
    university: Optional[UniversityInfo] = None
    
    # User-specific data (populated when user is authenticated)
    is_bookmarked: Optional[bool] = None
    user_rating: Optional[int] = None
    user_rating_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class NoteDetailResponse(NoteResponse):
    """Extended note response with additional details for single note view"""
    moderation_notes: Optional[str] = None
    average_rating: Optional[float] = None
    total_ratings: Optional[int] = None
    download_url: Optional[str] = None  # Temporary download URL
    
    class Config:
        from_attributes = True


# Search and Filter Models
class NoteSearchFilters(BaseModel):
    q: Optional[str] = Field(None, description="Search query")
    university_id: Optional[UUID] = None
    program_id: Optional[UUID] = None  
    branch_id: Optional[UUID] = None
    semester_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    semester_year: Optional[int] = None
    tags: Optional[List[str]] = None
    uploader_id: Optional[UUID] = None
    status: Optional[str] = Field(None, description="Note status (PENDING, APPROVED, REJECTED)")
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", description="Field to sort by")
    sort_order: Optional[str] = Field("desc", description="Sort order (asc, desc)")
    
    # Pagination
    page: Optional[int] = Field(1, ge=1, description="Page number")
    per_page: Optional[int] = Field(20, ge=1, le=100, description="Items per page")

    @validator('tags', pre=True)
    def validate_tags(cls, v):
        if isinstance(v, str):
            # Split comma-separated string
            tags = [tag.strip() for tag in v.split(',') if tag.strip()]
            return tags
        return v or []


# Bookmark Models
class NoteBookmarkCreate(BaseModel):
    note_id: UUID


class NoteBookmarkResponse(BaseModel):
    id: UUID
    note_id: UUID
    created_at: datetime
    note: Optional[NoteResponse] = None
    
    class Config:
        from_attributes = True


# Rating Models
class NoteRatingCreate(BaseModel):
    note_id: UUID
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")


class NoteRatingUpdate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")


class NoteRatingResponse(BaseModel):
    id: UUID
    note_id: UUID
    user_id: UUID
    rating: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Report Models
class NoteReportCreate(BaseModel):
    note_id: UUID
    reason: str = Field(..., max_length=500, description="Reason for reporting")
    details: Optional[str] = Field(None, description="Additional details about the report")


class NoteReportResponse(BaseModel):
    id: UUID
    note_id: UUID
    reporter_id: UUID
    reason: str
    details: Optional[str]
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Statistics Models
class NoteStats(BaseModel):
    total_notes: int
    approved_notes: int
    pending_notes: int
    rejected_notes: int
    total_downloads: int
    total_views: int
    notes_by_year: Dict[str, int]
    top_subjects: List[Dict[str, Any]]
    top_uploaders: List[Dict[str, Any]]


# My Notes Models
class MyNoteResponse(NoteResponse):
    """Extended note response for user's own notes"""
    moderation_notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class MyNotesListResponse(BaseModel):
    notes: List[MyNoteResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Summary stats
    total_approved: int
    total_pending: int
    total_rejected: int
    total_downloads: int
    total_views: int
