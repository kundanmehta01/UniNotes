from typing import Optional, Dict, Any
from fastapi import HTTPException


class APIError(HTTPException):
    """Custom API error class with additional context."""
    
    def __init__(
        self,
        status_code: int,
        error_code: str,
        detail: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.details = details or {}


# Auth errors
class AuthenticationError(APIError):
    def __init__(self, detail: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=401,
            error_code="AUTH_001",
            detail=detail,
            details=details,
            headers={"WWW-Authenticate": "Bearer"}
        )


class EmailNotVerifiedError(APIError):
    def __init__(self, detail: str = "Email not verified", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=403,
            error_code="AUTH_002",
            detail=detail,
            details=details
        )


class InsufficientPrivilegesError(APIError):
    def __init__(self, detail: str = "Insufficient privileges", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=403,
            error_code="AUTH_003",
            detail=detail,
            details=details
        )


# User errors
class UserNotFoundError(APIError):
    def __init__(self, detail: str = "User not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=404,
            error_code="USER_001",
            detail=detail,
            details=details
        )


class UserAlreadyExistsError(APIError):
    def __init__(self, detail: str = "User already exists", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=409,
            error_code="USER_002",
            detail=detail,
            details=details
        )


# Upload errors
class FileTooLargeError(APIError):
    def __init__(self, detail: str = "File too large", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=413,
            error_code="UPL_001",
            detail=detail,
            details=details
        )


class InvalidFileTypeError(APIError):
    def __init__(self, detail: str = "Invalid file type", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=400,
            error_code="UPL_002",
            detail=detail,
            details=details
        )


class DuplicateFileError(APIError):
    def __init__(self, detail: str = "File already exists", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=409,
            error_code="UPL_003",
            detail=detail,
            details=details
        )


# Paper errors
class PaperNotFoundError(APIError):
    def __init__(self, detail: str = "Paper not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=404,
            error_code="PPR_001",
            detail=detail,
            details=details
        )


class PaperNotApprovedError(APIError):
    def __init__(self, detail: str = "Paper not approved for download", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=403,
            error_code="PPR_002",
            detail=detail,
            details=details
        )


# Rate limiting errors
class RateLimitExceededError(APIError):
    def __init__(self, detail: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=429,
            error_code="RATE_001",
            detail=detail,
            details=details,
            headers={"Retry-After": "60"}
        )


# Storage errors
class StorageError(APIError):
    def __init__(self, detail: str = "Storage operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=500,
            error_code="STORAGE_001",
            detail=detail,
            details=details
        )


# Validation errors
class ValidationError(APIError):
    def __init__(self, detail: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=422,
            error_code="VALIDATION_001",
            detail=detail,
            details=details
        )
