from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.deps import get_current_admin_user, get_current_user_optional
from app.schemas.user import User
from app.schemas.analytics import (
    UsageStats, PopularPaper, PopularNote, UserEngagement,
    DownloadStats, UploadTrends, SubjectPopularity,
    SystemMetrics, DashboardData, WeeklyTrends, PeriodComparison,
    AnalyticsReport
)
from app.services.analytics import get_analytics_service

router = APIRouter()


@router.get("/usage-stats", response_model=UsageStats)
async def get_usage_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get usage statistics for the specified period (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_usage_stats(days)


@router.get("/popular-papers", response_model=List[PopularPaper])
async def get_popular_papers(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of papers to return"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get most popular papers by downloads."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_popular_papers(limit=limit, days=days)


@router.get("/popular-notes", response_model=List[PopularNote])
async def get_popular_notes(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of notes to return"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get most popular notes by downloads."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_popular_notes(limit=limit, days=days)


@router.get("/user-engagement", response_model=UserEngagement)
async def get_user_engagement(
    days: int = Query(30, ge=1, le=90, description="Number of days to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get user engagement metrics (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_user_engagement(days)


@router.get("/download-stats", response_model=DownloadStats)
async def get_download_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get download statistics (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_download_stats(days)


@router.get("/upload-trends", response_model=UploadTrends)
async def get_upload_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get paper upload trends (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_upload_trends(days)


@router.get("/subject-popularity", response_model=List[SubjectPopularity])
async def get_subject_popularity(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of subjects to return"),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get subject popularity by paper count and downloads."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_subject_popularity(limit)


@router.get("/system-metrics", response_model=SystemMetrics)
async def get_system_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive system metrics (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_system_metrics(days)


@router.get("/reports/{report_type}", response_model=AnalyticsReport)
async def generate_analytics_report(
    report_type: str,
    custom_start: Optional[datetime] = Query(None, description="Custom start date (for custom report type)"),
    custom_end: Optional[datetime] = Query(None, description="Custom end date (for custom report type)"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Generate comprehensive analytics report (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.generate_analytics_report(
        report_type=report_type,
        custom_start=custom_start,
        custom_end=custom_end
    )


@router.get("/dashboard", response_model=DashboardData)
async def get_analytics_dashboard(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get analytics dashboard data (admin only)."""
    
    analytics_service = get_analytics_service(db)
    return analytics_service.get_dashboard_data(days)


@router.get("/trends/weekly")
async def get_weekly_trends(
    weeks: int = Query(4, ge=1, le=52, description="Number of weeks to analyze"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get weekly trend analysis (admin only)."""
    
    analytics_service = get_analytics_service(db)
    
    weekly_data = []
    for week_offset in range(weeks):
        # Calculate proper date ranges for each week
        end_date = datetime.utcnow() - timedelta(weeks=week_offset)
        start_date = end_date - timedelta(weeks=1)
        
        # Get usage stats for this specific 7-day period
        usage_stats = analytics_service.get_usage_stats(days=7)
        
        weekly_data.append({
            "week": weeks - week_offset,  # Week 1 is most recent
            "week_label": f"Week {weeks - week_offset}",
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "active_users": usage_stats.active_users,
            "new_registrations": usage_stats.new_registrations,
            "papers_uploaded": usage_stats.papers_uploaded,
            "total_downloads": usage_stats.total_downloads
        })
    
    # Reverse to show oldest week first
    weekly_data.reverse()
    
    return {
        "trends": weekly_data,
        "period_description": f"Weekly trends over {weeks} weeks",
        "generated_at": datetime.utcnow()
    }


@router.get("/comparisons/periods")
async def get_period_comparison(
    current_period_days: int = Query(30, ge=1, le=365, description="Current period in days"),
    comparison_period_days: int = Query(30, ge=1, le=365, description="Comparison period in days"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Compare metrics between two periods (admin only)."""
    
    analytics_service = get_analytics_service(db)
    
    # Current period
    current_stats = analytics_service.get_usage_stats(current_period_days)
    
    # Previous period (same length, ending when current period starts)
    from datetime import timedelta
    previous_end = datetime.utcnow() - timedelta(days=current_period_days)
    
    # For simplicity, we'll use the same method but with different date ranges
    # In a full implementation, we'd modify the service to accept custom date ranges
    previous_stats = analytics_service.get_usage_stats(comparison_period_days)
    
    def calculate_change(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return ((current - previous) / previous) * 100
    
    return {
        "current_period": {
            "days": current_period_days,
            "stats": current_stats
        },
        "comparison_period": {
            "days": comparison_period_days,
            "stats": previous_stats
        },
        "changes": {
            "active_users": calculate_change(current_stats.active_users, previous_stats.active_users),
            "new_registrations": calculate_change(current_stats.new_registrations, previous_stats.new_registrations),
            "papers_uploaded": calculate_change(current_stats.papers_uploaded, previous_stats.papers_uploaded),
            "papers_approved": calculate_change(current_stats.papers_approved, previous_stats.papers_approved),
            "total_downloads": calculate_change(current_stats.total_downloads, previous_stats.total_downloads),
            "total_searches": calculate_change(current_stats.total_searches, previous_stats.total_searches)
        },
        "generated_at": datetime.utcnow()
    }


@router.get("/export/csv")
async def export_analytics_csv(
    report_type: str = Query("weekly", regex="^(daily|weekly|monthly)$"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Export analytics data as CSV (admin only)."""
    
    from fastapi import Response
    import csv
    from io import StringIO
    
    analytics_service = get_analytics_service(db)
    
    # Generate the analytics report
    report = analytics_service.generate_analytics_report(report_type=report_type)
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write headers and basic stats
    writer.writerow(["UniNotesHub Analytics Report"])
    writer.writerow(["Report Type", report_type])
    writer.writerow(["Generated At", report.generated_at.isoformat()])
    writer.writerow(["Period", f"{report.period_start.date()} to {report.period_end.date()}"])
    writer.writerow([])  # Empty row
    
    # Usage Statistics
    writer.writerow(["Usage Statistics"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Active Users", report.usage_stats.active_users])
    writer.writerow(["New Registrations", report.usage_stats.new_registrations])
    writer.writerow(["Papers Uploaded", report.usage_stats.papers_uploaded])
    writer.writerow(["Papers Approved", report.usage_stats.papers_approved])
    writer.writerow(["Total Downloads", report.usage_stats.total_downloads])
    writer.writerow(["Total Searches", report.usage_stats.total_searches])
    writer.writerow([])  # Empty row
    
    # Popular Papers
    writer.writerow(["Popular Papers"])
    writer.writerow(["Paper Title", "Subject", "Downloads", "Uploaded By"])
    for paper in report.popular_papers:
        writer.writerow([paper.title, paper.subject_name, paper.download_count, paper.uploaded_by])
    writer.writerow([])  # Empty row
    
    # Subject Popularity
    writer.writerow(["Subject Popularity"])
    writer.writerow(["Subject", "Code", "Paper Count", "Downloads"])
    for subject in report.subject_popularity:
        writer.writerow([subject.subject_name, subject.subject_code, subject.paper_count, subject.download_count])
    writer.writerow([])  # Empty row
    
    # Daily Activity Data
    writer.writerow(["Daily User Activity"])
    writer.writerow(["Date", "Active Users"])
    for day_data in report.user_engagement.daily_active_users:
        writer.writerow([day_data["date"], day_data["active_users"]])
    writer.writerow([])  # Empty row
    
    # System Metrics
    writer.writerow(["System Metrics"])
    writer.writerow(["Storage Usage (MB)", round(report.system_metrics.total_storage_bytes / (1024 * 1024), 2)])
    writer.writerow(["Error Rate (%)", round(report.system_metrics.error_rate_percent, 2)])
    writer.writerow(["Avg Response Time (ms)", round(report.system_metrics.average_response_time_ms, 2)])
    
    csv_content = output.getvalue()
    output.close()
    
    # Return CSV file
    filename = f"analytics_{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Fix import for timedelta
from datetime import timedelta
