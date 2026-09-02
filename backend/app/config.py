import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Accutai Expense Tracker"
    VERSION: str = "1.0.0"
    API_PREFIX: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"

    # Database
    DATABASE_URL: str = "postgresql://postgres:vikash%40anjan@db.trbrkrukddadkcmdjyta.supabase.co:5432/postgres"

    # Supabase Cloud
    SUPABASE_URL: str = "https://trbrkrukddadkcmdjyta.supabase.co"
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYnJrcnVrZGRhZGtjbWRqeXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTkzNjMsImV4cCI6MjEwMzczNTM2M30.wEEsQ5X7Ze6WuYYlnZLpANG2KRfqUUcy_qbRySIdNPY"
    SUPABASE_BUCKET: str = "accutai_expense_bills"

    # Google OAuth (loaded from .env or environment variables)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://127.0.0.1:8000/auth/google/callback"

    # JWT Security
    SECRET_KEY: str = "accutai-super-secure-finance-ledger-secret-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Organization restrictions
    ENFORCE_DOMAIN: bool = True
    ALLOWED_DOMAIN: str = "accutai.com"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
