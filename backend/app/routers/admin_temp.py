from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_admin_user
from app.schemas.user import User
from app.services.admin import get_admin_service

router = APIRouter()

@router.get("/stats/users")
async def get_user_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get user statistics."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_user_stats()


@router.get("/stats/system")
async def get_system_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system statistics."""
    
    admin_service = get_admin_service(db)
    return admin_service.get_system_stats()


@router.get("/health")
async def system_health_check(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get system health status."""
    
    return {
        "status": "healthy",
        "message": "Admin service is working"
    }
