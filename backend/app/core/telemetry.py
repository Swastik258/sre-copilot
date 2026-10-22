"""Optional OpenTelemetry tracing and error-tracking setup.

The HTTP span is emitted through the OpenTelemetry API regardless of whether an
SDK is installed. Export is opt-in and requires the ``observability`` extra. No
request bodies, cookies, query strings, or client addresses are attached to
spans or error events.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import Settings, get_settings
from app.core.redaction import redact_obj

log = logging.getLogger("app.telemetry")

_tracer_provider: Any = None
_sentry_active = False


def configure_telemetry(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    _configure_tracing(settings)
    _configure_sentry(settings)


def _configure_tracing(settings: Settings) -> None:
    global _tracer_provider
    if not settings.otel_enabled:
        return
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.samplers import (
            ParentBased,
            TraceIdRatioBased,
        )
    except ImportError:
        log.warning(
            "OTEL_ENABLED is set but the OpenTelemetry SDK is not installed; spans remain no-op."
        )
        return

    provider = TracerProvider(
        resource=Resource.create(
            {
                "service.name": settings.otel_service_name,
                "deployment.environment": settings.environment,
                "service.version": settings.app_version,
            }
        ),
        sampler=ParentBased(TraceIdRatioBased(settings.otel_traces_sample_ratio)),
    )
    if settings.otel_exporter_otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
                OTLPSpanExporter,
            )
            from opentelemetry.sdk.trace.export import BatchSpanProcessor

            provider.add_span_processor(
                BatchSpanProcessor(
                    OTLPSpanExporter(
                        endpoint=settings.otel_exporter_otlp_endpoint,
                        timeout=10,
                    )
                )
            )
        except ImportError:
            log.warning("OTLP exporter package is missing; traces are sampled but not exported.")
    trace.set_tracer_provider(provider)
    _tracer_provider = provider
    log.info("OpenTelemetry tracing enabled")


def _configure_sentry(settings: Settings) -> None:
    global _sentry_active
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk
    except ImportError:
        log.warning("SENTRY_DSN is set but sentry-sdk is not installed.")
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        release=f"{settings.app_name}@{settings.app_version}",
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
        max_request_body_size="never",
        before_send=_scrub_event,
    )
    _sentry_active = True
    log.info("Error tracking enabled")


def _scrub_event(event: dict[str, Any], _hint: dict[str, Any]) -> dict[str, Any]:
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("data", None)
        request.pop("cookies", None)
        headers = request.get("headers")
        if isinstance(headers, dict):
            for name in ("authorization", "cookie", "set-cookie", "x-csrf-token"):
                headers.pop(name, None)
        request.pop("query_string", None)
    event.pop("user", None)
    return redact_obj(event, enabled=True)


def shutdown_telemetry() -> None:
    global _tracer_provider, _sentry_active
    if _tracer_provider is not None:
        try:
            _tracer_provider.shutdown()
        except Exception:  # noqa: BLE001
            log.exception("Could not flush traces")
        _tracer_provider = None
    if _sentry_active:
        try:
            import sentry_sdk

            sentry_sdk.flush(timeout=2.0)
        except Exception:  # noqa: BLE001
            log.exception("Could not flush error events")
        _sentry_active = False
