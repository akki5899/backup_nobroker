from pydantic_settings import BaseSettings
from typing import List
from pydantic import validator

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://localhost:6379"
    upload_dir: str = "uploads"
    max_file_size: int = 10485760
    allowed_extensions: str = "jpg,jpeg,png,webp,pdf"
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_user: str = ""
    email_password: str = ""
    allowed_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 60
    environment: str = "development"

    # Admin portal credentials (override in .env for production).
    # The admin authenticates at /auth/admin-login and receives a JWT whose
    # subject is `admin_email`, which get_current_admin validates.
    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_email: str = "admin@propdirect.com"
    
    @validator('database_url')
    def validate_database_url(cls, v):
        if not v:
            raise ValueError('DATABASE_URL is required')
        return v
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError('SECRET_KEY must be at least 32 characters')
        return v
    
    @validator('email_user')
    def validate_email_user(cls, v):
        # Make email user optional for deployment
        return v
    
    @validator('email_password')
    def validate_email_password(cls, v):
        # Make email password optional for deployment
        return v
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.allowed_extensions.split(",")]
    
    class Config:
        env_file = ".env"

settings = Settings()