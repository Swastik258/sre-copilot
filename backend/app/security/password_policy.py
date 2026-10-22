"""Password policy shared by signup, reset, and account password changes.

The policy prioritises length over composition rules: at least 12 characters,
no leading/trailing whitespace surprises, and a block list of the most common
passwords and project-specific guesses. This is deliberately stricter than the
legacy eight-character minimum while remaining compatible with passphrases.
"""

from __future__ import annotations

import re

MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_LENGTH = 128

# Small built-in denylist. Deployments with a larger breached-password corpus
# can extend this without changing the API contract.
_DENYLIST = {
    "123456789012",
    "password1234",
    "passwordpassword",
    "qwertyuiop12",
    "correcthorsebatterystaple",
    "srecopilot",
    "srecopilot123",
    "letmein12345",
    "adminadmin12",
    "changeme1234",
}
_EMAIL_LOCAL_RE = re.compile(r"[^@\s]+")


def validate_password_strength(password: str, *, email: str | None = None) -> str:
    """Return the unchanged password or raise ``ValueError`` with a safe message."""

    if password != password.strip():
        raise ValueError("Password must not start or end with whitespace.")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
        )
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must be at most {MAX_PASSWORD_LENGTH} characters."
        )

    normalized = password.casefold()
    if normalized in _DENYLIST:
        raise ValueError("Choose a less common password.")
    if email:
        local = _EMAIL_LOCAL_RE.match(email.strip().lower())
        if local and len(local.group(0)) >= 3 and local.group(0) in normalized:
            raise ValueError("Password must not contain your email name.")
    if len(set(password)) < 5:
        raise ValueError("Choose a password with more variety.")
    return password
