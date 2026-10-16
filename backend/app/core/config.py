"""Centralized, validated application configuration.

All settings are read from the environment (and an optional ``.env`` file for
local development). Settings are intentionally conservative: every integration
is disabled by default so the application boots in demo mode with no
credentials.

Nothing in this module performs network I/O. It only describes *what* is
configured, never proves an integration works — use the integration status
endpoint for a health/readiness view.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AIProviderName = Literal["mock", "openai", "anthropic"]

# Integrations that, when enabled, mean the app is *not* solely in demo mode.
_INTEGRATION_FLAGS = (
    "kubernetes_enabled",
    "github_enabled",
    "prometheus_enabled",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- Application ----
    app_name: str = "SRE Copilot"
    app_version: str = "0.2.0"
    environment: str = "local"
    debug: bool = False
    log_level: str = "INFO"
    log_json: bool = False

    api_v1_prefix: str = "/api/v1"

    # ---- Database ----
    database_url: str = "sqlite:///./sre_copilot.db"
    # Convenience for local/demo: create missing tables on startup when the
    # database is SQLite. Never used for Postgres; production relies on Alembic.
    auto_create_schema: bool = True

    # ---- HTTP / CORS ----
    cors_origins: str = "http://localhost:3000"
    allow_credentials: bool = False

    # ---- Request limits ----
    max_request_bytes: int = 2_000_000  # 2 MB default cap on request bodies
    # 0 disables the limiter. Kept disabled by default so tests and local work
    # are not throttled; set a positive value in shared environments.
    rate_limit_per_minute: int = 0

    # ---- AI providers ----
    ai_provider: AIProviderName = "mock"
    ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: float = 30.0
    ai_max_output_tokens: int = 1500
    # When True, no investigation content is ever sent to an external LLM
    # provider. External providers are rejected at call time.
    ai_privacy_mode: bool = False

    openai_api_key: str | None = None
    openai_base_url: str = "https://api.openai.com/v1"

    anthropic_api_key: str | None = None
    anthropic_base_url: str = "https://api.anthropic.com"

    # ---- Kubernetes (read-only) ----
    kubernetes_enabled: bool = False
    kubernetes_demo_mode: bool = True
    kubernetes_kubeconfig: str | None = None
    kubernetes_context: str | None = None
    kubernetes_in_cluster: bool = False
    kubernetes_request_timeout_seconds: float = 15.0

    # ---- GitHub ----
    github_enabled: bool = False
    github_token: str | None = None
    github_api_url: str = "https://api.github.com"
    github_request_timeout_seconds: float = 15.0

    # ---- Prometheus ----
    prometheus_enabled: bool = False
    prometheus_url: str | None = None
    prometheus_request_timeout_seconds: float = 15.0

    # ---- Redaction ----
    # Redact obvious secrets from anything persisted or sent to a model.
    redaction_enabled: bool = True

    @field_validator("log_level")
    @classmethod
    def _normalize_log_level(cls, value: str) -> str:
        level = value.upper().strip()
        allowed = {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG", "NOTSET"}
        if level not in allowed:
            raise ValueError(f"log_level must be one of {sorted(allowed)}")
        return level

    @field_validator("environment")
    @classmethod
    def _normalize_environment(cls, value: str) -> str:
        return value.strip().lower()

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_local(self) -> bool:
        return self.environment in {"local", "dev", "development", "test"}

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def external_ai_configured(self) -> bool:
        """True when a non-mock provider has credentials available."""
        if self.ai_provider == "openai":
            return bool(self.openai_api_key)
        if self.ai_provider == "anthropic":
            return bool(self.anthropic_api_key)
        return False

    @property
    def demo_mode(self) -> bool:
        """True when no live integration is enabled.

        Demo mode is a *label*, not a fallback: it tells the UI and API to mark
        fixture-backed data clearly rather than implying it came from a real
        system.
        """
        return not any(getattr(self, flag) for flag in _INTEGRATION_FLAGS)


@lru_cache
def get_settings() -> Settings:
    return Settings()
