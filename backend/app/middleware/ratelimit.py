import time
import hashlib
from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import redis

from app.config import get_settings
from app.utils.errors import RateLimitExceededError

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window algorithm."""
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        
        # Initialize Redis if available
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                pass  # Rate limiting will be disabled without Redis
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        
        # Skip rate limiting if Redis is not available (development mode)
        if not self.redis_client:
            # In development, just log and continue without rate limiting
            # This prevents the middleware from blocking requests
            return await call_next(request)
        
        try:
            # Apply rate limiting based on endpoint
            await self._check_rate_limit(request)
        except Exception:
            # If rate limiting fails, allow the request (fail open)
            pass
        
        # Process request
        response = await call_next(request)
        return response
    
    async def _check_rate_limit(self, request: Request):
        """Check if request should be rate limited."""
        
        # Get client identifier (IP + User ID if available)
        client_id = self._get_client_id(request)
        
        # Define rate limits for different endpoints
        rate_limits = self._get_rate_limits(request)
        
        if not rate_limits:
            return  # No rate limiting for this endpoint
        
        for limit, window in rate_limits:
            key = f"rate_limit:{client_id}:{request.url.path}:{window}"
            
            if await self._is_rate_limited(key, limit, window):
                raise RateLimitExceededError(
                    detail=f"Rate limit exceeded: {limit} requests per {window} seconds",
                    details={
                        "limit": limit,
                        "window": window,
                        "retry_after": window
                    }
                )
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        
        # Start with IP address
        ip = self._get_client_ip(request)
        
        # Add user ID if authenticated
        user_id = ""
        if hasattr(request.state, "user") and request.state.user:
            user_id = str(request.state.user.id)
        
        # Create hash for privacy
        identifier = f"{ip}:{user_id}"
        return hashlib.sha256(identifier.encode()).hexdigest()[:16]
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        
        # Check forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        if hasattr(request.client, "host"):
            return request.client.host
        
        return "unknown"
    
    def _get_rate_limits(self, request: Request) -> Optional[list]:
        """Get rate limits for specific endpoints."""
        
        path = request.url.path
        method = request.method
        
        # Authentication endpoints
        if path.startswith("/auth/login"):
            return [(settings.RATE_LIMIT_LOGIN_ATTEMPTS, settings.RATE_LIMIT_LOGIN_WINDOW)]
        
        # Upload endpoints
        if path.startswith("/storage/presign") or path.startswith("/papers") and method == "POST":
            return [(settings.RATE_LIMIT_UPLOAD_PER_HOUR, 3600)]  # 1 hour
        
        # Download endpoints
        if "/download" in path:
            return [(settings.RATE_LIMIT_DOWNLOAD_PER_HOUR, 3600)]  # 1 hour
        
        # General API endpoints - more lenient
        if path.startswith("/api/"):
            return [(1000, 3600)]  # 1000 requests per hour for general API
        
        return None  # No rate limiting
    
    async def _is_rate_limited(self, key: str, limit: int, window: int) -> bool:
        """Check if request should be rate limited using sliding window."""
        
        try:
            current_time = time.time()
            pipeline = self.redis_client.pipeline()
            
            # Remove old entries outside the window
            pipeline.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests in window
            pipeline.zcard(key)
            
            # Add current request
            pipeline.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipeline.expire(key, window)
            
            results = pipeline.execute()
            current_count = results[1]
            
            return current_count >= limit
            
        except Exception:
            # If Redis fails, allow the request (fail open)
            return False
