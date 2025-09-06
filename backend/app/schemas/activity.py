from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ActivityType(str, Enum):
    UPLOAD = "upload"
    BOOKMARK = "bookmark"
    DOWNLOAD = "download"
    RATING = "rating"


class ActivityCreate(BaseModel):
    type: ActivityType
    paper_id: Optional[str] = None
    note_id: Optional[str] = None
    metadata: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    type: str
    # Legacy paper fields for backward compatibility
    paper_id: Optional[str] = None
    paper_title: Optional[str] = None
    paper_subject: Optional[str] = None
    paper_university: Optional[str] = None
    # Note fields
    note_id: Optional[str] = None
    note_title: Optional[str] = None
    note_subject: Optional[str] = None
    note_university: Optional[str] = None
    # Unified content fields
    content_type: Optional[str] = None  # "paper" or "note"
    content_id: Optional[str] = None
    content_title: Optional[str] = None
    metadata: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class ActivityListResponse(BaseModel):
    activities: List[ActivityResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class ActivityStatsResponse(BaseModel):
    total_activities: int
    uploads: int
    bookmarks: int
    downloads: int
    ratings: int
    timeframe: str


class ActivityQueryParams(BaseModel):
    type: Optional[ActivityType] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
