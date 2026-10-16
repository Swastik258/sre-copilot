"""Secret redaction.

Any text that may contain credentials — logs, evidence payloads, model
prompts, audit records — should pass through :func:`redact_text` before it is
persisted, logged, or transmitted.

This is a best-effort denylist of well-known credential shapes plus generic
``key=value`` pairs. It is *defence in depth*, not a guarantee: never rely on
it as the only control for storing sensitive data.
"""

from __future__ import annotations

import re
from typing import Any

REDACTED = "[REDACTED]"

# Order matters: more specific patterns first.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    # PEM private keys (multi-line, non-greedy).
    (
        "private_key",
        re.compile(
            r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----",
            re.DOTALL,
        ),
    ),
    # Provider keys with recognizable prefixes.
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9_\-]{16,}\b")),
    ("anthropic_key", re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{16,}\b")),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("aws_secret_key", re.compile(r"(?i)\baws_secret_access_key\b\s*[:=]\s*\S+")),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    # JSON Web Tokens.
    (
        "jwt",
        re.compile(r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\b"),
    ),
    # Authorization headers.
    (
        "bearer",
        re.compile(r"(?i)\b(authorization|bearer)\b\s*[:=]?\s*(bearer\s+)?[A-Za-z0-9._\-]{12,}"),
    ),
    # Connection strings with inline credentials (scheme://user:pass@host).
    (
        "uri_password",
        re.compile(r"(\b[a-z][a-z0-9+.\-]*://[^/\s:@]+):([^/\s@]+)@", re.IGNORECASE),
    ),
    # Generic secret assignments: password=..., token: ..., api_key=...
    (
        "kv_secret",
        re.compile(
            r"(?i)\b(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|"
            r"client[_-]?secret|private[_-]?key)\b\s*[:=]\s*[\"']?([^\s\"',;]{3,})[\"']?"
        ),
    ),
]


def redact_text(text: str, *, enabled: bool = True) -> str:
    """Return ``text`` with recognized secrets replaced by ``[REDACTED]``."""
    if not enabled or not text:
        return text

    result = text
    for name, pattern in _PATTERNS:
        if name in {"uri_password", "kv_secret"}:
            # These patterns capture structure; keep the label, drop the value.
            if name == "uri_password":
                result = pattern.sub(lambda m: f"{m.group(1)}:{REDACTED}@", result)
            else:
                result = pattern.sub(lambda m: f"{m.group(1)}={REDACTED}", result)
        else:
            result = pattern.sub(REDACTED, result)
    return result


def redact_obj(value: Any, *, enabled: bool = True) -> Any:
    """Recursively redact secrets from strings inside dicts/lists/tuples."""
    if not enabled:
        return value
    if isinstance(value, str):
        return redact_text(value, enabled=enabled)
    if isinstance(value, dict):
        return {k: redact_obj(v, enabled=enabled) for k, v in value.items()}
    if isinstance(value, tuple):
        return tuple(redact_obj(v, enabled=enabled) for v in value)
    if isinstance(value, list):
        return [redact_obj(v, enabled=enabled) for v in value]
    return value


class RedactingFilter:
    """A logging filter that redacts secrets from formatted log records."""

    def __init__(self, *, enabled: bool = True) -> None:
        self.enabled = enabled

    def filter(self, record: Any) -> bool:  # pragma: no cover - trivial
        if getattr(record, "redacted", False):
            return True
        try:
            # Format once, then clear args so the record is a safe plain string
            # for every handler (and so ``%``-formatting cannot fail later).
            message = record.getMessage()
            record.msg = redact_text(message, enabled=self.enabled)
            record.args = ()
        except Exception:  # never let redaction break logging
            pass
        record.redacted = True
        return True

