from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
import time
import uuid

from app.config import get_settings
from app.middleware.logging import LoggingMiddleware
from app.middleware.ratelimit import RateLimitMiddleware
from app.routers import auth, papers, notes, storage, taxonomy, admin, users, analytics, activities, notifications, home
from app.utils.errors import APIError

settings = get_settings()

# Initialize Sentry if DSN is provided
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enabling_integrations=False),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1 if settings.is_production else 1.0,
        environment=settings.ENVIRONMENT,
        release=settings.APP_VERSION,
    )


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="UniNotesHub - A platform for sharing university question papers",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
    )
    
    # Add middleware
    configure_middleware(app)
    
    # Add exception handlers
    configure_exception_handlers(app)
    
    # Include routers
    configure_routes(app)
    
    # Add startup and shutdown events
    configure_events(app)
    
    return app


def configure_middleware(app: FastAPI):
    """Configure middleware for the application."""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )
    
    # Trusted host middleware (for production)
    if settings.is_production:
        allowed_hosts = settings.CORS_ALLOWED_ORIGINS + ["localhost", "127.0.0.1"]
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=allowed_hosts,
        )
    
    # Rate limiting middleware (temporarily disabled for debugging)
    # app.add_middleware(RateLimitMiddleware)
    
    # Logging middleware (temporarily disabled for debugging)
    # app.add_middleware(LoggingMiddleware)
    
    # Request ID and timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        """Add process time and request ID headers."""
        start_time = time.time()
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        return response


def configure_exception_handlers(app: FastAPI):
    """Configure exception handlers."""
    
    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError):
        """Handle custom API errors."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.detail,
                    "details": exc.details,
                }
            },
            headers=exc.headers,
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors."""
        def serialize_value(value):
            """Convert any non-serializable objects to strings for JSON serialization."""
            if isinstance(value, bytes):
                return value.decode('utf-8', errors='replace')
            elif isinstance(value, (ValueError, Exception)):
                return str(value)
            elif isinstance(value, (list, tuple)):
                return [serialize_value(v) for v in value]
            elif isinstance(value, dict):
                return {k: serialize_value(v) for k, v in value.items()}
            else:
                # For any other non-serializable types, convert to string
                try:
                    import json
                    json.dumps(value)
                    return value
                except (TypeError, ValueError):
                    return str(value)
        
        # Convert any non-serializable objects to strings
        errors = []
        for error in exc.errors():
            clean_error = {}
            for key, value in error.items():
                clean_error[key] = serialize_value(value)
            errors.append(clean_error)
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request data",
                    "details": errors,
                }
            },
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                }
            },
        )
    
    @app.exception_handler(500)
    async def internal_server_error_handler(request: Request, exc: Exception):
        """Handle internal server errors."""
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Log the error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"Internal server error in request {request_id}: {str(exc)}",
            exc_info=True,
            extra={"request_id": request_id}
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An internal server error occurred",
                    "request_id": request_id,
                }
            },
        )


def configure_routes(app: FastAPI):
    """Configure application routes."""
    
    # Health check endpoint
    @app.get("/healthz", include_in_schema=False)
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "timestamp": time.time()}
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Welcome to UniNotesHub API",
            "version": settings.APP_VERSION,
            "docs": "/docs" if settings.is_development else None,
        }
    
    # Include API routers
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
    app.include_router(storage.router, prefix="/storage", tags=["File Storage"])
    app.include_router(papers.router, prefix="/papers", tags=["Papers"])
    app.include_router(notes.router, prefix="/notes", tags=["Notes"])
    app.include_router(taxonomy.router, prefix="/taxonomy", tags=["Taxonomy"])
    app.include_router(users.router, prefix="/users", tags=["Users"])
    app.include_router(admin.router, prefix="/admin", tags=["Admin"])
    app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
    app.include_router(activities.router, tags=["Activities"])
    app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
    app.include_router(home.router, prefix="/home", tags=["Home"])
    
    # Mount static files for uploads
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir, exist_ok=True)
    
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


def configure_events(app: FastAPI):
    """Configure startup and shutdown events."""
    
    @app.on_event("startup")
    async def startup_event():
        """Application startup event."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
        logger.info(f"Environment: {settings.ENVIRONMENT}")
        
        # Initialize database if needed
        if settings.is_development:
            try:
                from app.db.session import create_tables
                create_tables()
                logger.info("Database tables created/verified")
            except Exception as e:
                logger.error(f"Failed to create database tables: {e}")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Application shutdown event."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Shutting down {settings.APP_NAME}")


# Create the application instance
app = create_application()

# Add Prometheus metrics instrumentation if available
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    
    if settings.is_production:
        Instrumentator().instrument(app).expose(app, endpoint="/metrics")
except ImportError:
    pass
