"""Password hashing for local (self-hosted) accounts.

New passwords use Argon2id (``argon2-cffi``). The verifier also understands the
legacy scrypt and PBKDF2 formats emitted by earlier revisions, so existing
accounts keep working and are transparently upgraded on the next successful
login.

Hashes are salted per user, self-describing, and compared in constant time by
the hashing library. No password or pepper is ever logged.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Final

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# OWASP-aligned Argon2id parameters. 19 MiB is the minimum recommendation; we
# use 64 MiB to leave comfortable headroom for a server-side login path.
_HASHER: Final = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

_LEGACY_SALT_BYTES = 16
_PBKDF2_ITERATIONS = 200_000


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.b64decode(text.encode("ascii"))


def hash_password(password: str) -> str:
    """Return a salted Argon2id hash for ``password``."""
    return _HASHER.hash(password)


def verify_password(password: str, stored: str | None) -> bool:
    """Constant-time check of ``password`` against any supported hash format."""
    if not stored:
        return False
    if stored.startswith("$argon2"):
        try:
            return _HASHER.verify(stored, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
    return _verify_legacy(password, stored)


def needs_rehash(stored: str | None) -> bool:
    """True when a stored hash should be replaced with current parameters."""
    if not stored or not stored.startswith("$argon2"):
        return True
    try:
        return _HASHER.check_needs_rehash(stored)
    except InvalidHashError:
        return True


def _verify_legacy(password: str, stored: str) -> bool:
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
