from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True)
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # JWT Settings
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ACCESS_TTL: int = Field(default=900, env="JWT_ACCESS_TTL")  # 15 minutes
    JWT_REFRESH_TTL: int = Field(default=604800, env="JWT_REFRESH_TTL")  # 7 days
    JWT_ALGORITHM: str = Field(default="HS256")
    
    # CORS
    CORS_ALLOWED_ORIGINS_STR: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
        env="CORS_ALLOWED_ORIGINS"
    )
    
    # S3 Storage
    S3_ENDPOINT: Optional[str] = Field(default=None, env="S3_ENDPOINT")
    S3_BUCKET: str = Field(default="uninoteshub-files", env="S3_BUCKET")
    S3_ACCESS_KEY: str = Field(default="minioadmin", env="S3_ACCESS_KEY")
    S3_SECRET_KEY: str = Field(default="minioadmin", env="S3_SECRET_KEY")
    S3_REGION: str = Field(default="us-east-1", env="S3_REGION")
    
    # Email Configuration - supports both SMTP and AWS SES
    EMAIL_PROVIDER: str = Field(default="smtp", env="EMAIL_PROVIDER")  # "smtp" or "ses"
    
    # SMTP Configuration
    EMAIL_SMTP_HOST: str = Field(default="smtp.gmail.com", env="EMAIL_SMTP_HOST")
    EMAIL_SMTP_PORT: int = Field(default=587, env="EMAIL_SMTP_PORT")
    EMAIL_USER: str = Field(default="your-email@gmail.com", env="EMAIL_USER")
    EMAIL_PASS: str = Field(default="your-app-password", env="EMAIL_PASS")
    EMAIL_FROM: str = Field(default="noreply@uninoteshub.com", env="EMAIL_FROM")
    EMAIL_USE_TLS: bool = Field(default=True, env="EMAIL_USE_TLS")
    
    # AWS SES Configuration
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    
    # SES Specific Settings
    SES_REGION: Optional[str] = Field(default=None, env="SES_REGION")  # If different from AWS_REGION
    SES_FROM_EMAIL: Optional[str] = Field(default=None, env="SES_FROM_EMAIL")  # Verified SES email
    
    # Redis
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # Sentry
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    # File Upload Settings
    MAX_FILE_SIZE: int = Field(default=20971520, env="MAX_FILE_SIZE")  # 20MB
    ALLOWED_FILE_TYPES_STR: str = Field(
        default="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        env="ALLOWED_FILE_TYPES"
    )
    
    # Rate Limiting
    RATE_LIMIT_LOGIN_ATTEMPTS: int = Field(default=5, env="RATE_LIMIT_LOGIN_ATTEMPTS")
    RATE_LIMIT_LOGIN_WINDOW: int = Field(default=900, env="RATE_LIMIT_LOGIN_WINDOW")  # 15 min
    RATE_LIMIT_UPLOAD_PER_HOUR: int = Field(default=10, env="RATE_LIMIT_UPLOAD_PER_HOUR")
    RATE_LIMIT_DOWNLOAD_PER_HOUR: int = Field(default=100, env="RATE_LIMIT_DOWNLOAD_PER_HOUR")
    
    # Admin
    ADMIN_EMAIL: str = Field(default="admin@uninoteshub.com", env="ADMIN_EMAIL")
    
    # App Info
    APP_NAME: str = Field(default="UniNotesHub")
    APP_VERSION: str = Field(default="1.0.0")
    
    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        """Parse debug flag."""
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return v
    
    @property
    def CORS_ALLOWED_ORIGINS(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS_STR.split(",") if origin.strip()]
    
    @property
    def ALLOWED_FILE_TYPES(self) -> List[str]:
        """Parse allowed file types from comma-separated string."""
        return [file_type.strip() for file_type in self.ALLOWED_FILE_TYPES_STR.split(",") if file_type.strip()]
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def database_url_sync(self) -> str:
        """Get sync database URL."""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")
    
    @property
    def database_url_async(self) -> str:
        """Get async database URL."""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
