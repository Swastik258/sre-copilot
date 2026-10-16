import pytest

from app.core.redaction import REDACTED, redact_obj, redact_text


@pytest.mark.parametrize(
    "secret",
    [
        "sk-abcdef0123456789abcdef0123456789",
        "sk-ant-api03-abcdefghijklmnopqrstuvwxyz",
        "ghp_abcdefghijklmnopqrstuvwxyz0123456789",
        "github_pat_11ABCDEFG0abcdefghijklmnopqrstuv",
        "AKIAIOSFODNN7EXAMPLE",
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123def456ghi789",
    ],
)
def test_known_secret_shapes_are_redacted(secret):
    assert secret not in redact_text(f"token={secret} value")
    assert REDACTED in redact_text(f"token={secret} value")


def test_private_key_is_redacted():
    pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----"
    out = redact_text(pem)
    assert "MIIabc" not in out
    assert REDACTED in out


def test_password_assignment_is_redacted_but_keeps_label():
    out = redact_text("db password=hunter2 host=db")
    assert "hunter2" not in out
    assert "password=" in out


def test_uri_credentials_are_redacted():
    out = redact_text("postgresql://user:s3cr3t@db:5432/app")
    assert "s3cr3t" not in out
    assert "user" in out


def test_redact_obj_recurses_into_structures():
    payload = {
        "token": "sk-abcdef0123456789abcdef0123456789",
        "nested": ["ghp_abcdefghijklmnopqrstuvwxyz0123456789", {"password": "p=abc123"}],
        "safe": "hello",
    }
    out = redact_obj(payload)
    assert out["safe"] == "hello"
    assert "sk-abcdef" not in str(out)
    assert "ghp_" not in str(out)


def test_redaction_can_be_disabled():
    text = "sk-abcdef0123456789abcdef0123456789"
    assert redact_text(text, enabled=False) == text
