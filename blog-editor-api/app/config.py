"""Configuration management for Blog Editor API."""

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8000/api/auth/callback"

    # GitHub Repository Settings
    github_repo_owner: str = ""
    github_repo_name: str = ""
    github_branch: str = "main"

    # Blog content path within repo
    blog_content_path: str = "src/content/blog"

    # Application settings
    secret_key: str = "change-me-in-production"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"  # development, staging, production
    log_level: str = "INFO"

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        """Ensure secret_key is changed in production."""
        if self.secret_key == "change-me-in-production" and self.environment == "production":
            raise ValueError(
                "SECRET_KEY must be changed from default in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
