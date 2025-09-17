"""Database base for SQLAlchemy models."""

# Import all models to ensure they're registered with SQLAlchemy
from app.models import *

# Export Base so it can be imported by Alembic
__all__ = ["Base"]
