import logging
import hashlib
import mimetypes
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError, NoCredentialsError
import uuid

from app.config import get_settings
from app.utils.errors import StorageError, FileTooLargeError, InvalidFileTypeError

settings = get_settings()
logger = logging.getLogger(__name__)


class StorageService:
    """Service for S3-compatible file storage operations."""
    
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET
        self.region = settings.S3_REGION
        
        # Configure S3 client
        session = boto3.Session(
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=self.region,
        )
        
        # Use custom endpoint for MinIO/other S3-compatible services
        self.s3_client = session.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            config=Config(
                signature_version='s3v4',
                connect_timeout=5,  # 5 second connection timeout
                read_timeout=10,    # 10 second read timeout
                s3={
                    'addressing_style': 'path'  # Required for MinIO
                }
            ) if settings.S3_ENDPOINT else Config(
                connect_timeout=5,
                read_timeout=10
            )
        )
        
        # Verify bucket exists and is accessible (disabled for startup)
        # self._verify_bucket_access()
        self.bucket_accessible = True  # Assume accessible for now
    
    def _verify_bucket_access(self):
        """Verify that the S3 bucket is accessible."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 bucket '{self.bucket_name}' is accessible")
            self.bucket_accessible = True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.warning(f"S3 bucket '{self.bucket_name}' does not exist (will be created on first use)")
            else:
                logger.warning(f"Error accessing S3 bucket: {e}")
            self.bucket_accessible = False
        except NoCredentialsError:
            logger.warning("S3 credentials not found or invalid")
            self.bucket_accessible = False
        except Exception as e:
            logger.warning(f"S3 service not available: {e}")
            self.bucket_accessible = False
    
    def validate_file(self, filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
        """Validate file before upload."""
        
        # Check file size
        if file_size > settings.MAX_FILE_SIZE:
            raise FileTooLargeError(
                detail=f"File size {file_size} bytes exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes",
                details={
                    "file_size": file_size,
                    "max_size": settings.MAX_FILE_SIZE,
                    "filename": filename
                }
            )
        
        # Check file type
        if content_type not in settings.ALLOWED_FILE_TYPES:
            raise InvalidFileTypeError(
                detail=f"File type '{content_type}' is not allowed",
                details={
                    "content_type": content_type,
                    "allowed_types": settings.ALLOWED_FILE_TYPES,
                    "filename": filename
                }
            )
        
        # Additional validation based on file extension
        file_ext = Path(filename).suffix.lower()
        allowed_extensions = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        if file_ext not in allowed_extensions:
            raise InvalidFileTypeError(
                detail=f"File extension '{file_ext}' is not allowed",
                details={
                    "extension": file_ext,
                    "allowed_extensions": list(allowed_extensions.keys()),
                    "filename": filename
                }
            )
        
        # Verify content type matches extension
        expected_content_type = allowed_extensions[file_ext]
        if content_type != expected_content_type:
            logger.warning(
                f"Content type mismatch: got {content_type}, expected {expected_content_type} for {filename}"
            )
        
        return True, "File validation passed"
    
    def generate_storage_key(self, filename: str, user_id: str) -> str:
        """Generate a unique storage key for the file."""
        
        # Get file extension
        file_ext = Path(filename).suffix.lower()
        
        # Create unique identifier
        unique_id = str(uuid.uuid4())
        
        # Create date-based path for organization
        now = datetime.utcnow()
        date_path = f"{now.year}/{now.month:02d}/{now.day:02d}"
        
        # Combine into storage key
        storage_key = f"uploads/{date_path}/{user_id}/{unique_id}{file_ext}"
        
        return storage_key
    
    def generate_presigned_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int = 3600
    ) -> str:
        """Generate presigned URL for file upload."""
        
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': storage_key,
                    'ContentType': content_type,
                },
                ExpiresIn=expires_in
            )
            
            logger.info(f"Generated presigned upload URL for {storage_key}")
            return presigned_url
            
        except Exception as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise StorageError(
                detail="Failed to generate upload URL",
                details={"storage_key": storage_key, "error": str(e)}
            )
    
    def generate_presigned_download_url(
        self,
        storage_key: str,
        filename: Optional[str] = None,
        expires_in: int = 300  # 5 minutes default
    ) -> str:
        """Generate presigned URL for file download."""
        
        # For development, generate local download URL
        if settings.ENVIRONMENT == "development" or not settings.S3_ENDPOINT:
            import os
            local_path = os.path.join("uploads", storage_key.replace('/', '_'))
            if os.path.exists(local_path):
                # Return a direct file serving URL for development
                # This assumes we have a file serving endpoint
                download_url = f"http://127.0.0.1:8000/storage/download/{storage_key}"
                logger.info(f"Generated local download URL for {storage_key}")
                return download_url
            else:
                raise StorageError(
                    detail="File not found for download",
                    details={"storage_key": storage_key}
                )
        
        # Production S3/MinIO presigned URL
        try:
            params = {
                'Bucket': self.bucket_name,
                'Key': storage_key,
            }
            
            # Set content disposition to suggest filename
            if filename:
                params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
            
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires_in
            )
            
            logger.info(f"Generated presigned download URL for {storage_key}")
            return presigned_url
            
        except Exception as e:
            logger.error(f"Failed to generate presigned download URL: {e}")
            # In development, if S3 fails, try local fallback
            if settings.ENVIRONMENT == "development":
                import os
                local_path = os.path.join("uploads", storage_key.replace('/', '_'))
                if os.path.exists(local_path):
                    download_url = f"http://127.0.0.1:8000/storage/download/{storage_key}"
                    logger.info(f"Generated local fallback download URL for {storage_key}")
                    return download_url
            raise StorageError(
                detail="Failed to generate download URL",
                details={"storage_key": storage_key, "error": str(e)}
            )
    
    def check_file_exists(self, storage_key: str) -> bool:
        """Check if file exists in storage."""
        
        # For development, check local file system first
        if settings.ENVIRONMENT == "development" or not settings.S3_ENDPOINT:
            import os
            local_path = os.path.join("uploads", storage_key.replace('/', '_'))
            exists = os.path.exists(local_path)
            logger.info(f"Checking local file existence: {local_path} -> {exists}")
            return exists
        
        # Production S3/MinIO check
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=storage_key)
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                return False
            else:
                logger.error(f"Error checking file existence: {e}")
                raise StorageError(
                    detail="Failed to check file existence",
                    details={"storage_key": storage_key, "error": str(e)}
                )
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {e}")
            # In development, if S3 fails, default to local check
            if settings.ENVIRONMENT == "development":
                import os
                local_path = os.path.join("uploads", storage_key.replace('/', '_'))
                return os.path.exists(local_path)
            raise StorageError(
                detail="Failed to check file existence",
                details={"storage_key": storage_key, "error": str(e)}
            )
    
    def get_file_metadata(self, storage_key: str) -> Dict[str, Any]:
        """Get file metadata from storage."""
        
        # For development, get metadata from local file system first
        if settings.ENVIRONMENT == "development" or not settings.S3_ENDPOINT:
            import os
            local_path = os.path.join("uploads", storage_key.replace('/', '_'))
            if os.path.exists(local_path):
                stat = os.stat(local_path)
                # Get mimetype based on file extension
                content_type, _ = mimetypes.guess_type(local_path)
                return {
                    'size': stat.st_size,
                    'content_type': content_type or 'application/octet-stream',
                    'last_modified': datetime.fromtimestamp(stat.st_mtime),
                    'etag': str(stat.st_mtime),  # Use modification time as etag
                    'metadata': {}
                }
            else:
                raise StorageError(
                    detail="File not found",
                    details={"storage_key": storage_key}
                )
        
        # Production S3/MinIO metadata retrieval
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=storage_key
            )
            
            return {
                'size': response.get('ContentLength'),
                'content_type': response.get('ContentType'),
                'last_modified': response.get('LastModified'),
                'etag': response.get('ETag', '').strip('"'),
                'metadata': response.get('Metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Failed to get file metadata: {e}")
            # In development, if S3 fails, try local fallback
            if settings.ENVIRONMENT == "development":
                import os
                local_path = os.path.join("uploads", storage_key.replace('/', '_'))
                if os.path.exists(local_path):
                    stat = os.stat(local_path)
                    content_type, _ = mimetypes.guess_type(local_path)
                    return {
                        'size': stat.st_size,
                        'content_type': content_type or 'application/octet-stream',
                        'last_modified': datetime.fromtimestamp(stat.st_mtime),
                        'etag': str(stat.st_mtime),
                        'metadata': {}
                    }
            raise StorageError(
                detail="Failed to get file metadata",
                details={"storage_key": storage_key, "error": str(e)}
            )
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage."""
        
        # For development, delete from local file system first
        if settings.ENVIRONMENT == "development" or not settings.S3_ENDPOINT:
            import os
            local_path = os.path.join("uploads", storage_key.replace('/', '_'))
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                    logger.info(f"Local file deleted: {local_path}")
                    return True
                except OSError as e:
                    logger.error(f"Failed to delete local file {local_path}: {e}")
                    raise StorageError(
                        detail="Failed to delete local file",
                        details={"storage_key": storage_key, "local_path": local_path, "error": str(e)}
                    )
            else:
                logger.warning(f"Local file not found for deletion: {local_path}")
                return False
        
        # Production S3/MinIO deletion
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=storage_key
            )
            
            logger.info(f"File deleted: {storage_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file {storage_key}: {e}")
            # In development, if S3 fails, try local fallback
            if settings.ENVIRONMENT == "development":
                import os
                local_path = os.path.join("uploads", storage_key.replace('/', '_'))
                if os.path.exists(local_path):
                    try:
                        os.remove(local_path)
                        logger.info(f"Local file deleted as fallback: {local_path}")
                        return True
                    except OSError as local_e:
                        logger.error(f"Both S3 and local deletion failed: {e}, {local_e}")
            raise StorageError(
                detail="Failed to delete file",
                details={"storage_key": storage_key, "error": str(e)}
            )
    
    def calculate_file_hash(self, file_content: bytes) -> str:
        """Calculate SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage usage statistics."""
        
        # For development, get stats from local file system first
        if settings.ENVIRONMENT == "development" or not settings.S3_ENDPOINT:
            import os
            import glob
            try:
                upload_dir = "uploads"
                if os.path.exists(upload_dir):
                    files = glob.glob(os.path.join(upload_dir, "*"))
                    total_size = 0
                    file_count = len(files)
                    
                    for file_path in files:
                        if os.path.isfile(file_path):
                            total_size += os.path.getsize(file_path)
                    
                    return {
                        'total_files': file_count,
                        'total_size_bytes': total_size,
                        'total_size_mb': round(total_size / (1024 * 1024), 2),
                        'storage_type': 'local',
                        'upload_directory': upload_dir
                    }
                else:
                    return {
                        'total_files': 0,
                        'total_size_bytes': 0,
                        'total_size_mb': 0,
                        'storage_type': 'local',
                        'upload_directory': upload_dir,
                        'note': 'Upload directory does not exist yet'
                    }
            except Exception as e:
                logger.error(f"Failed to get local storage stats: {e}")
                return {
                    'total_files': 0,
                    'total_size_bytes': 0,
                    'total_size_mb': 0,
                    'storage_type': 'local',
                    'error': str(e)
                }
        
        # Production S3/MinIO stats
        try:
            # List objects to get total size and count
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="uploads/"
            )
            
            total_size = 0
            file_count = 0
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    total_size += obj['Size']
                    file_count += 1
            
            return {
                'total_files': file_count,
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'storage_type': 's3',
                'bucket_name': self.bucket_name
            }
            
        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}")
            # In development, if S3 fails, try local fallback
            if settings.ENVIRONMENT == "development":
                import os
                import glob
                try:
                    upload_dir = "uploads"
                    if os.path.exists(upload_dir):
                        files = glob.glob(os.path.join(upload_dir, "*"))
                        total_size = sum(os.path.getsize(f) for f in files if os.path.isfile(f))
                        return {
                            'total_files': len(files),
                            'total_size_bytes': total_size,
                            'total_size_mb': round(total_size / (1024 * 1024), 2),
                            'storage_type': 'local_fallback',
                            's3_error': str(e)
                        }
                except Exception as local_e:
                    logger.error(f"Both S3 and local stats failed: {e}, {local_e}")
            
            return {
                'total_files': 0,
                'total_size_bytes': 0,
                'total_size_mb': 0,
                'bucket_name': self.bucket_name,
                'error': str(e)
            }


# Global storage service instance
storage_service = StorageService()
