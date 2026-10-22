"""Structured logging with correlation IDs and secret redaction."""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from app.core.config import get_settings
from app.core.redaction import RedactingFilter
from app.core.request_context import get_request_id

_SAFE_EXTRA_KEYS = (
    "event",
    "http_method",
    "http_route",
    "http_status",
    "duration_ms",
    "job_kind",
    "job_status",
)


def _trace_ids() -> tuple[str | None, str | None]:
    try:
        from opentelemetry import trace

        context = trace.get_current_span().get_span_context()
        if context.is_valid:
            return f"{context.trace_id:032x}", f"{context.span_id:016x}"
    except Exception:  # noqa: BLE001 - tracing is optional
        pass
    return None, None


class PlainFormatter(logging.Formatter):
    def __init__(self, fmt: str, *, service: str, environment: str, version: str) -> None:
        super().__init__(fmt)
        self.service = service
        self.environment = environment
        self.version = version

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record).replace("\n", "\\n")
        request_id = get_request_id()
        trace_id, _ = _trace_ids()
        suffix = [
            f"service={self.service}",
            f"env={self.environment}",
            f"version={self.version}",
        ]
        if request_id:
            suffix.append(f"request_id={request_id}")
        if trace_id:
            suffix.append(f"trace_id={trace_id}")
        for key in _SAFE_EXTRA_KEYS:
            value = getattr(record, key, None)
            if value is not None:
                suffix.append(f"{key}={value}")
        return f"{base} " + " ".join(suffix)


class JsonFormatter(logging.Formatter):
    def __init__(self, *, service: str, environment: str, version: str) -> None:
        super().__init__()
        self.service = service
        self.environment = environment
        self.version = version

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": self.service,
            "environment": self.environment,
            "version": self.version,
            "request_id": get_request_id(),
        }
        trace_id, span_id = _trace_ids()
        if trace_id:
            payload["trace_id"] = trace_id
            payload["span_id"] = span_id
        for key in _SAFE_EXTRA_KEYS:
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_text:
            payload["exc"] = record.exc_text
        elif record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    formatter_args = {
        "service": "sre-copilot-api",
        "environment": settings.environment,
        "version": settings.app_version,
    }
    if settings.log_json:
        handler.setFormatter(JsonFormatter(**formatter_args))
    else:
        handler.setFormatter(
            PlainFormatter(
                "%(asctime)s %(levelname)s %(name)s :: %(message)s",
                **formatter_args,
            )
        )
    handler.addFilter(RedactingFilter(enabled=settings.redaction_enabled))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(settings.log_level.upper())
