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

AIProviderName = Literal["mock", "openai", "openrouter", "anthropic", "groq"]

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
    # Required so the browser will send the session cookie on cross-origin
    # (localhost:3000 -> localhost:8000) requests. Safe with an explicit
    # origin allow-list; never combine with a "*" origin.
    allow_credentials: bool = True

    # ---- Authentication (local, self-hosted) ----
    # When True, every read-only API route except /health and /auth requires a
    # valid session. Off by default so the local demo and the test suite run
    # without credentials; turn it on in shared environments.
    auth_required: bool = False
    auth_cookie_name: str = "sre_session"
    auth_csrf_cookie_name: str = "sre_csrf"
    auth_csrf_header_name: str = "X-CSRF-Token"
    auth_session_ttl_hours: int = 168  # 7 days
    auth_session_idle_hours: int = 72
    auth_max_failed_logins: int = 5
    auth_lockout_minutes: int = 15
    auth_rate_limit_per_minute: int = 10
    # Double-submit CSRF protection is always enforced in production. Local
    # development and tests may set this explicitly, otherwise the default is
    # derived from ENVIRONMENT.
    csrf_protection: bool | None = None
    # New public signups are always members. Promote an administrator with the
    # trusted local `scripts/set_admin.py` operator command.
    default_tenant_id: str = "default"
    security_headers_enabled: bool = True

    # ---- Email delivery / account lifecycle ----
    # disabled: no outbound mail (tokens are not returned by the API)
    # console: write messages to the application log (local development only)
    # smtp: deliver through the configured SMTP relay
    email_delivery: Literal["disabled", "console", "smtp"] = "disabled"
    email_from: str = "SRE Copilot <no-reply@localhost>"
    email_verification_required: bool = False
    email_verification_ttl_hours: int = 24
    password_reset_ttl_minutes: int = 30
    app_base_url: str = "http://localhost:3000"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_starttls: bool = True
    smtp_use_ssl: bool = False
    smtp_timeout_seconds: float = 10.0

    # ---- Billing (Stripe-ready, disabled by default) ----
    # No payment flow is exposed until billing_enabled is explicitly turned on
    # and the Stripe price ids have been configured. Usage metering and webhook
    # storage work independently of payment collection.
    billing_enabled: bool = False
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_pro: str | None = None
    stripe_price_team: str | None = None
    stripe_webhook_tolerance_seconds: int = 300

    # ---- Optional OAuth providers ----
    # Buttons are only rendered by clients that discover enabled providers from
    # /api/v1/auth/providers. Public signup remains available independently.
    oauth_redirect_base_url: str = "http://localhost:8000"
    google_oauth_client_id: str | None = None
    google_oauth_client_secret: str | None = None
    github_oauth_client_id: str | None = None
    github_oauth_client_secret: str | None = None

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

    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # OpenRouter exposes an OpenAI-compatible chat-completions API. Model IDs
    # are namespaced (for example ``openai/gpt-4o-mini``).
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_http_referer: str = "http://localhost:3000"
    openrouter_app_title: str = "SRE Copilot"

    anthropic_api_key: str | None = None
    anthropic_base_url: str = "https://api.anthropic.com"

    # ---- Kubernetes (read-only) ----
    kubernetes_enabled: bool = False
    kubernetes_demo_mode: bool = True
    # Backward-compatible single-cluster target.
    kubernetes_kubeconfig: str | None = None
    kubernetes_context: str | None = None
    kubernetes_in_cluster: bool = False
    # Optional JSON array of named clusters. When set, it takes precedence and
    # the UI can select a target by name.
    kubernetes_clusters: str | None = None
    kubernetes_request_timeout_seconds: float = 15.0

    # ---- GitHub ----
    github_enabled: bool = False
    github_token: str | None = None
    github_api_url: str = "https://api.github.com"
    github_request_timeout_seconds: float = 15.0

    # ---- Prometheus ----
    prometheus_enabled: bool = False
    # Fixture-backed queries when no URL is configured. Every response is
    # labelled demo; set PROMETHEUS_DEMO_MODE=false for live-only behavior.
    prometheus_demo_mode: bool = True
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
    def effective_rate_limit(self) -> int:
        """Production gets a conservative default even when unset."""

        if self.rate_limit_per_minute > 0:
            return self.rate_limit_per_minute
        return 120 if self.environment == "production" else 0

    @property
    def effective_csrf_protection(self) -> bool:
        if self.csrf_protection is not None:
            return self.csrf_protection
        return self.environment == "production"

    @property
    def oauth_providers(self) -> list[str]:
        providers: list[str] = []
        if self.google_oauth_client_id and self.google_oauth_client_secret:
            providers.append("google")
        if self.github_oauth_client_id and self.github_oauth_client_secret:
            providers.append("github")
        return providers

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    def runtime_config_errors(self) -> list[str]:
        """Return production-safety errors without performing network I/O.

        Local/test environments are intentionally permissive so the zero-setup
        demo keeps working. Production must fail fast instead of silently using
        SQLite, wildcard CORS, console email, or an insecure public base URL.
        """

        errors: list[str] = []
        if self.email_delivery == "smtp":
            if not self.smtp_host:
                errors.append("SMTP_HOST is required when EMAIL_DELIVERY=smtp.")
            if self.smtp_starttls and self.smtp_use_ssl:
                errors.append("SMTP_STARTTLS and SMTP_USE_SSL cannot both be true.")
        if self.email_verification_required and self.email_delivery == "disabled":
            errors.append(
                "EMAIL_VERIFICATION_REQUIRED=true needs a working EMAIL_DELIVERY."
            )
        if bool(self.google_oauth_client_id) != bool(self.google_oauth_client_secret):
            errors.append("Set both GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.")
        if bool(self.github_oauth_client_id) != bool(self.github_oauth_client_secret):
            errors.append("Set both GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.")
        if self.auth_session_idle_hours > self.auth_session_ttl_hours:
            errors.append("AUTH_SESSION_IDLE_HOURS cannot exceed AUTH_SESSION_TTL_HOURS.")
        if self.billing_enabled:
            if not self.stripe_secret_key:
                errors.append("STRIPE_SECRET_KEY is required when BILLING_ENABLED=true.")
            if not self.stripe_webhook_secret:
                errors.append(
                    "STRIPE_WEBHOOK_SECRET is required when BILLING_ENABLED=true."
                )

        if self.environment != "production":
            return errors

        if not self.auth_required:
            errors.append("AUTH_REQUIRED=true is required in production.")
        if self.is_sqlite:
            errors.append("Production requires PostgreSQL, not SQLite.")
        if not self.cors_origin_list or "*" in self.cors_origin_list:
            errors.append("CORS_ORIGINS must be an explicit allow-list in production.")
        if not self.app_base_url.lower().startswith("https://"):
            errors.append("APP_BASE_URL must use HTTPS in production.")
        if self.oauth_providers and not self.oauth_redirect_base_url.lower().startswith(
            "https://"
        ):
            errors.append("OAUTH_REDIRECT_BASE_URL must use HTTPS in production.")
        if self.email_delivery == "console":
            errors.append("EMAIL_DELIVERY=console is not allowed in production.")
        if self.debug:
            errors.append("DEBUG must be false in production.")
        if self.log_level == "DEBUG":
            errors.append("LOG_LEVEL=DEBUG is not allowed in production.")
        if self.email_delivery == "smtp" and not self.smtp_host:
            errors.append("SMTP_HOST is required in production when email is enabled.")
        return errors

    @property
    def external_ai_configured(self) -> bool:
        """True when a non-mock provider has credentials available."""
        if self.ai_provider == "openai":
            return bool(self.openai_api_key)
        if self.ai_provider == "openrouter":
            return bool(self.openrouter_api_key)
        if self.ai_provider == "groq":
            return bool(self.groq_api_key)
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
