"""Email delivery modes without making network connections."""

from __future__ import annotations

from email.message import EmailMessage

from app.core.config import Settings
from app.services import email as email_service


class _SMTP:
    instances: list[_SMTP] = []

    def __init__(self, host: str, port: int, **_kwargs) -> None:
        self.host = host
        self.port = port
        self.started_tls = False
        self.logged_in: tuple[str, str] | None = None
        self.sent: EmailMessage | None = None
        _SMTP.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def starttls(self, **_kwargs) -> None:
        self.started_tls = True

    def login(self, username: str, password: str) -> None:
        self.logged_in = (username, password)

    def send_message(self, message: EmailMessage) -> None:
        self.sent = message


def _settings(**values) -> Settings:
    defaults = {
        "email_delivery": "smtp",
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_username": "mailer",
        "smtp_password": "smtp-secret",
        "smtp_starttls": True,
        "email_from": "SRE Copilot <noreply@example.com>",
        "app_base_url": "https://app.example.com",
    }
    defaults.update(values)
    return Settings(**defaults)


def test_disabled_and_console_modes_do_not_use_smtp(monkeypatch) -> None:
    monkeypatch.setattr(email_service, "_send", email_service._send)  # keep the real function
    message = email_service._message(
        _settings(email_delivery="disabled"),
        to="ada@example.com",
        subject="Subject",
        text="Body",
    )
    monkeypatch.setattr(
        email_service,
        "get_settings",
        lambda: _settings(email_delivery="disabled"),
    )
    email_service._send(message)

    monkeypatch.setattr(
        email_service,
        "get_settings",
        lambda: _settings(email_delivery="console"),
    )
    email_service._send(message)


def test_smtp_starttls_login_and_send(monkeypatch) -> None:
    _SMTP.instances.clear()
    monkeypatch.setattr(email_service.smtplib, "SMTP", _SMTP)
    settings = _settings()
    monkeypatch.setattr(email_service, "get_settings", lambda: settings)
    email_service.send_verification_email(settings, to="ada@example.com", token="verify-token")
    client = _SMTP.instances[-1]
    assert client.host == "smtp.example.com"
    assert client.started_tls is True
    assert client.logged_in == ("mailer", "smtp-secret")
    assert client.sent is not None
    assert client.sent["To"] == "ada@example.com"
    assert "verify-token" in client.sent.get_content()


def test_smtp_ssl_and_failure_are_contained(monkeypatch) -> None:
    _SMTP.instances.clear()
    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", _SMTP)
    settings = _settings(smtp_use_ssl=True, smtp_starttls=False)
    monkeypatch.setattr(email_service, "get_settings", lambda: settings)
    email_service.send_password_reset_email(settings, to="ada@example.com", token="reset-token")
    assert _SMTP.instances[-1].started_tls is False

    class BrokenSMTP(_SMTP):
        def send_message(self, message: EmailMessage) -> None:
            raise OSError("relay down")

    monkeypatch.setattr(email_service.smtplib, "SMTP", BrokenSMTP)
    monkeypatch.setattr(email_service, "get_settings", lambda: _settings(smtp_use_ssl=False))
    email_service.send_verification_email(settings, to="ada@example.com", token="verify-token")


def test_smtp_without_host_is_a_noop(monkeypatch) -> None:
    settings = _settings(smtp_host=None)
    monkeypatch.setattr(email_service, "get_settings", lambda: settings)
    email_service.send_verification_email(settings, to="ada@example.com", token="verify-token")
