"""Application configuration settings."""
from functools import lru_cache
from typing import List, Optional, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    app_name: str = Field("Clinic Backend", alias="APP_NAME")
    secret_key: str = Field(
        "change-me", alias="SECRET_KEY", description="JWT signing secret"
    )
    algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    database_url: str = Field(
        "postgresql://root:root@localhost:5432/clinic2",
        alias="DATABASE_URL",
    )
    cors_origins: List[str] = Field(default_factory=lambda: ["*"], alias="CORS_ORIGINS")
    diagnostic_tests_file: Optional[str] = Field(
        default="app/data/diagnostic_tests.json",
        alias="DIAGNOSTIC_TESTS_FILE",
        description=(
            "Filesystem path to a JSON file describing diagnostic tests to seed."
        ),
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(
        cls, value: Union[List[str], str]
    ) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
