from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.db.models import UserRole
from pydantic import EmailStr


class UserStats(BaseModel):
    """User statistics schema."""
    
    total_users: int = Field(..., description="Total number of users")
    active_users: int = Field(..., description="Number of active users")
    verified_users: int = Field(..., description="Number of verified users")
    users_by_role: Dict[str, int] = Field(..., description="User count by role")
    recent_registrations: int = Field(..., description="Registrations in last 30 days")


class StorageStats(BaseModel):
    """Storage statistics schema."""
    
    total_files: int = Field(..., description="Total number of files")
    total_size_bytes: int = Field(..., description="Total storage size in bytes")
    average_file_size: int = Field(..., description="Average file size in bytes")


class SystemStats(BaseModel):
    """System statistics schema."""
    
    total_papers: int = Field(..., description="Total number of papers")
    approved_papers: int = Field(..., description="Number of approved papers")
    pending_papers: int = Field(..., description="Number of pending papers")
    rejected_papers: int = Field(..., description="Number of rejected papers")
    recent_uploads: int = Field(..., description="Uploads in last 7 days")
    storage_stats: StorageStats = Field(..., description="Storage statistics")


class UserActivityLog(BaseModel):
    """User activity log schema."""
    
    timestamp: datetime = Field(..., description="Activity timestamp")
    action: str = Field(..., description="Action performed")
    resource_type: Optional[str] = Field(None, description="Type of resource affected")
    resource_id: Optional[str] = Field(None, description="ID of resource affected")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")


class BulkUserAction(BaseModel):
    """Bulk user action schema."""
    
    action: str = Field(..., description="Action to perform", 
                       pattern="^(activate|deactivate|verify|unverify|make_moderator|make_user)$")
    user_ids: List[str] = Field(..., description="List of user IDs")
    reason: Optional[str] = Field(None, description="Reason for bulk action")


class SystemConfig(BaseModel):
    """System configuration schema."""
    
    max_file_size_mb: int = Field(..., description="Maximum file size in MB")
    allowed_file_types: List[str] = Field(..., description="Allowed file extensions")
    max_daily_uploads: int = Field(..., description="Maximum uploads per user per day")
    auto_approval_enabled: bool = Field(..., description="Whether auto-approval is enabled")
    email_verification_required: bool = Field(..., description="Whether email verification is required")
    registration_enabled: bool = Field(..., description="Whether user registration is enabled")
    maintenance_mode: bool = Field(..., description="Whether system is in maintenance mode")


class SystemConfigUpdate(BaseModel):
    """System configuration update schema."""
    
    max_file_size_mb: Optional[int] = Field(None, description="Maximum file size in MB", ge=1, le=500)
    allowed_file_types: Optional[List[str]] = Field(None, description="Allowed file extensions")
    max_daily_uploads: Optional[int] = Field(None, description="Maximum uploads per user per day", ge=1, le=100)
    auto_approval_enabled: Optional[bool] = Field(None, description="Whether auto-approval is enabled")
    email_verification_required: Optional[bool] = Field(None, description="Whether email verification is required")
    registration_enabled: Optional[bool] = Field(None, description="Whether user registration is enabled")
    maintenance_mode: Optional[bool] = Field(None, description="Whether system is in maintenance mode")


class AdminUserList(BaseModel):
    """Admin user list response schema."""
    
    users: List[Dict[str, Any]] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page")
    pages: int = Field(..., description="Total pages")


class AuditLogEntry(BaseModel):
    """Audit log entry schema."""
    
    id: str = Field(..., description="Log entry ID")
    timestamp: datetime = Field(..., description="Log timestamp")
    user_id: Optional[str] = Field(None, description="User ID")
    username: Optional[str] = Field(None, description="Username")
    action: str = Field(..., description="Action performed")
    resource_type: Optional[str] = Field(None, description="Type of resource")
    resource_id: Optional[str] = Field(None, description="Resource ID")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")
    
    class Config:
        from_attributes = True


class ErrorLogEntry(BaseModel):
    """Error log entry schema."""
    
    timestamp: datetime = Field(..., description="Error timestamp")
    level: str = Field(..., description="Log level")
    message: str = Field(..., description="Error message")
    module: str = Field(..., description="Module where error occurred")
    traceback: Optional[str] = Field(None, description="Error traceback")


class BackupInfo(BaseModel):
    """Database backup information schema."""
    
    message: str = Field(..., description="Backup status message")
    backup_id: str = Field(..., description="Backup identifier")
    timestamp: datetime = Field(..., description="Backup timestamp")


class TokenCleanupResult(BaseModel):
    """Token cleanup result schema."""
    
    expired_tokens_removed: int = Field(..., description="Number of expired tokens removed")
    expired_sessions_removed: int = Field(..., description="Number of expired sessions removed")


class BulkActionResult(BaseModel):
    """Bulk action result schema."""
    
    action: str = Field(..., description="Action performed")
    total_requested: int = Field(..., description="Total number of users requested")
    successful: int = Field(..., description="Number of successful operations")
    failed: int = Field(..., description="Number of failed operations")
    errors: List[str] = Field(..., description="List of errors encountered")


class AdminDashboardStats(BaseModel):
    """Admin dashboard statistics schema."""
    
    user_stats: UserStats = Field(..., description="User statistics")
    system_stats: SystemStats = Field(..., description="System statistics")
    recent_activity: List[AuditLogEntry] = Field(..., description="Recent activity logs")


class AdminUserUpdate(BaseModel):
    """Admin-specific user update schema with role and status changes."""
    
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    bio: Optional[str] = Field(None, max_length=500, description="User bio")
    avatar_url: Optional[str] = Field(None, max_length=500, description="Avatar URL")
    role: Optional[UserRole] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="Whether user is active")


class UserDetailResponse(BaseModel):
    """Detailed user response for admin."""
    
    id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email address")
    full_name: Optional[str] = Field(None, description="Full name")
    role: UserRole = Field(..., description="User role")
    is_active: bool = Field(..., description="Whether user is active")
    is_verified: bool = Field(..., description="Whether user is verified")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: Optional[datetime] = Field(None, description="Last update date")
    last_login: Optional[datetime] = Field(None, description="Last login date")
    
    # Statistics
    total_uploads: int = Field(0, description="Total number of uploads")
    approved_uploads: int = Field(0, description="Number of approved uploads")
    total_downloads: int = Field(0, description="Total downloads by this user")
    
    # Recent activity
    recent_activity: List[UserActivityLog] = Field([], description="Recent user activity")
    
    class Config:
        from_attributes = True
