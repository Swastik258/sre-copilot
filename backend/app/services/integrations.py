"""Integration status reporting.

Derives the *configured* state of each integration from settings. This module
never performs network I/O and never claims a live system is reachable — a live
adapter is responsible for upgrading its state to ``connected`` after a
successful read.
"""

from __future__ import annotations

from app.core.config import Settings
from app.schemas.integrations import IntegrationInfo, IntegrationsResponse, IntegrationState


def _kubernetes(settings: Settings) -> IntegrationInfo:
    has_live_target = bool(settings.kubernetes_kubeconfig or settings.kubernetes_in_cluster)
    if not settings.kubernetes_enabled:
        state = IntegrationState.disabled
        detail = "Read-only Kubernetes diagnosis is disabled."
    elif settings.kubernetes_demo_mode or not has_live_target:
        state = IntegrationState.demo
        detail = "Fixture-backed demo data only; no live cluster configured."
    else:
        state = IntegrationState.enabled
        detail = "Configured for read-only access; reachability not yet verified."
    return IntegrationInfo(
        kind="kubernetes",
        name="Kubernetes",
        state=state,
        enabled=settings.kubernetes_enabled,
        read_only=True,
        detail=detail,
        demo=state == IntegrationState.demo,
    )


def _github(settings: Settings) -> IntegrationInfo:
    if not settings.github_enabled:
        state = IntegrationState.disabled
        detail = "GitHub Actions analysis is disabled."
    elif not settings.github_token:
        state = IntegrationState.unconfigured
        detail = "Enabled but GITHUB_TOKEN is not set."
    else:
        state = IntegrationState.enabled
        detail = "Configured for read-only access; permissions not yet verified."
    return IntegrationInfo(
        kind="github",
        name="GitHub Actions",
        state=state,
        enabled=settings.github_enabled,
        read_only=True,
        detail=detail,
    )


def _prometheus(settings: Settings) -> IntegrationInfo:
    if not settings.prometheus_enabled:
        state = IntegrationState.disabled
        detail = "Metrics queries are disabled."
    elif not settings.prometheus_url and settings.prometheus_demo_mode:
        state = IntegrationState.demo
        detail = "Fixture-backed metric series only; no live Prometheus URL configured."
    elif not settings.prometheus_url:
        state = IntegrationState.unconfigured
        detail = "Enabled but PROMETHEUS_URL is not set and demo mode is off."
    else:
        state = IntegrationState.enabled
        detail = "Configured for read-only queries; reachability not yet verified."
    return IntegrationInfo(
        kind="prometheus",
        name="Prometheus",
        state=state,
        enabled=settings.prometheus_enabled,
        read_only=True,
        detail=detail,
        demo=state == IntegrationState.demo,
    )


def _ai(settings: Settings) -> IntegrationInfo:
    provider = settings.ai_provider
    if provider == "mock":
        state = IntegrationState.demo
        detail = "Deterministic mock provider; no external calls."
    elif settings.ai_privacy_mode:
        state = IntegrationState.unconfigured
        detail = "External AI is blocked by privacy mode."
    elif settings.external_ai_configured:
        state = IntegrationState.enabled
        detail = f"{provider} configured; privacy mode off."
    else:
        state = IntegrationState.unconfigured
        detail = f"{provider} selected but no API key is set."
    return IntegrationInfo(
        kind="ai",
        name=f"AI provider ({provider})",
        state=state,
        enabled=provider != "mock",
        read_only=True,
        detail=detail,
        demo=state == IntegrationState.demo,
    )


def integration_statuses(settings: Settings) -> IntegrationsResponse:
    return IntegrationsResponse(
        demo_mode=settings.demo_mode,
        integrations=[
            _kubernetes(settings),
            _github(settings),
            _prometheus(settings),
            _ai(settings),
        ],
    )
