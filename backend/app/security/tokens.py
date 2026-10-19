"""Opaque session tokens for local auth.

The raw token is only ever sent to the client (as an HttpOnly cookie). The
database stores a SHA-256 hash of it, so a database leak does not expose usable
sessions.
"""

from __future__ import annotations

import hashlib
import secrets


def generate_token() -> str:
    """Return a URL-safe, high-entropy opaque token (>=256 bits)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Return the hex SHA-256 of ``token`` for storage and lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
