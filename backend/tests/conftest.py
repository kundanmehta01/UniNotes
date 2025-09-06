"""Test configuration and fixtures for UniNotesHub backend tests."""

import os
import pytest
import tempfile
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Import our application components
from app.main import app
from app.db.session import get_db
from app.db.models import Base
from app.config import get_settings, Settings
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import uuid
from datetime import datetime


class TestSettings(Settings):
    """Test settings override."""
    
    # Use in-memory SQLite for testing
    DATABASE_URL: str = "sqlite:///:memory:"
    
    # Test-specific settings
    ENVIRONMENT: str = "testing"
    DEBUG: bool = True
    
    # Dummy values for required fields
    JWT_SECRET: str = "test-jwt-secret-key-for-testing-only"
    S3_BUCKET: str = "test-bucket"
    S3_ACCESS_KEY: str = "test-access-key"
    S3_SECRET_KEY: str = "test-secret-key"
    EMAIL_SMTP_HOST: str = "localhost"
    EMAIL_USER: str = "test@example.com"
    EMAIL_PASS: str = "test-password"
    EMAIL_FROM: str = "test@example.com"
    ADMIN_EMAIL: str = "admin@test.com"
    
    # Override file paths for testing
    MAX_FILE_SIZE: int = 5242880  # 5MB for tests
    
    class Config:
        env_file = None  # Don't load from .env in tests


@pytest.fixture(scope="session")
def test_settings() -> TestSettings:
    """Get test settings."""
    return TestSettings()


@pytest.fixture(scope="function")
def db_engine():
    """Create a fresh database engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Clean up
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a database session for testing."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session: Session, test_settings: TestSettings) -> Generator[TestClient, None, None]:
    """Create a test client with database session override."""
    
    def get_test_db():
        try:
            yield db_session
        finally:
            pass
    
    def get_test_settings():
        return test_settings
    
    # Override dependencies
    app.dependency_overrides[get_db] = get_test_db
    app.dependency_overrides[get_settings] = get_test_settings
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up overrides
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        password_hash=get_password_hash("testpassword123"),
        role=UserRole.STUDENT,
        is_email_verified=True,
        first_name="Test",
        last_name="User",
        created_at=datetime.utcnow()
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def test_admin_user(db_session: Session) -> User:
    """Create a test admin user."""
    admin_user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        password_hash=get_password_hash("adminpassword123"),
        role=UserRole.ADMIN,
        is_email_verified=True,
        first_name="Admin",
        last_name="User",
        created_at=datetime.utcnow()
    )
    
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    return admin_user


@pytest.fixture
def auth_headers(client: TestClient, test_user: User) -> dict:
    """Get authentication headers for test user."""
    login_data = {
        "username": test_user.email,
        "password": "testpassword123"
    }
    
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest.fixture
def admin_auth_headers(client: TestClient, test_admin_user: User) -> dict:
    """Get authentication headers for admin user."""
    login_data = {
        "username": test_admin_user.email,
        "password": "adminpassword123"
    }
    
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest.fixture
def mock_s3_client():
    """Mock S3 client for storage testing."""
    with patch('app.services.storage.boto3.client') as mock_client:
        mock_s3 = Mock()
        mock_client.return_value = mock_s3
        
        # Mock common S3 operations
        mock_s3.generate_presigned_url.return_value = "https://example.com/presigned-url"
        mock_s3.head_object.return_value = {
            'ContentLength': 1024,
            'LastModified': datetime.utcnow(),
            'ContentType': 'application/pdf'
        }
        
        yield mock_s3


@pytest.fixture
def mock_email_service():
    """Mock email service for testing."""
    with patch('app.services.email.get_email_service') as mock_service:
        mock_email = Mock()
        mock_service.return_value = mock_email
        
        # Mock email sending
        mock_email.send_verification_email.return_value = True
        mock_email.send_password_reset_email.return_value = True
        
        yield mock_email


@pytest.fixture
def sample_pdf_file():
    """Create a sample PDF file for testing."""
    # Create a minimal PDF content
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
395
%%EOF"""
    
    return pdf_content


@pytest.fixture
def temp_file():
    """Create a temporary file for testing."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file.write(b"Test file content")
        tmp_file_path = tmp_file.name
    
    yield tmp_file_path
    
    # Clean up
    try:
        os.unlink(tmp_file_path)
    except OSError:
        pass


# Pytest configuration
def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "auth: Authentication related tests")
    config.addinivalue_line("markers", "paper: Paper management tests")
    config.addinivalue_line("markers", "storage: File storage tests")
    config.addinivalue_line("markers", "admin: Admin functionality tests")
    config.addinivalue_line("markers", "analytics: Analytics and reporting tests")


# Test data factories
class TestDataFactory:
    """Factory for creating test data."""
    
    @staticmethod
    def create_university_data():
        """Create university test data."""
        return {
            "name": "Test University",
            "code": "TU",
            "location": "Test City",
            "website": "https://test-university.edu"
        }
    
    @staticmethod
    def create_program_data():
        """Create program test data."""
        return {
            "name": "Bachelor of Technology",
            "duration_years": 4
        }
    
    @staticmethod
    def create_branch_data():
        """Create branch test data."""
        return {
            "name": "Computer Science Engineering",
            "code": "CSE"
        }
    
    @staticmethod
    def create_semester_data():
        """Create semester test data."""
        return {
            "number": 1,
            "name": "First Semester"
        }
    
    @staticmethod
    def create_subject_data():
        """Create subject test data."""
        return {
            "name": "Database Management Systems",
            "code": "CS301",
            "credits": 4
        }
    
    @staticmethod
    def create_paper_data():
        """Create paper test data."""
        return {
            "title": "Database Management Systems - End Semester Exam",
            "description": "Final examination paper for DBMS course",
            "exam_year": 2024
        }


@pytest.fixture
def test_data_factory():
    """Provide test data factory."""
    return TestDataFactory
