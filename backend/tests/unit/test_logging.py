"""Structured logging must correlate requests without leaking secrets."""

from __future__ import annotations

import logging

from app.core.logging import JsonFormatter, PlainFormatter
from app.core.redaction import RedactingFilter


def _record_with_exception() -> logging.LogRecord:
    try:
        raise RuntimeError("token=super-secret-value")
    except RuntimeError:
        import sys

        return logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname=__file__,
            lineno=1,
            msg="request failed",
            args=(),
            exc_info=sys.exc_info(),
        )


def test_exception_messages_are_redacted_before_formatting() -> None:
    record = _record_with_exception()
    RedactingFilter(enabled=True).filter(record)
    formatter = JsonFormatter(service="api", environment="test", version="1")
    output = formatter.format(record)
    assert "super-secret-value" not in output
    assert "[REDACTED]" in output
    assert '"service": "api"' in output


def test_email_addresses_are_redacted_from_logs() -> None:
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="delivery failed for ada@example.com",
        args=(),
        exc_info=None,
    )
    RedactingFilter(enabled=True).filter(record)
    assert "ada@example.com" not in record.getMessage()
    assert "[EMAIL]" in record.getMessage()


def test_access_fields_are_structured_and_newlines_are_escaped() -> None:
    record = logging.LogRecord(
        name="app.access",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="request completed\nforged=true",
        args=(),
        exc_info=None,
    )
    record.event = "request.completed"
    record.http_method = "GET"
    record.http_route = "/api/v1/health"
    record.http_status = 200
    record.duration_ms = 1.25
    RedactingFilter(enabled=True).filter(record)
    output = PlainFormatter(
        "%(levelname)s %(message)s", service="api", environment="test", version="1"
    ).format(record)
    assert "request completed\\nforged=true" in output
    assert "http_route=/api/v1/health" in output
    assert "duration_ms=1.25" in output
