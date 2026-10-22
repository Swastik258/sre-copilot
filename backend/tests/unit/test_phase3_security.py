"""Security regression tests for URL policy, encryption, jobs, and limits."""

from __future__ import annotations

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from starlette.requests import Request

from app.core.config import Settings, get_settings
from app.core.ratelimit import RateLimitMiddleware, _client_key
from app.core.urls import https_required, validate_base_url
from app.db.models import BackgroundJob
from app.security.encryption import SecretBox, secret_box
from app.services.jobs import enqueue_job, process_due_jobs, register_handler


def test_outbound_urls_reject_credentials_and_metadata() -> None:
    assert validate_base_url("https://api.example.com/v1") == "https://api.example.com/v1"
    for unsafe in (
        "ftp://example.com",
        "https://user:pass@example.com",
        "https://example.com/path?query=1",
        "http://169.254.169.254/latest/meta-data",
        "http://metadata.google.internal",
    ):
        with pytest.raises(ValueError):
            validate_base_url(unsafe)


def test_settings_reject_metadata_endpoint() -> None:
    with pytest.raises(ValidationError):
        Settings(github_api_url="http://169.254.169.254")


def test_production_requires_https_for_external_base_urls() -> None:
    settings = Settings(
        environment="production",
        auth_required=True,
        database_url="postgresql+psycopg://user:pass@db:5432/app",
        cors_origins="https://app.example.com",
        app_base_url="https://app.example.com",
        github_api_url="http://github.example.com",
        email_delivery="smtp",
        smtp_host="smtp.example.com",
        smtp_username="mailer",
        smtp_password="secret",
    )
    errors = settings.runtime_config_errors()
    assert "GITHUB_API_URL must use HTTPS in production." in errors
    assert https_required("http://example.com") is False
    assert https_required("https://example.com") is True


def test_secret_box_roundtrip_and_tamper_detection() -> None:
    box = SecretBox(Fernet.generate_key())
    encrypted = box.encrypt_json({"token": "single-use", "to": "a@example.com"})
    assert "single-use" not in encrypted
    assert box.decrypt_json(encrypted)["token"] == "single-use"
    with pytest.raises(ValueError):
        box.decrypt_json(encrypted[:-2] + "AA")


def test_job_payload_is_encrypted_and_cleared_after_success(db_session) -> None:
    settings = get_settings()
    previous = settings.credential_encryption_key
    settings.credential_encryption_key = Fernet.generate_key().decode()
    seen: list[dict] = []

    def handler(_db, payload: dict) -> None:
        seen.append(payload)

    register_handler("test.echo", handler)
    try:
        job = enqueue_job(
            db_session,
            kind="test.echo",
            payload={"token": "super-secret-token"},
            dedupe_key="test-job-dedupe-1",
        )
        assert "super-secret-token" not in job.encrypted_payload
        assert "super-secret-token" not in str(dict(job.__dict__))

        assert process_due_jobs() >= 1
        db_session.expire_all()
        stored = db_session.get(BackgroundJob, job.id)
        assert stored is not None
        assert stored.status == "succeeded"
        assert stored.encrypted_payload == ""
        assert seen == [{"token": "super-secret-token"}]

        assert secret_box(settings)
    finally:
        settings.credential_encryption_key = previous


def test_trusted_proxy_forwarded_for_is_used() -> None:
    def request(peer: str, forwarded: str | None) -> Request:
        headers = []
        if forwarded is not None:
            headers.append((b"x-forwarded-for", forwarded.encode()))
        return Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/",
                "headers": headers,
                "client": (peer, 1234),
                "scheme": "http",
                "server": ("test", 80),
                "query_string": b"",
            }
        )

    trusted = {"127.0.0.1"}
    assert _client_key(request("127.0.0.1", "203.0.113.9, 127.0.0.1"), trusted) == "203.0.113.9"
    assert _client_key(request("198.51.100.4", "203.0.113.9"), trusted) == "198.51.100.4"
    assert _client_key(request("127.0.0.1", "not-an-ip"), trusted) == "127.0.0.1"


def test_auth_routes_have_a_separate_limit() -> None:
    app = FastAPI()

    @app.post("/api/v1/auth/login")
    def login() -> dict:
        return {"ok": True}

    app.add_middleware(
        RateLimitMiddleware,
        limit_per_minute=0,
        auth_limit_per_minute=1,
    )
    with TestClient(app) as client:
        assert client.post("/api/v1/auth/login").status_code == 200
        limited = client.post("/api/v1/auth/login")
        assert limited.status_code == 429
        assert limited.headers["retry-after"] == "60"
