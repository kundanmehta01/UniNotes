import time
import json
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured request/response logging."""
    
    def __init__(self, app, log_requests: bool = True, log_responses: bool = True):
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        start_time = time.time()
        
        # Get request details
        request_id = getattr(request.state, "request_id", "unknown")
        
        request_data = {
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client": str(request.client) if request.client else None,
        }
        
        # Log request
        if self.log_requests:
            logger.info(
                "Request started",
                extra={
                    "event_type": "request_started",
                    **request_data
                }
            )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            if self.log_responses:
                response_data = {
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "process_time": process_time,
                    "response_headers": dict(response.headers),
                }
                
                logger.info(
                    "Request completed",
                    extra={
                        "event_type": "request_completed",
                        **request_data,
                        **response_data
                    }
                )
            
            return response
            
        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log error
            logger.error(
                f"Request failed: {str(e)}",
                exc_info=True,
                extra={
                    "event_type": "request_failed",
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "process_time": process_time,
                    **request_data
                }
            )
            
            raise
