from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class UsageStats(BaseModel):
    """Usage statistics schema."""
    
    period_days: int = Field(..., description="Number of days in period")
    active_users: int = Field(..., description="Number of active users")
    new_registrations: int = Field(..., description="Number of new registrations")
    papers_uploaded: int = Field(..., description="Number of papers uploaded")
    papers_approved: int = Field(..., description="Number of papers approved")
    notes_uploaded: int = Field(..., description="Number of notes uploaded")
    notes_approved: int = Field(..., description="Number of notes approved")
    total_downloads: int = Field(..., description="Total downloads")
    total_searches: int = Field(..., description="Total searches")
    start_date: datetime = Field(..., description="Period start date")
    end_date: datetime = Field(..., description="Period end date")


class PopularPaper(BaseModel):
    """Popular papers schema."""
    
    id: str = Field(..., description="Paper ID")
    title: str = Field(..., description="Paper title")
    downloads: int = Field(..., description="Number of downloads")
    subject: Optional[str] = Field(None, description="Subject name")
    university: Optional[str] = Field(None, description="University name")
    uploader_name: Optional[str] = Field(None, description="Uploader name")
    upload_date: datetime = Field(..., description="Upload date")


class PopularNote(BaseModel):
    """Popular notes schema."""
    
    id: str = Field(..., description="Note ID")
    title: str = Field(..., description="Note title")
    downloads: int = Field(..., description="Number of downloads")
    subject: Optional[str] = Field(None, description="Subject name")
    university: Optional[str] = Field(None, description="University name")
    uploader_name: Optional[str] = Field(None, description="Uploader name")
    upload_date: datetime = Field(..., description="Upload date")


class UserEngagement(BaseModel):
    """User engagement metrics schema."""
    
    total_users: int = Field(..., description="Total registered users")
    active_users: int = Field(..., description="Active users in period")
    daily_active_users: int = Field(..., description="Daily active users average")
    new_users: int = Field(..., description="New user registrations")
    retention_rate: float = Field(..., description="User retention rate percentage")
    engagement_rate: float = Field(..., description="User engagement rate percentage")
    avg_session_duration: Optional[int] = Field(None, description="Average session duration in seconds")
    bounce_rate: Optional[float] = Field(None, description="Bounce rate percentage")
    activity_growth: Optional[float] = Field(None, description="Activity growth rate")


class DownloadStats(BaseModel):
    """Download statistics schema."""
    
    total_downloads: int = Field(..., description="Total downloads")
    unique_downloaders: int = Field(..., description="Number of unique downloaders")
    avg_downloads_per_user: float = Field(..., description="Average downloads per user")
    growth_rate: Optional[float] = Field(None, description="Growth rate percentage")
    daily_downloads: List[Dict[str, Any]] = Field([], description="Daily download data")
    popular_times: List[Dict[str, Any]] = Field([], description="Popular download times")


class UploadTrends(BaseModel):
    """Upload trends schema."""
    
    total_uploads: int = Field(..., description="Total uploads in period")
    recent_uploads: int = Field(..., description="Recent uploads count")
    avg_per_day: float = Field(..., description="Average uploads per day")
    upload_growth: Optional[float] = Field(None, description="Upload growth rate")
    daily_uploads: List[Dict[str, Any]] = Field([], description="Daily upload data")
    top_uploaders: List[Dict[str, Any]] = Field([], description="Top uploading users")


class SubjectPopularity(BaseModel):
    """Subject popularity schema."""
    
    id: str = Field(..., description="Subject ID")
    name: str = Field(..., description="Subject name")
    code: Optional[str] = Field(None, description="Subject code")
    paper_count: int = Field(..., description="Number of papers")
    downloads: int = Field(..., description="Number of downloads")
    avg_rating: Optional[float] = Field(None, description="Average rating")


class SystemMetrics(BaseModel):
    """System metrics schema."""
    
    avg_response_time: float = Field(..., description="Average response time in ms")
    uptime: float = Field(..., description="System uptime percentage")
    error_rate: float = Field(..., description="Error rate")
    peak_concurrent_users: int = Field(..., description="Peak concurrent users")
    storage_used_mb: float = Field(..., description="Storage used in MB")
    bandwidth_used_mb: float = Field(..., description="Bandwidth used in MB")


class DashboardData(BaseModel):
    """Dashboard overview data."""
    
    total_users: int = Field(..., description="Total number of users")
    total_papers: int = Field(..., description="Total number of papers")
    total_notes: int = Field(..., description="Total number of notes")
    total_downloads: int = Field(..., description="Total number of downloads")
    total_universities: int = Field(..., description="Total number of universities")
    active_users: int = Field(..., description="Number of active users")
    recent_uploads: int = Field(..., description="Recent uploads count")
    pending_papers: int = Field(..., description="Number of pending papers")
    approved_papers: int = Field(..., description="Number of approved papers")
    rejected_papers: int = Field(..., description="Number of rejected papers")
    pending_notes: int = Field(..., description="Number of pending notes")
    approved_notes: int = Field(..., description="Number of approved notes")
    rejected_notes: int = Field(..., description="Number of rejected notes")
    
    # Growth metrics
    user_growth: Optional[int] = Field(None, description="User growth in selected period")
    paper_growth: Optional[int] = Field(None, description="Paper growth in selected period")
    notes_growth: Optional[int] = Field(None, description="Notes growth in selected period")
    download_growth: Optional[int] = Field(None, description="Download growth in selected period")


class WeeklyTrends(BaseModel):
    """Weekly trends data."""
    
    week_start: datetime = Field(..., description="Week start date")
    users: int = Field(..., description="Users this week")
    papers: int = Field(..., description="Papers this week")
    notes: int = Field(..., description="Notes this week")
    downloads: int = Field(..., description="Downloads this week")


class PeriodComparison(BaseModel):
    """Period comparison data."""
    
    current_period: Dict[str, Any] = Field(..., description="Current period metrics")
    previous_period: Dict[str, Any] = Field(..., description="Previous period metrics")
    growth_rates: Dict[str, float] = Field(..., description="Growth rates between periods")


class AnalyticsReport(BaseModel):
    """Comprehensive analytics report schema."""
    
    report_type: str = Field(..., description="Type of report")
    generated_at: datetime = Field(..., description="Report generation timestamp")
    period_start: datetime = Field(..., description="Report period start")
    period_end: datetime = Field(..., description="Report period end")
    
    usage_stats: UsageStats = Field(..., description="Usage statistics")
    popular_papers: List[PopularPaper] = Field(..., description="Popular papers")
    user_engagement: UserEngagement = Field(..., description="User engagement metrics")
    download_stats: DownloadStats = Field(..., description="Download statistics")
    upload_trends: UploadTrends = Field(..., description="Upload trends")
    subject_popularity: List[SubjectPopularity] = Field(..., description="Subject popularity")
    system_metrics: SystemMetrics = Field(..., description="System metrics")


class RetentionAnalysis(BaseModel):
    """User retention analysis schema."""
    
    cohort_size: int = Field(..., description="Size of user cohort")
    cohort_start_date: datetime = Field(..., description="Cohort start date")
    retention_by_week: List[Dict[str, Any]] = Field(..., description="Weekly retention data")


class ConversionFunnel(BaseModel):
    """User conversion funnel schema."""
    
    total_registrations: int = Field(..., description="Total registrations")
    verified_users: int = Field(..., description="Verified users")
    users_with_uploads: int = Field(..., description="Users with uploads")
    users_with_approved: int = Field(..., description="Users with approved papers")
    verification_rate: float = Field(..., description="Verification rate percentage")
    upload_rate: float = Field(..., description="Upload rate percentage")
    approval_rate: float = Field(..., description="Approval rate percentage")


class GeographicDistribution(BaseModel):
    """Geographic distribution schema."""
    
    country: str = Field(..., description="Country name")
    user_count: int = Field(..., description="Number of users")


class ContentQualityMetrics(BaseModel):
    """Content quality metrics schema."""
    
    total_papers: int = Field(..., description="Total papers")
    approved_papers: int = Field(..., description="Approved papers")
    rejected_papers: int = Field(..., description="Rejected papers")
    pending_papers: int = Field(..., description="Pending papers")
    approval_rate: float = Field(..., description="Approval rate percentage")
    rejection_rate: float = Field(..., description="Rejection rate percentage")
    average_approval_time_hours: float = Field(..., description="Average approval time")


class DetailedAnalyticsReport(BaseModel):
    """Detailed analytics report with additional metrics."""
    
    report_type: str = Field(..., description="Type of report")
    generated_at: datetime = Field(..., description="Report generation timestamp")
    period_start: datetime = Field(..., description="Report period start")
    period_end: datetime = Field(..., description="Report period end")
    
    # Core metrics
    usage_stats: UsageStats = Field(..., description="Usage statistics")
    popular_papers: List[PopularPaper] = Field(..., description="Popular papers")
    user_engagement: UserEngagement = Field(..., description="User engagement metrics")
    download_stats: DownloadStats = Field(..., description="Download statistics")
    upload_trends: UploadTrends = Field(..., description="Upload trends")
    subject_popularity: List[SubjectPopularity] = Field(..., description="Subject popularity")
    system_metrics: SystemMetrics = Field(..., description="System metrics")
    
    # Advanced metrics
    retention_analysis: RetentionAnalysis = Field(..., description="User retention analysis")
    conversion_funnel: ConversionFunnel = Field(..., description="Conversion funnel")
    geographic_distribution: List[GeographicDistribution] = Field(..., description="Geographic distribution")
    content_quality_metrics: ContentQualityMetrics = Field(..., description="Content quality metrics")
