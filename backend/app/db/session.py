from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import get_settings

settings = get_settings()

# Check if we're using SQLite or PostgreSQL
is_sqlite = settings.DATABASE_URL.startswith("sqlite:")

# Configure database engines based on the database type
if is_sqlite:
    # SQLite configuration
    sync_engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    
    # For SQLite, we'll use sync sessions only (no async support)
    async_engine = None
else:
    # PostgreSQL configuration
    sync_engine = create_engine(
        settings.database_url_sync,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"options": "-c timezone=utc"}
    )
    
    # Async engine for FastAPI
    async_engine = create_async_engine(
        settings.database_url_async,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"server_settings": {"timezone": "utc"}}
    )

# Session makers
SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
    class_=Session
)

# Create AsyncSessionLocal only if we have an async engine (PostgreSQL)
if async_engine:
    AsyncSessionLocal = sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False
    )
else:
    # For SQLite, we'll fall back to sync sessions
    AsyncSessionLocal = None


def get_db() -> Session:
    """Dependency to get sync database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """Dependency to get async database session (or sync fallback for SQLite)."""
    if AsyncSessionLocal:
        # PostgreSQL: use async session
        async with AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    else:
        # SQLite: fallback to sync session
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()


def create_tables():
    """Create all database tables."""
    from app.db.models import Base
    Base.metadata.create_all(bind=sync_engine)


def drop_tables():
    """Drop all database tables."""
    from app.db.models import Base
    Base.metadata.drop_all(bind=sync_engine)
