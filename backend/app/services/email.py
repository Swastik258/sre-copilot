"""Account email delivery.

``console`` is for local development only and is rejected in production by
settings validation. ``smtp`` uses the standard library so no additional runtime
dependency is required. Delivery failures are logged without tokens or message
bodies and never reveal account existence to the caller.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import Settings, get_settings

log = logging.getLogger("app.email")


def _send(message: EmailMessage) -> None:
    settings = get_settings()
    if settings.email_delivery == "disabled":
        return
    if settings.email_delivery == "console":
        log.info("email console delivery subject=%s", message["Subject"])
        # DEBUG-only local aid. Production rejects console delivery and DEBUG
        # log level, and the recipient address is never logged.
        log.debug("email console body:\n%s", message.get_content())
        return
    if settings.email_delivery != "smtp" or not settings.smtp_host:
        log.error("EMAIL_DELIVERY=smtp without SMTP_HOST; message not sent")
        return

    context = ssl.create_default_context()
    try:
        if settings.smtp_use_ssl:
            client: smtplib.SMTP = smtplib.SMTP_SSL(
                settings.smtp_host,
                settings.smtp_port,
                timeout=settings.smtp_timeout_seconds,
                context=context,
            )
        else:
            client = smtplib.SMTP(
                settings.smtp_host,
                settings.smtp_port,
                timeout=settings.smtp_timeout_seconds,
            )
            if settings.smtp_starttls:
                client.starttls(context=context)
        with client:
            if settings.smtp_username:
                client.login(settings.smtp_username, settings.smtp_password or "")
            client.send_message(message)
    except Exception:  # noqa: BLE001 - delivery must not break the request path
        # Do not log the token, recipient address, or SMTP password.
        log.exception("SMTP delivery failed; check the mail relay configuration")


def _message(settings: Settings, *, to: str, subject: str, text: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = settings.email_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    return message


def send_verification_email(settings: Settings, *, to: str, token: str) -> None:
    link = f"{settings.app_base_url.rstrip('/')}/verify-email?token={token}"
    _send(
        _message(
            settings,
            to=to,
            subject="Verify your Tarn email",
            text=(
                "Confirm your email address to finish setting up Tarn.\n\n"
                f"{link}\n\n"
                f"This link expires in {settings.email_verification_ttl_hours} hours. "
                "If you did not create an account, ignore this message."
            ),
        )
    )


def send_password_reset_email(settings: Settings, *, to: str, token: str) -> None:
    link = f"{settings.app_base_url.rstrip('/')}/reset-password?token={token}"
    _send(
        _message(
            settings,
            to=to,
            subject="Reset your Tarn password",
            text=(
                "Use the link below to choose a new password.\n\n"
                f"{link}\n\n"
                f"This link expires in {settings.password_reset_ttl_minutes} minutes "
                "and can be used once. If you did not request a reset, ignore this message."
            ),
        )
    )
