"""Generic Idempotency-Key support for unsafe API requests.

A request with a client-supplied ``Idempotency-Key`` reserves a row keyed by the
authenticated identity, method, and path. A completed successful response is
replayed; a reused key with a different body is rejected. Pending concurrent
requests are rejected rather than run twice.

The middleware buffers one request body and one JSON response, bounded below.
It deliberately excludes auth and webhook routes, where replaying headers or
cookies would be wrong.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import get_settings
from app.core.request_context import get_request_id
from app.db.models import IdempotencyRecord
from app.db.session import SessionLocal

_UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}
_KEY_RE = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")
_EXCLUDED_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/billing/webhook/",
)
_MAX_BODY_BYTES = 4_000_000
_SAFE_REPLAY_HEADERS = {"content-type", "location", "etag"}
_PENDING_STALE_SECONDS = 300


def _now() -> datetime:
    return datetime.now(UTC)


class IdempotencyMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method") not in _UNSAFE:
            await self.app(scope, receive, send)
            return
        request = Request(scope)
        path = request.url.path
        key = request.headers.get("idempotency-key", "").strip()
        if not path.startswith("/api/") or path.startswith(_EXCLUDED_PREFIXES):
            await self.app(scope, receive, send)
            return
        if not key:
            await self.app(scope, receive, send)
            return
        if not _KEY_RE.fullmatch(key):
            await self._json(
                send,
                422,
                "validation_error",
                "Idempotency-Key must be 8-128 ASCII letters, digits, or . _ : -.",
            )
            return

        body = await _read_body(receive)
        if body is None:
            await self._json(
                send, 413, "payload_too_large", "Request body exceeds the idempotency limit."
            )
            return
        scope_hash = _scope_hash(request, path)
        request_hash = hashlib.sha256(body).hexdigest()
        db = SessionLocal()
        record: IdempotencyRecord | None = None
        try:
            record = db.scalar(
                select(IdempotencyRecord).where(
                    IdempotencyRecord.scope_hash == scope_hash,
                    IdempotencyRecord.idempotency_key == key,
                )
            )
            if record is not None:
                stale_pending = record.status_code is None and _as_aware(
                    record.created_at
                ) < _now() - timedelta(seconds=_PENDING_STALE_SECONDS)
                if _as_aware(record.expires_at) < _now() or stale_pending:
                    db.delete(record)
                    db.commit()
                    record = None
            if record is not None:
                if record.request_hash != request_hash:
                    await self._json(
                        send,
                        409,
                        "idempotency_conflict",
                        "This Idempotency-Key was already used with a different request.",
                    )
                    return
                if record.status_code is None:
                    await self._json(
                        send,
                        409,
                        "idempotency_in_progress",
                        "A request with this Idempotency-Key is still in progress.",
                    )
                    return
                headers = [
                    (name.encode(), value.encode())
                    for name, value in (record.response_headers or {}).items()
                ]
                headers.append((b"idempotency-replayed", b"true"))
                await send(
                    {
                        "type": "http.response.start",
                        "status": record.status_code,
                        "headers": headers,
                    }
                )
                if record.response_body:
                    await send(
                        {
                            "type": "http.response.body",
                            "body": record.response_body.encode("utf-8"),
                        }
                    )
                else:
                    await send({"type": "http.response.body", "body": b""})
                return

            record = IdempotencyRecord(
                scope_hash=scope_hash,
                idempotency_key=key,
                request_hash=request_hash,
                expires_at=_now() + timedelta(hours=get_settings().idempotency_ttl_hours),
            )
            db.add(record)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                await self._json(
                    send,
                    409,
                    "idempotency_in_progress",
                    "A request with this Idempotency-Key is already in progress.",
                )
                return
            db.refresh(record)
        finally:
            db.close()

        replayed = False

        async def replay_receive() -> Message:
            nonlocal replayed
            if not replayed:
                replayed = True
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.disconnect"}

        captured_status: int | None = None
        captured_headers: list[tuple[bytes, bytes]] = []
        chunks: list[bytes] = []

        async def capture(message: Message) -> None:
            nonlocal captured_status, captured_headers
            if message["type"] == "http.response.start":
                captured_status = int(message["status"])
                captured_headers = list(message.get("headers", []))
                return
            if message["type"] == "http.response.body":
                chunks.append(message.get("body", b""))
                if not message.get("more_body", False):
                    await _send_captured(
                        send,
                        captured_status or 500,
                        captured_headers,
                        b"".join(chunks),
                    )
                return

        try:
            await self.app(scope, replay_receive, capture)
        except Exception:
            _delete_record(scope_hash, key)
            raise

        if captured_status is None or not (200 <= captured_status < 300):
            _delete_record(scope_hash, key)
            return
        if chunks and not _is_json(captured_headers):
            _delete_record(scope_hash, key)
            return

        response_body = b"".join(chunks).decode("utf-8", "replace")
        replay_headers = {
            name.decode("latin-1").lower(): value.decode("latin-1")
            for name, value in captured_headers
            if name.decode("latin-1").lower() in _SAFE_REPLAY_HEADERS
        }
        db = SessionLocal()
        try:
            stored = db.scalar(
                select(IdempotencyRecord).where(
                    IdempotencyRecord.scope_hash == scope_hash,
                    IdempotencyRecord.idempotency_key == key,
                )
            )
            if stored is not None:
                stored.status_code = captured_status
                stored.response_body = response_body
                stored.response_headers = replay_headers
                db.commit()
        except Exception:  # noqa: BLE001 - response already sent
            db.rollback()
        finally:
            db.close()

    @staticmethod
    async def _json(send: Send, status: int, code: str, message: str) -> None:
        body = json.dumps(
            {
                "error": {
                    "code": code,
                    "message": message,
                    "details": None,
                    "request_id": get_request_id(),
                }
            },
            separators=(",", ":"),
        ).encode()
        await send(
            {
                "type": "http.response.start",
                "status": status,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": body})


def _scope_hash(request: Request, path: str) -> str:
    identity = request.headers.get("authorization", "")
    if not identity:
        identity = request.headers.get("cookie", "")
    return hashlib.sha256(
        f"{request.method}:{path}?{request.url.query}:{identity}".encode("utf-8", "replace")
    ).hexdigest()


def _as_aware(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


async def _read_body(receive: Receive) -> bytes | None:
    chunks: list[bytes] = []
    total = 0
    while True:
        message = await receive()
        if message["type"] == "http.disconnect":
            return b"".join(chunks)
        if message["type"] != "http.request":
            continue
        chunk = message.get("body", b"")
        total += len(chunk)
        if total > _MAX_BODY_BYTES:
            return None
        chunks.append(chunk)
        if not message.get("more_body", False):
            return b"".join(chunks)


async def _send_captured(
    send: Send, status: int, headers: list[tuple[bytes, bytes]], body: bytes
) -> None:
    await send({"type": "http.response.start", "status": status, "headers": headers})
    await send({"type": "http.response.body", "body": body})


def _is_json(headers: list[tuple[bytes, bytes]]) -> bool:
    for name, value in headers:
        if name.lower() == b"content-type" and b"json" in value.lower():
            return True
    return False


def _delete_record(scope_hash: str, key: str) -> None:
    db = SessionLocal()
    try:
        record = db.scalar(
            select(IdempotencyRecord).where(
                IdempotencyRecord.scope_hash == scope_hash,
                IdempotencyRecord.idempotency_key == key,
            )
        )
        if record is not None:
            db.delete(record)
            db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
    finally:
        db.close()
