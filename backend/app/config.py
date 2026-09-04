from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str
    VERSION: str
    API_PREFIX: str
    ALLOWED_ORIGINS: str

    # Database
    DATABASE_URL: str

    # Supabase Cloud
    SUPABASE_URL: str
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYnJrcnVrZGRhZGtjbWRqeXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTkzNjMsImV4cCI6MjEwMzczNTM2M30.wEEsQ5X7Ze6WuYYlnZLpANG2KRfqUUcy_qbRySIdNPY"
    SUPABASE_BUCKET: str

    # Google OAuth (loaded from .env or environment variables)
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    FRONTEND_URL: str

    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Organization restrictions
    ENFORCE_DOMAIN: bool
    ALLOWED_DOMAIN: str

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
