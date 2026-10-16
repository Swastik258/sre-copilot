"""Structured logging with correlation IDs and secret redaction."""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.redaction import RedactingFilter
from app.core.request_context import get_request_id


class PlainFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        request_id = get_request_id()
        if request_id and "request_id=" not in base:
            return f"{base} request_id={request_id}"
        return base


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    if settings.log_json:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            PlainFormatter("%(asctime)s %(levelname)s %(name)s :: %(message)s")
        )
    handler.addFilter(RedactingFilter(enabled=settings.redaction_enabled))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(settings.log_level.upper())
