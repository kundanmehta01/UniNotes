from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session
import pytz

from app.deps import get_current_user
from app.db.session import get_db
from app.db.models import UserActivity, ActivityTypeEnum, User, Paper, Note
from app.schemas.activity import (
    ActivityCreate, 
    ActivityResponse, 
    ActivityListResponse, 
    ActivityStatsResponse,
    ActivityType
)

router = APIRouter(prefix="/api/v1/activities", tags=["activities"])


def format_timestamp_utc(dt: datetime) -> str:
    """Format a datetime object as UTC ISO string with timezone info."""
    if dt is None:
        return None
    
    # If the datetime is naive, assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=pytz.UTC)
    # If it's not UTC, convert it to UTC
    elif dt.tzinfo != pytz.UTC:
        dt = dt.astimezone(pytz.UTC)
    
    # Return ISO format with 'Z' suffix to indicate UTC
    return dt.isoformat().replace('+00:00', 'Z')


@router.get("/me", response_model=ActivityListResponse)
async def get_user_activities(
    type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's activity history"""
    
    query = db.query(UserActivity).filter(UserActivity.user_id == current_user.id)
    
    # Apply filters
    if type:
        query = query.filter(UserActivity.activity_type == ActivityTypeEnum(type.value))
    
    if start_date:
        query = query.filter(UserActivity.created_at >= start_date)
    
    if end_date:
        query = query.filter(UserActivity.created_at <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    activities = (
        query.order_by(desc(UserActivity.created_at))
        .offset((page - 1) * limit)
        .limit(limit + 1)  # Fetch one extra to check if there are more
        .all()
    )
    
    # Check if there are more results
    has_more = len(activities) > limit
    if has_more:
        activities = activities[:-1]  # Remove the extra item
    
    # Convert to response format using the updated to_dict() method
    activity_responses = []
    for activity in activities:
        activity_dict = activity.to_dict()
        # Format the timestamp properly
        activity_dict["created_at"] = format_timestamp_utc(activity.created_at)
        activity_responses.append(ActivityResponse(**activity_dict))
    
    return ActivityListResponse(
        activities=activity_responses,
        total=total,
        page=page,
        limit=limit,
        has_more=has_more
    )


@router.post("/", response_model=ActivityResponse)
async def create_activity(
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a new user activity"""
    
    # Validate paper exists if paper_id is provided
    if activity_data.paper_id:
        paper = db.query(Paper).filter(Paper.id == activity_data.paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
    
    # Validate note exists if note_id is provided
    if activity_data.note_id:
        note = db.query(Note).filter(Note.id == activity_data.note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
    
    # Create the activity
    activity = UserActivity(
        user_id=current_user.id,
        activity_type=ActivityTypeEnum(activity_data.type.value),
        paper_id=activity_data.paper_id,
        note_id=activity_data.note_id,
        activity_metadata=activity_data.metadata
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    # Return the created activity using the updated to_dict() method
    activity_dict = activity.to_dict()
    activity_dict["created_at"] = format_timestamp_utc(activity.created_at)
    return ActivityResponse(**activity_dict)


@router.get("/stats", response_model=ActivityStatsResponse)
async def get_activity_stats(
    timeframe: str = Query("30d", regex="^(7d|30d|90d|1y)$", description="Time frame for stats"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user activity statistics"""
    
    # Calculate date range
    now = datetime.utcnow()
    if timeframe == "7d":
        start_date = now - timedelta(days=7)
    elif timeframe == "30d":
        start_date = now - timedelta(days=30)
    elif timeframe == "90d":
        start_date = now - timedelta(days=90)
    elif timeframe == "1y":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)  # Default
    
    # Base query
    base_query = db.query(UserActivity).filter(
        and_(
            UserActivity.user_id == current_user.id,
            UserActivity.created_at >= start_date
        )
    )
    
    # Get total activities
    total_activities = base_query.count()
    
    # Get activity counts by type
    uploads = base_query.filter(UserActivity.activity_type == ActivityTypeEnum.UPLOAD).count()
    bookmarks = base_query.filter(UserActivity.activity_type == ActivityTypeEnum.BOOKMARK).count()
    downloads = base_query.filter(UserActivity.activity_type == ActivityTypeEnum.DOWNLOAD).count()
    ratings = base_query.filter(UserActivity.activity_type == ActivityTypeEnum.RATING).count()
    
    return ActivityStatsResponse(
        total_activities=total_activities,
        uploads=uploads,
        bookmarks=bookmarks,
        downloads=downloads,
        ratings=ratings,
        timeframe=timeframe
    )


@router.delete("/me")
async def clear_user_activities(
    type: Optional[ActivityType] = Query(None, description="Activity type to clear (all if not specified)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear user's activity history"""
    
    query = db.query(UserActivity).filter(UserActivity.user_id == current_user.id)
    
    if type:
        query = query.filter(UserActivity.activity_type == ActivityTypeEnum(type.value))
    
    deleted_count = query.count()
    query.delete()
    db.commit()
    
    return {
        "message": f"Cleared {deleted_count} activities",
        "type_filter": type.value if type else "all"
    }
