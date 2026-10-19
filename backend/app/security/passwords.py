"""Password hashing for local (self-hosted) accounts.

Uses :func:`hashlib.scrypt` from the standard library, with a PBKDF2-HMAC-SHA256
fallback for builds where OpenSSL does not expose scrypt. No third-party
dependency is required, which keeps the project runnable fully offline.

Stored format (fields separated by ``$``)::

    scrypt$<n>$<r>$<p>$<salt_b64>$<hash_b64>
    pbkdf2$<iterations>$<salt_b64>$<hash_b64>

Hashes are salted per user and compared in constant time.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os

_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_DKLEN = 32
_SALT_BYTES = 16
_PBKDF2_ITERATIONS = 200_000


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.b64decode(text.encode("ascii"))


def _scrypt_supported() -> bool:
    try:
        hashlib.scrypt(b"probe", salt=b"probe", n=16, r=1, p=1, dklen=16)
    except (ValueError, AttributeError, TypeError):
        return False
    return True


_USE_SCRYPT = _scrypt_supported()


def _derive(password: str, salt: bytes) -> tuple[str, bytes]:
    if _USE_SCRYPT:
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=_SCRYPT_N,
            r=_SCRYPT_R,
            p=_SCRYPT_P,
            dklen=_DKLEN,
        )
        return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}", derived
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS, dklen=_DKLEN
    )
    return f"pbkdf2${_PBKDF2_ITERATIONS}", derived


def hash_password(password: str) -> str:
    """Return a salted, self-describing hash string for ``password``."""
    salt = os.urandom(_SALT_BYTES)
    prefix, derived = _derive(password, salt)
    return f"{prefix}${_b64(salt)}${_b64(derived)}"


def verify_password(password: str, stored: str | None) -> bool:
    """Constant-time check of ``password`` against a stored hash string."""
    if not stored:
        return False
    try:
        scheme, *parts = stored.split("$")
        if scheme == "scrypt":
            n, r, p, salt_b64, hash_b64 = parts
            salt, expected = _unb64(salt_b64), _unb64(hash_b64)
            derived = hashlib.scrypt(
                password.encode("utf-8"),
                salt=salt,
                n=int(n),
                r=int(r),
                p=int(p),
                dklen=len(expected),
            )
        elif scheme == "pbkdf2":
            iterations, salt_b64, hash_b64 = parts
            salt, expected = _unb64(salt_b64), _unb64(hash_b64)
            derived = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), salt, int(iterations), dklen=len(expected)
            )
        else:
            return False
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(derived, expected)
