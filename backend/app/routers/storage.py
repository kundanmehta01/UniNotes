from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_active_user, get_current_user_optional, get_request_ip
from app.schemas.paper import PresignedUploadRequest, PresignedUploadResponse, DownloadResponse
from app.schemas.user import User
from app.services.storage import storage_service
from app.utils.errors import ValidationError

router = APIRouter()


@router.post("/presign-upload", response_model=dict)
async def get_presigned_upload_url(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate presigned URL for file upload."""
    
    try:
        # Get request data
        request_data = await request.json()
        filename = request_data.get('file_name')
        content_type = request_data.get('content_type')
        
        if not filename or not content_type:
            raise ValidationError(
                detail="file_name and content_type are required",
                details={"filename": filename, "content_type": content_type}
            )
        
        # For development, we'll use a simple file storage approach
        # In production, this would integrate with S3/MinIO
        import uuid
        import os
        
        # Generate unique storage key
        file_ext = os.path.splitext(filename)[1]
        storage_key = f"papers/{current_user.id}/{uuid.uuid4()}{file_ext}"
        
        # For now, return a mock presigned URL structure
        # This should be replaced with actual S3/MinIO integration
        upload_url = f"http://127.0.0.1:8000/storage/upload/{storage_key}"
        
        return {
            "url": upload_url,
            "fields": {
                "key": storage_key,
                "Content-Type": content_type,
            },
            "storage_key": storage_key,
            "expires_in": 3600
        }
        
    except Exception as e:
        raise ValidationError(
            detail="Failed to generate upload URL",
            details={"error": str(e)}
        )


@router.post("/upload/{storage_key:path}")
async def upload_file_direct(
    storage_key: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """Direct file upload endpoint for development."""
    
    try:
        # Get uploaded file
        form = await request.form()
        file = form.get('file')
        
        if not file:
            raise ValidationError(detail="No file provided")
        
        # For development, save to local storage
        import os
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, storage_key.replace('/', '_'))
        
        # Save file
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        return {
            "message": "File uploaded successfully",
            "storage_key": storage_key,
            "file_path": file_path,
            "size": len(content)
        }
        
    except Exception as e:
        raise ValidationError(
            detail="File upload failed",
            details={"error": str(e)}
        )


@router.post("/download", response_model=DownloadResponse)
async def get_download_url(
    storage_key: str,
    filename: str = None,
    request: Request = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate presigned URL for file download."""
    
    # Check if file exists
    if not storage_service.check_file_exists(storage_key):
        raise ValidationError(
            detail="File not found",
            details={"storage_key": storage_key}
        )
    
    # Generate presigned download URL
    download_url = storage_service.generate_presigned_download_url(
        storage_key=storage_key,
        filename=filename,
        expires_in=300  # 5 minutes
    )
    
    return DownloadResponse(
        download_url=download_url,
        expires_in=300
    )


@router.get("/download/{storage_key:path}")
async def download_file_direct(
    storage_key: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Direct file download endpoint for development - no auth required for approved papers."""
    
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    import os
    
    # Validate that this storage_key belongs to an approved paper
    from app.db.models import Paper, PaperStatus
    paper = db.query(Paper).filter(Paper.storage_key == storage_key).first()
    
    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )
    
    # Only allow downloads of approved papers
    if paper.status != PaperStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail="Paper not available for download"
        )
    
    # For development, serve from local storage
    local_path = os.path.join("uploads", storage_key.replace('/', '_'))
    
    if not os.path.exists(local_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on disk"
        )
    
    # Get metadata for proper headers
    try:
        metadata = storage_service.get_file_metadata(storage_key)
        return FileResponse(
            path=local_path,
            media_type=metadata.get('content_type', 'application/octet-stream'),
            filename=paper.original_filename or os.path.basename(storage_key)
        )
    except Exception as e:
        # Fallback to simple file serving
        return FileResponse(
            path=local_path,
            media_type='application/octet-stream',
            filename=paper.original_filename or os.path.basename(storage_key)
        )


@router.get("/preview/{storage_key:path}")
async def preview_file(
    storage_key: str,
    request: Request,
    token: str = None,  # Optional token parameter for browser access
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Preview file content - for approved papers/notes (all users) or any paper/note (admins/owners)."""
    
    from fastapi.responses import FileResponse, StreamingResponse
    from fastapi import HTTPException
    import os
    import mimetypes
    
    # Get paper/note information
    from app.db.models import Paper, Note, PaperStatus, NoteStatus, UserRole
    
    # Check if it's a paper or note
    paper = db.query(Paper).filter(Paper.storage_key == storage_key).first()
    note = db.query(Note).filter(Note.storage_key == storage_key).first() if not paper else None
    
    if not paper and not note:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    
    # If no current_user but token provided, try to authenticate via token
    token_user = None
    if not current_user and token:
        try:
            # Validate the token and get user
            from app.services.security import verify_token
            from app.db.models import User as UserModel
            
            # Decode the token
            payload = verify_token(token, "access")
            if payload and payload.get('sub'):
                user_id = payload.get('sub')
                token_user = db.query(UserModel).filter(UserModel.id == user_id).first()
                if token_user:
                    print(f"TOKEN DEBUG: Authenticated user {token_user.email} via token")
        except Exception as e:
            print(f"TOKEN DEBUG: Token validation failed: {e}")
            # Continue without token authentication
    
    # Use token_user if available, otherwise current_user
    effective_user = token_user or current_user
    
    # Determine permissions
    content = paper if paper else note
    is_approved = (
        (paper and paper.status == PaperStatus.APPROVED) or 
        (note and note.status == NoteStatus.APPROVED)
    )
    is_admin = effective_user and (effective_user.role == UserRole.ADMIN or effective_user.role == "admin")
    is_owner = effective_user and content.uploader_id == effective_user.id
    
    # Enhanced debug logging for admin panel issues
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"PREVIEW PERMISSION DEBUG:")
    logger.info(f"  - User: {current_user.email if current_user else 'None'}")
    logger.info(f"  - User role: {current_user.role if current_user else 'None'} (type: {type(current_user.role) if current_user else 'N/A'})")
    logger.info(f"  - Is admin: {is_admin}")
    logger.info(f"  - Is approved: {is_approved}")
    logger.info(f"  - Is owner: {is_owner}")
    logger.info(f"  - Content type: {'Paper' if paper else 'Note'}")
    logger.info(f"  - Content status: {content.status}")
    logger.info(f"  - Storage key: {storage_key}")
    
    # Also print to console for immediate debugging
    effective_user_email = effective_user.email if effective_user else None
    effective_user_role = effective_user.role if effective_user else None
    auth_method = "token" if token_user else "header" if current_user else "none"
    print(f"PREVIEW DEBUG: EffectiveUser={effective_user_email}, Role={effective_user_role}, AuthMethod={auth_method}, Admin={is_admin}, Approved={is_approved}, Owner={is_owner}")
    
    # Check if user can preview
    # Allow: approved content (all users), or admin/owner for any content
    if not (is_approved or is_admin or is_owner):
        print(f"DEBUG: Permission denied - no valid permission found")
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to preview this file"
        )
    
    # Get file path
    local_path = os.path.join("uploads", storage_key.replace('/', '_'))
    
    if not os.path.exists(local_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on disk"
        )
    
    # Get file info
    filename = content.original_filename or os.path.basename(storage_key)
    file_ext = os.path.splitext(filename)[1].lower()
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        if file_ext == '.pdf':
            content_type = 'application/pdf'
        elif file_ext in ['.doc', '.docx']:
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            content_type = 'application/octet-stream'
    
    # Return file with appropriate headers for preview
    return FileResponse(
        path=local_path,
        media_type=content_type,
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "private, max-age=3600",  # Cache for 1 hour
            "X-Content-Type-Options": "nosniff",
        }
    )


@router.get("/preview/paper/{paper_id}")
async def preview_paper_by_id(
    paper_id: str,
    request: Request,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Preview paper by ID - convenience endpoint."""
    
    from app.db.models import Paper
    from fastapi import HTTPException
    
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Redirect to storage key preview
    return await preview_file(paper.storage_key, request, current_user, db)


@router.get("/preview/note/{note_id}")
async def preview_note_by_id(
    note_id: str,
    request: Request,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Preview note by ID - convenience endpoint."""
    
    from app.db.models import Note
    from fastapi import HTTPException
    import uuid
    
    try:
        # Convert string to UUID
        note_uuid = uuid.UUID(note_id)
        print(f"DEBUG: Looking for note with UUID: {note_uuid}")
        
        # First check if any notes exist at all
        all_notes = db.query(Note).all()
        print(f"DEBUG: Total notes in database: {len(all_notes)}")
        for n in all_notes[:3]:  # Show first 3
            print(f"DEBUG: Note {n.id} ({type(n.id)}) - {n.title}")
        
        note = db.query(Note).filter(Note.id == note_uuid).first()
        print(f"DEBUG: Query result: {note}")
        
    except ValueError as e:
        print(f"DEBUG: UUID parsing error: {e}")
        raise HTTPException(status_code=400, detail="Invalid note ID format")
    except Exception as e:
        print(f"DEBUG: Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    
    if not note:
        print(f"DEBUG: Note {note_id} not found in database")
        raise HTTPException(status_code=404, detail="Note not found")
    
    print(f"DEBUG: Found note {note_id} with storage_key: {note.storage_key}")
    
    # Redirect to storage key preview
    return await preview_file(note.storage_key, request, current_user, db)


@router.get("/stats")
async def get_storage_stats(
    current_user: User = Depends(get_current_active_user),
):
    """Get storage usage statistics (admin only)."""
    
    # Only allow admins to view storage stats
    from app.db.models import UserRole
    if current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    stats = storage_service.get_storage_stats()
    return stats


@router.delete("/file/{storage_key}")
async def delete_file(
    storage_key: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete file from storage (admin only or file owner)."""
    
    # TODO: Add proper authorization check to ensure user owns the file
    # For now, only allow admins
    from app.db.models import UserRole
    if current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Delete file
    success = storage_service.delete_file(storage_key)
    
    return {
        "message": "File deleted successfully",
        "storage_key": storage_key,
        "success": success
    }


@router.get("/metadata/{storage_key}")
async def get_file_metadata(
    storage_key: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get file metadata from storage."""
    
    metadata = storage_service.get_file_metadata(storage_key)
    return {
        "storage_key": storage_key,
        "metadata": metadata
    }
