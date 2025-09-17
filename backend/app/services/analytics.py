from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
import logging

from app.db.models import User, Paper, PaperStatus, Subject, Note, NoteStatus, NoteDownload
from app.schemas.analytics import (
    DashboardData, PopularPaper, PopularNote, UserEngagement,
    DownloadStats, UploadTrends, SubjectPopularity,
    SystemMetrics, UsageStats, WeeklyTrends, PeriodComparison,
    AnalyticsReport
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_usage_stats(self, days: int = 30) -> UsageStats:
        """Get usage statistics for the specified period."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Active users (all users are valid with OTP authentication)
        active_users = self.db.query(User).count()
        
        # New registrations
        new_registrations = self.db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Papers uploaded
        papers_uploaded = self.db.query(Paper).filter(
            Paper.created_at >= start_date
        ).count()
        
        # Papers approved
        papers_approved = self.db.query(Paper).filter(
            and_(
                Paper.created_at >= start_date,
                Paper.status == PaperStatus.APPROVED
            )
        ).count()
        
        # Notes uploaded
        notes_uploaded = self.db.query(Note).filter(
            Note.created_at >= start_date
        ).count()
        
        # Notes approved
        notes_approved = self.db.query(Note).filter(
            and_(
                Note.created_at >= start_date,
                Note.status == NoteStatus.APPROVED
            )
        ).count()
        
        # Simulate downloads and searches (including notes)
        paper_downloads = papers_uploaded * 8  # Estimate 8 downloads per paper upload
        note_downloads = notes_uploaded * 6   # Estimate 6 downloads per note upload
        total_downloads = paper_downloads + note_downloads
        searches = total_downloads * 3  # Estimate 3 searches per download
        
        return UsageStats(
            period_days=days,
            active_users=active_users,
            new_registrations=new_registrations,
            papers_uploaded=papers_uploaded,
            papers_approved=papers_approved,
            notes_uploaded=notes_uploaded,
            notes_approved=notes_approved,
            total_downloads=total_downloads,
            total_searches=searches,
            start_date=start_date,
            end_date=end_date
        )

    def get_dashboard_data(self, days: int = 30) -> DashboardData:
        """Get main dashboard overview data."""
        
        from app.db.models import Download, University
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Total counts
        total_users = self.db.query(User).count()
        total_papers = self.db.query(Paper).count()
        total_notes = self.db.query(Note).count()
        total_universities = self.db.query(University).count()
        active_users = self.db.query(User).count()  # All users are active with OTP auth
        
        # Paper status counts
        approved_papers = self.db.query(Paper).filter(Paper.status == PaperStatus.APPROVED).count()
        pending_papers = self.db.query(Paper).filter(Paper.status == PaperStatus.PENDING).count()
        rejected_papers = self.db.query(Paper).filter(Paper.status == PaperStatus.REJECTED).count()
        
        # Note status counts
        approved_notes = self.db.query(Note).filter(Note.status == NoteStatus.APPROVED).count()
        pending_notes = self.db.query(Note).filter(Note.status == NoteStatus.PENDING).count()
        rejected_notes = self.db.query(Note).filter(Note.status == NoteStatus.REJECTED).count()
        
        # Recent uploads in period
        recent_uploads = self.db.query(Paper).filter(
            Paper.created_at >= start_date
        ).count()
        
        # Real download count from Download table
        total_downloads = self.db.query(Download).count()
        
        # Growth metrics (compare with previous period)
        prev_start = start_date - timedelta(days=days)
        
        # User growth in the current period
        current_users = self.db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Previous period user count for comparison
        prev_users = self.db.query(User).filter(
            User.created_at >= prev_start,
            User.created_at < start_date
        ).count()
        
        # Paper growth in the current period
        current_papers = self.db.query(Paper).filter(
            Paper.created_at >= start_date
        ).count()
        
        # Previous period paper count for comparison
        prev_papers = self.db.query(Paper).filter(
            Paper.created_at >= prev_start,
            Paper.created_at < start_date
        ).count()
        
        # Notes growth in the current period
        current_notes = self.db.query(Note).filter(
            Note.created_at >= start_date
        ).count()
        
        # Previous period note count for comparison
        prev_notes = self.db.query(Note).filter(
            Note.created_at >= prev_start,
            Note.created_at < start_date
        ).count()
        
        # Download growth in the current period
        current_downloads = self.db.query(Download).filter(
            Download.created_at >= start_date
        ).count()
        
        # Previous period download count for comparison
        prev_downloads = self.db.query(Download).filter(
            Download.created_at >= prev_start,
            Download.created_at < start_date
        ).count()
        
        # Calculate growth rates
        user_growth = current_users - prev_users
        paper_growth = current_papers - prev_papers
        notes_growth = current_notes - prev_notes
        download_growth = current_downloads - prev_downloads
        
        return DashboardData(
            total_users=total_users,
            total_papers=total_papers,
            total_notes=total_notes,
            total_downloads=total_downloads,
            total_universities=total_universities,
            active_users=active_users,
            recent_uploads=recent_uploads,
            pending_papers=pending_papers,
            approved_papers=approved_papers,
            rejected_papers=rejected_papers,
            pending_notes=pending_notes,
            approved_notes=approved_notes,
            rejected_notes=rejected_notes,
            user_growth=user_growth,
            paper_growth=paper_growth,
            notes_growth=notes_growth,
            download_growth=download_growth
        )

    def get_popular_papers(self, limit: int = 10, days: int = 30) -> List[PopularPaper]:
        """Get popular papers by actual download count."""
        
        from app.db.models import Download
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days) if days else datetime.min
        
        # Get papers with actual download counts
        if days:
            # For a specific period, count downloads in that period
            papers_with_downloads = self.db.query(
                Paper.id,
                Paper.title,
                Paper.created_at,
                Paper.subject_id,
                Paper.uploader_id,
                func.count(Download.id).label('download_count')
            ).outerjoin(
                Download, and_(
                    Paper.id == Download.paper_id,
                    Download.created_at >= start_date
                )
            ).filter(
                Paper.status == PaperStatus.APPROVED
            ).group_by(
                Paper.id, Paper.title, Paper.created_at, Paper.subject_id, Paper.uploader_id
            ).order_by(
                desc('download_count')
            ).limit(limit).all()
        else:
            # For all time, use the cached download_count or count all downloads
            papers_with_downloads = self.db.query(
                Paper.id,
                Paper.title,
                Paper.created_at,
                Paper.subject_id,
                Paper.uploader_id,
                func.coalesce(Paper.download_count, func.count(Download.id)).label('download_count')
            ).outerjoin(
                Download, Paper.id == Download.paper_id
            ).filter(
                Paper.status == PaperStatus.APPROVED
            ).group_by(
                Paper.id, Paper.title, Paper.created_at, Paper.subject_id, Paper.uploader_id, Paper.download_count
            ).order_by(
                desc('download_count')
            ).limit(limit).all()
        
        popular_papers = []
        for paper_data in papers_with_downloads:
            paper_id, title, created_at, subject_id, uploader_id, download_count = paper_data
            
            # If no downloads, set to 0
            actual_downloads = download_count or 0
            
            # Get uploader info
            uploader_name = None
            try:
                if uploader_id:
                    uploader = self.db.query(User).filter(User.id == uploader_id).first()
                    if uploader:
                        uploader_name = f"{uploader.first_name or ''} {uploader.last_name or ''}" .strip() or uploader.email.split('@')[0]
            except:
                pass
            
            # Get subject info
            subject_name = None
            try:
                if subject_id:
                    subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
                    if subject:
                        subject_name = subject.name
            except:
                pass
            
            # Get university info through Subject -> Semester -> Branch -> Program -> University
            university_name = None
            try:
                if subject_id:
                    from app.db.models import University, Program, Branch, Semester
                    # Use a join query to get university name efficiently
                    university_query = self.db.query(University.name).join(
                        Program, University.id == Program.university_id
                    ).join(
                        Branch, Program.id == Branch.program_id
                    ).join(
                        Semester, Branch.id == Semester.branch_id
                    ).join(
                        Subject, Semester.id == Subject.semester_id
                    ).filter(
                        Subject.id == subject_id
                    ).first()
                    
                    if university_query:
                        university_name = university_query[0]
            except Exception as e:
                logger.debug(f"Error getting university for paper {paper_id}: {e}")
            
            popular_papers.append(PopularPaper(
                id=str(paper_id),
                title=title,
                downloads=actual_downloads,
                subject=subject_name or "General",
                university=university_name or "Unknown University",
                uploader_name=uploader_name,
                upload_date=created_at
            ))
        
        # Already ordered by download_count in query, so just return
        return popular_papers

    def get_popular_notes(self, limit: int = 10, days: int = 30) -> List[PopularNote]:
        """Get popular notes by download count (simulated since we don't have actual note downloads yet)."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days) if days else datetime.min
        
        # Get notes with simulated download counts based on creation date and status
        if days:
            notes_query = self.db.query(
                Note.id,
                Note.title,
                Note.created_at,
                Note.subject_id,
                Note.uploader_id
            ).filter(
                Note.status == NoteStatus.APPROVED,
                Note.created_at >= start_date
            ).order_by(desc(Note.created_at)).limit(limit * 2)  # Get more to simulate variety
        else:
            notes_query = self.db.query(
                Note.id,
                Note.title,
                Note.created_at,
                Note.subject_id,
                Note.uploader_id
            ).filter(
                Note.status == NoteStatus.APPROVED
            ).order_by(desc(Note.created_at)).limit(limit * 2)
        
        popular_notes = []
        for note_data in notes_query.all():
            note_id, title, created_at, subject_id, uploader_id = note_data
            
            # Simulate download count based on note age and ID (for consistency)
            days_old = (datetime.utcnow() - created_at).days
            simulated_downloads = max(1, (hash(str(note_id)) % 50) + max(0, 30 - days_old))
            
            # Get uploader info
            uploader_name = None
            try:
                if uploader_id:
                    uploader = self.db.query(User).filter(User.id == uploader_id).first()
                    if uploader:
                        uploader_name = f"{uploader.first_name or ''} {uploader.last_name or ''}" .strip() or uploader.email.split('@')[0]
            except:
                pass
            
            # Get subject info
            subject_name = None
            try:
                if subject_id:
                    subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
                    if subject:
                        subject_name = subject.name
            except:
                pass
            
            # Get university info through Subject -> Semester -> Branch -> Program -> University
            university_name = None
            try:
                if subject_id:
                    from app.db.models import University, Program, Branch, Semester
                    # Use a join query to get university name efficiently
                    university_query = self.db.query(University.name).join(
                        Program, University.id == Program.university_id
                    ).join(
                        Branch, Program.id == Branch.program_id
                    ).join(
                        Semester, Branch.id == Semester.branch_id
                    ).join(
                        Subject, Semester.id == Subject.semester_id
                    ).filter(
                        Subject.id == subject_id
                    ).first()
                    
                    if university_query:
                        university_name = university_query[0]
            except Exception as e:
                logger.debug(f"Error getting university for note {note_id}: {e}")
            
            popular_notes.append(PopularNote(
                id=str(note_id),
                title=title,
                downloads=simulated_downloads,
                subject=subject_name or "General",
                university=university_name or "Unknown University",
                uploader_name=uploader_name,
                upload_date=created_at
            ))
        
        # Sort by downloads descending and limit to requested amount
        popular_notes.sort(key=lambda x: x.downloads, reverse=True)
        return popular_notes[:limit]

    def get_user_engagement(self, days: int = 30) -> UserEngagement:
        """Get user engagement metrics."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).count()  # All users are active with OTP auth
        
        new_users = self.db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        # Calculate engagement metrics
        engagement_rate = (active_users / max(total_users, 1)) * 100
        retention_rate = max(60, 100 - (new_users / max(total_users, 1)) * 100)  # Simulate retention
        daily_active_users = max(1, active_users // 7)  # Estimate daily actives
        
        # Simulate session duration and bounce rate
        avg_session_duration = 15 * 60  # 15 minutes in seconds
        bounce_rate = max(20, 60 - engagement_rate)  # Inverse relationship
        
        # Calculate growth
        prev_period_actives = max(1, active_users - new_users)
        activity_growth = ((active_users - prev_period_actives) / prev_period_actives) * 100
        
        return UserEngagement(
            total_users=total_users,
            active_users=active_users,
            daily_active_users=daily_active_users,
            new_users=new_users,
            retention_rate=round(retention_rate, 1),
            engagement_rate=round(engagement_rate, 1),
            avg_session_duration=avg_session_duration,
            bounce_rate=round(bounce_rate, 1),
            activity_growth=round(activity_growth, 1)
        )

    def get_download_stats(self, days: int = 30) -> DownloadStats:
        """Get download statistics."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get paper count as basis for simulation
        total_papers = self.db.query(Paper).filter(
            Paper.status == PaperStatus.APPROVED
        ).count()
        
        recent_papers = self.db.query(Paper).filter(
            Paper.created_at >= start_date,
            Paper.status == PaperStatus.APPROVED
        ).count()
        
        active_users = self.db.query(User).count()  # All users are active with OTP auth
        
        # Simulate download stats
        total_downloads = total_papers * 8  # Average downloads per paper
        unique_downloaders = min(active_users, total_downloads // 3)  # Some users download multiple
        avg_downloads_per_user = total_downloads / max(unique_downloaders, 1)
        
        # Calculate growth rate
        prev_period_downloads = (total_papers - recent_papers) * 8
        growth_rate = ((total_downloads - prev_period_downloads) / max(prev_period_downloads, 1)) * 100 if prev_period_downloads > 0 else 0
        
        # Generate daily download data
        daily_downloads = []
        for i in range(min(days, 30)):  # Last 30 days max
            date = start_date + timedelta(days=i)
            daily_count = max(1, int(total_downloads / days + (hash(str(date)) % 20 - 10)))
            daily_downloads.append({
                "date": date.strftime("%Y-%m-%d"),
                "downloads": daily_count
            })
        
        return DownloadStats(
            total_downloads=total_downloads,
            unique_downloaders=unique_downloaders,
            avg_downloads_per_user=round(avg_downloads_per_user, 2),
            growth_rate=round(growth_rate, 2),
            daily_downloads=daily_downloads,
            popular_times=[
                {"hour": 10, "downloads": total_downloads // 20},
                {"hour": 14, "downloads": total_downloads // 15},
                {"hour": 16, "downloads": total_downloads // 18},
                {"hour": 20, "downloads": total_downloads // 25}
            ]
        )

    def get_upload_trends(self, days: int = 30) -> UploadTrends:
        """Get upload trends and statistics."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        total_uploads = self.db.query(Paper).count()
        recent_uploads = self.db.query(Paper).filter(
            Paper.created_at >= start_date
        ).count()
        
        avg_per_day = recent_uploads / max(days, 1)
        
        # Calculate growth
        prev_start = start_date - timedelta(days=days)
        prev_uploads = self.db.query(Paper).filter(
            Paper.created_at >= prev_start,
            Paper.created_at < start_date
        ).count()
        
        upload_growth = ((recent_uploads - prev_uploads) / max(prev_uploads, 1)) * 100 if prev_uploads > 0 else 0
        
        # Generate daily upload data
        daily_uploads = []
        for i in range(min(days, 30)):
            date = start_date + timedelta(days=i)
            daily_count = max(0, int(avg_per_day + (hash(str(date)) % 5 - 2)))
            daily_uploads.append({
                "date": date.strftime("%Y-%m-%d"),
                "uploads": daily_count
            })
        
        # Get top uploaders
        top_uploaders_query = self.db.query(
            User.id, User.first_name, User.last_name, User.email,
            func.count(Paper.id).label('upload_count')
        ).join(Paper, User.id == Paper.uploader_id).group_by(
            User.id, User.first_name, User.last_name, User.email
        ).order_by(desc('upload_count')).limit(5)
        
        top_uploaders = []
        for user_id, first_name, last_name, email, count in top_uploaders_query.all():
            name = f"{first_name or ''} {last_name or ''}" .strip() or email.split('@')[0]
            top_uploaders.append({
                "user_id": str(user_id),
                "name": name,
                "upload_count": count
            })
        
        return UploadTrends(
            total_uploads=total_uploads,
            recent_uploads=recent_uploads,
            avg_per_day=round(avg_per_day, 2),
            upload_growth=round(upload_growth, 2),
            daily_uploads=daily_uploads,
            top_uploaders=top_uploaders
        )

    def get_subject_popularity(self, limit: int = 20) -> List[SubjectPopularity]:
        """Get subject popularity by paper count."""
        
        # Count papers per subject
        from app.db.models import Subject
        
        try:
            subject_stats = self.db.query(
                Subject.id,
                Subject.name,
                Subject.code,
                func.count(Paper.id).label('paper_count')
            ).join(
                Paper, Subject.id == Paper.subject_id
            ).filter(
                Paper.status == PaperStatus.APPROVED
            ).group_by(
                Subject.id, Subject.name, Subject.code
            ).order_by(
                desc('paper_count')
            ).limit(limit).all()
            
            result = []
            for subject_id, name, code, paper_count in subject_stats:
                # Simulate download count based on paper count
                downloads = paper_count * 12  # Average downloads per paper for subject
                
                result.append(SubjectPopularity(
                    id=str(subject_id),
                    name=name,
                    code=code,
                    paper_count=paper_count,
                    downloads=downloads,
                    avg_rating=4.2  # Simulated rating
                ))
            
            return result
        except Exception as e:
            logger.error(f"Error getting subject popularity: {e}")
            return []

    def get_system_metrics(self, days: int = 30) -> SystemMetrics:
        """Get system performance metrics."""
        
        # Simulate system metrics
        return SystemMetrics(
            avg_response_time=145.5,  # ms
            uptime=99.8,  # percentage
            error_rate=0.05,  # percentage
            peak_concurrent_users=250,
            storage_used_mb=1024 * 15,  # 15 GB
            bandwidth_used_mb=1024 * 5   # 5 GB
        )

    def generate_analytics_report(
        self, 
        report_type: str = "weekly",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None
    ) -> AnalyticsReport:
        """Generate comprehensive analytics report."""
        
        if report_type == "daily":
            days = 1
        elif report_type == "weekly":
            days = 7
        elif report_type == "monthly":
            days = 30
        elif report_type == "custom" and custom_start and custom_end:
            days = (custom_end - custom_start).days
        else:
            days = 7
        
        # Get all analytics data
        usage_stats = self.get_usage_stats(days)
        popular_papers = self.get_popular_papers(limit=10, days=days)
        user_engagement = self.get_user_engagement(days)
        download_stats = self.get_download_stats(days)
        upload_trends = self.get_upload_trends(days)
        subject_popularity = self.get_subject_popularity(limit=15)
        system_metrics = self.get_system_metrics(days)
        
        return AnalyticsReport(
            report_type=report_type,
            generated_at=datetime.utcnow(),
            period_start=custom_start or usage_stats.start_date,
            period_end=custom_end or usage_stats.end_date,
            usage_stats=usage_stats,
            popular_papers=popular_papers,
            user_engagement=user_engagement,
            download_stats=download_stats,
            upload_trends=upload_trends,
            subject_popularity=subject_popularity,
            system_metrics=system_metrics
        )
    
    def _calculate_storage_usage(self) -> int:
        """Calculate total storage usage in bytes."""
        try:
            # Get total file size from papers (assuming average file size)
            paper_count = self.db.query(Paper).count()
            
            # Estimate: average paper size is 2MB
            average_paper_size_bytes = 2 * 1024 * 1024  # 2 MB
            
            # Try to get actual storage from config or use estimate
            total_storage = paper_count * average_paper_size_bytes
            
            return total_storage
        except Exception as e:
            logger.error(f"Error calculating storage usage: {e}")
            # Fallback estimate: 100MB
            return 100 * 1024 * 1024
    
    def get_weekly_trends(self, weeks: int = 4) -> List[WeeklyTrends]:
        """Get weekly trends data."""
        
        trends = []
        end_date = datetime.utcnow()
        
        for week in range(weeks):
            week_start = end_date - timedelta(weeks=(week + 1))
            week_end = week_start + timedelta(days=7)
            
            users = self.db.query(User).filter(
                User.created_at >= week_start,
                User.created_at < week_end
            ).count()
            
            papers = self.db.query(Paper).filter(
                Paper.created_at >= week_start,
                Paper.created_at < week_end
            ).count()
            
            notes = self.db.query(Note).filter(
                Note.created_at >= week_start,
                Note.created_at < week_end
            ).count()
            
            # Simulate downloads
            downloads = papers * 8 + notes * 6
            
            trends.insert(0, WeeklyTrends(
                week_start=week_start,
                users=users,
                papers=papers,
                notes=notes,
                downloads=downloads
            ))
        
        return trends
    
    def get_period_comparison(self, current_days: int = 30, comparison_days: int = 30) -> PeriodComparison:
        """Get period comparison data."""
        
        end_date = datetime.utcnow()
        current_start = end_date - timedelta(days=current_days)
        prev_start = current_start - timedelta(days=comparison_days)
        
        # Current period metrics
        current_users = self.db.query(User).filter(User.created_at >= current_start).count()
        current_papers = self.db.query(Paper).filter(Paper.created_at >= current_start).count()
        current_downloads = current_papers * 8  # Estimate
        
        # Previous period metrics
        prev_users = self.db.query(User).filter(
            User.created_at >= prev_start,
            User.created_at < current_start
        ).count()
        prev_papers = self.db.query(Paper).filter(
            Paper.created_at >= prev_start,
            Paper.created_at < current_start
        ).count()
        prev_downloads = prev_papers * 8  # Estimate
        
        # Calculate growth rates
        user_growth = ((current_users - prev_users) / max(prev_users, 1)) * 100 if prev_users > 0 else 0
        paper_growth = ((current_papers - prev_papers) / max(prev_papers, 1)) * 100 if prev_papers > 0 else 0
        download_growth = ((current_downloads - prev_downloads) / max(prev_downloads, 1)) * 100 if prev_downloads > 0 else 0
        
        return PeriodComparison(
            current_period={
                "users": current_users,
                "papers": current_papers,
                "downloads": current_downloads
            },
            previous_period={
                "users": prev_users,
                "papers": prev_papers,
                "downloads": prev_downloads
            },
            growth_rates={
                "users": round(user_growth, 2),
                "papers": round(paper_growth, 2),
                "downloads": round(download_growth, 2)
            }
        )
    
    def export_analytics_data(self, export_type: str, params: Dict[str, Any]) -> str:
        """Export analytics data in specified format."""
        
        # This would implement actual data export
        # For now, return a placeholder
        return f"Analytics data exported: {export_type}"

    def generate_custom_report(self, report_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a custom analytics report."""
        
        # This would implement custom report generation
        # For now, return basic data
        return {
            "report_name": report_config.get("report_name", "Custom Report"),
            "generated_at": datetime.utcnow(),
            "data": "Custom report data would be here"
        }


def get_analytics_service(db: Session) -> AnalyticsService:
    """Get analytics service instance."""
    return AnalyticsService(db)
