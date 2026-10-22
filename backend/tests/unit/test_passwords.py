"""Argon2id hashing and transparent legacy-hash verification."""

from __future__ import annotations

import base64
import hashlib

from app.security import passwords


def _b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def test_argon2_roundtrip_and_rehash_detection() -> None:
    stored = passwords.hash_password("correct-horse")
    assert stored.startswith("$argon2id$")
    assert passwords.verify_password("correct-horse", stored) is True
    assert passwords.verify_password("wrong-password", stored) is False
    assert passwords.verify_password("correct-horse", None) is False
    assert passwords.verify_password("correct-horse", "not-a-hash") is False
    assert passwords.needs_rehash(stored) is False
    assert passwords.needs_rehash("not-a-hash") is True
    assert passwords.needs_rehash(None) is True


def test_legacy_scrypt_and_pbkdf2_hashes_still_verify() -> None:
    salt = b"0123456789abcdef"
    expected = hashlib.scrypt(b"correct-horse", salt=salt, n=2**14, r=8, p=1, dklen=32)
    scrypt_hash = f"scrypt$16384$8$1${_b64(salt)}${_b64(expected)}"
    assert passwords.verify_password("correct-horse", scrypt_hash) is True
    assert passwords.verify_password("wrong", scrypt_hash) is False
    assert passwords.needs_rehash(scrypt_hash) is True

    expected_pbkdf2 = hashlib.pbkdf2_hmac("sha256", b"correct-horse", salt, 10, dklen=32)
    pbkdf2_hash = f"pbkdf2$10${_b64(salt)}${_b64(expected_pbkdf2)}"
    assert passwords.verify_password("correct-horse", pbkdf2_hash) is True
    assert passwords.verify_password("wrong", pbkdf2_hash) is False
