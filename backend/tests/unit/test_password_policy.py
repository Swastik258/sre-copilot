"""Password policy and runtime configuration fail-fast checks."""

from __future__ import annotations

import pytest

from app.core.config import Settings
from app.security.password_policy import validate_password_strength


def test_long_passphrases_are_accepted() -> None:
    assert validate_password_strength("correct-horse") == "correct-horse"


def test_short_common_or_repeating_passwords_are_rejected() -> None:
    with pytest.raises(ValueError):
        validate_password_strength("short")
    with pytest.raises(ValueError):
        validate_password_strength("passwordpassword")
    with pytest.raises(ValueError):
        validate_password_strength("aaaaaaaaaaaa")


def test_password_cannot_embed_the_email_name() -> None:
    with pytest.raises(ValueError):
        validate_password_strength("ada-lovelace-secret", email="ada@example.com")


def test_production_rejects_unsafe_defaults() -> None:
    errors = Settings(environment="production").runtime_config_errors()
    assert any("AUTH_REQUIRED" in error for error in errors)
    assert any("PostgreSQL" in error for error in errors)


def test_safe_production_configuration_has_no_errors() -> None:
    settings = Settings(
        environment="production",
        auth_required=True,
        database_url="postgresql+psycopg://user:pass@db:5432/app",
        cors_origins="https://app.example.com",
        app_base_url="https://app.example.com",
        email_delivery="smtp",
        smtp_host="smtp.example.com",
        smtp_username="mailer",
        smtp_password="secret",
    )
    assert settings.runtime_config_errors() == []


def test_smtp_requires_host_and_single_tls_mode() -> None:
    errors = Settings(
        email_delivery="smtp", smtp_host=None, smtp_use_ssl=True
    ).runtime_config_errors()
    assert any("SMTP_HOST" in error for error in errors)
    assert any("SMTP_STARTTLS" in error for error in errors)
