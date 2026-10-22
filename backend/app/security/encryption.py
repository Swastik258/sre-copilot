"""Symmetric encryption for secrets that must be stored at rest.

API keys are one-way hashed and never need decryption. Background-job payloads
can contain a single-use email token, so those payloads are encrypted with
Fernet (AES-128-CBC + HMAC-SHA256) before they touch the database.

Configuration is a URL-safe base64 32-byte key::

    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

Set the result as ``CREDENTIAL_ENCRYPTION_KEY``. Rotating the key requires
re-encrypting queued job payloads; the application never silently falls back to
plaintext in production.
"""

from __future__ import annotations

import json
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import Settings
from app.core.errors import NotConfiguredError


class SecretBox:
    def __init__(self, key: str | bytes) -> None:
        try:
            self._fernet = Fernet(key.encode() if isinstance(key, str) else key)
        except (ValueError, TypeError) as exc:
            raise ValueError("CREDENTIAL_ENCRYPTION_KEY is not a valid Fernet key.") from exc

    def encrypt_text(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("ascii")

    def decrypt_text(self, value: str) -> str:
        try:
            return self._fernet.decrypt(value.encode("ascii")).decode("utf-8")
        except (InvalidToken, UnicodeDecodeError, ValueError) as exc:
            raise ValueError("Encrypted payload could not be decrypted.") from exc

    def encrypt_json(self, value: dict[str, Any]) -> str:
        return self.encrypt_text(
            json.dumps(value, separators=(",", ":"), sort_keys=True)
        )

    def decrypt_json(self, value: str) -> dict[str, Any]:
        parsed = json.loads(self.decrypt_text(value))
        if not isinstance(parsed, dict):
            raise ValueError("Encrypted payload is not a JSON object.")
        return parsed


def secret_box(settings: Settings) -> SecretBox:
    if not settings.credential_encryption_key:
        raise NotConfiguredError(
            "CREDENTIAL_ENCRYPTION_KEY is required for durable background jobs.",
            details={"hint": "Set a Fernet key from cryptography.fernet.Fernet.generate_key()."},
        )
    return SecretBox(settings.credential_encryption_key)
