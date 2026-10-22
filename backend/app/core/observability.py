"""HTTP observability: access logs, request metrics, and OpenTelemetry spans.

Logs deliberately exclude query strings, client addresses, user agents, request
bodies, and user identifiers. Route labels use the framework's route template,
never the raw path, to keep metrics cardinality bounded and avoid leaking IDs.
"""

from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from app.core.prom_metrics import (
    HTTP_DURATION,
    HTTP_IN_FLIGHT,
    HTTP_REQUESTS,
)

log = logging.getLogger("app.access")


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    if isinstance(path, str) and path:
        return path
    return "unmatched"


def _tracer():
    try:
        from opentelemetry import trace

        return trace.get_tracer("sre-copilot.http")
    except Exception:  # noqa: BLE001 - tracing is optional
        return None


def _parent_context(request: Request):
    try:
        from opentelemetry.propagate import extract

        carrier = {
            name: request.headers[name]
            for name in ("traceparent", "tracestate", "baggage")
            if name in request.headers
        }
        return extract(carrier)
    except Exception:  # noqa: BLE001
        return None


class ObservabilityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, access_log_enabled: bool = True) -> None:
        super().__init__(app)
        self.access_log_enabled = access_log_enabled

    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        HTTP_IN_FLIGHT.inc()
        tracer = _tracer()
        span = None
        result = None
        try:
            if tracer is not None:
                try:
                    from opentelemetry.trace import SpanKind

                    span = tracer.start_as_current_span(
                        f"{request.method} request",
                        context=_parent_context(request),
                        kind=SpanKind.SERVER,
                    )
                    span.__enter__()
                except Exception:  # noqa: BLE001
                    span = None
            result = await call_next(request)
            return result
        except Exception:
            self._record(request, 500, started, failed=True)
            raise
        finally:
            HTTP_IN_FLIGHT.dec()
            if result is not None:
                self._record(request, result.status_code, started, failed=False)
            if span is not None:
                try:
                    from opentelemetry.trace import Status, StatusCode

                    route = _route_template(request)
                    span.set_attribute("http.method", request.method)
                    span.set_attribute("http.route", route)
                    if result is not None:
                        span.set_attribute("http.response.status_code", result.status_code)
                    if result is None or result.status_code >= 500:
                        span.set_status(Status(StatusCode.ERROR))
                    span.__exit__(None, None, None)
                except Exception:  # noqa: BLE001  # nosec B110
                    pass

    def _record(self, request: Request, status: int, started: float, *, failed: bool) -> None:
        duration = max(0.0, time.perf_counter() - started)
        route = _route_template(request)
        method = request.method
        try:
            HTTP_REQUESTS.labels(method=method, route=route, status=str(status)).inc()
            HTTP_DURATION.labels(method=method, route=route).observe(duration)
        except Exception:  # noqa: BLE001  # nosec B110
            pass
        if not self.access_log_enabled:
            return
        extra = {
            "event": "request.failed" if failed else "request.completed",
            "http_method": method,
            "http_route": route,
            "http_status": status,
            "duration_ms": round(duration * 1000, 3),
        }
        if failed:
            log.exception("request failed", extra=extra)
        else:
            log.info("request completed", extra=extra)
