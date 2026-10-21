"""Prometheus fixture-backed query and correlation tests."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.config import Settings
from app.services import metrics as metrics_service


def _fixture_settings() -> Settings:
    return Settings(prometheus_enabled=True, prometheus_demo_mode=True)


def test_query_returns_labelled_demo_series(client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(metrics_service, "get_settings", _fixture_settings)

    response = client.get(
        "/api/v1/metrics/query",
        params={"query": "rate(http_requests_total[5m])", "minutes": 15, "step": "15s"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["demo"] is True
    assert len(body["series"]) == 2
    assert body["series"][0]["points"]
    assert body["evidence"][0]["source_type"] == "prometheus"
    assert "Prometheus returned" in body["summary"]


def test_query_rejects_invalid_step(client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(metrics_service, "get_settings", _fixture_settings)

    response = client.get(
        "/api/v1/metrics/query",
        params={"query": "up", "step": "soon"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_query_reports_unconfigured_prometheus(client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(metrics_service, "get_settings", lambda: Settings())

    response = client.get("/api/v1/metrics/query", params={"query": "up"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "not_configured"


def test_correlation_flags_a_metric_spike_near_event(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(metrics_service, "get_settings", _fixture_settings)

    response = client.post(
        "/api/v1/metrics/correlate",
        json={
            "query": "rate(http_requests_total[5m])",
            "minutes": 15,
            "step": "15s",
            "events": [
                {
                    "timestamp": datetime.now(UTC).isoformat(),
                    "label": "checkout errors began",
                    "severity": "high",
                }
            ],
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["demo"] is True
    assert body["matches"]
    match = body["matches"][0]
    assert match["event_label"] == "checkout errors began"
    assert abs(match["z_score"]) >= 2
    assert match["evidence_id"]
    assert body["evidence"]


def test_correlation_without_events_is_explicit(client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(metrics_service, "get_settings", _fixture_settings)

    response = client.post(
        "/api/v1/metrics/correlate",
        json={"query": "up", "minutes": 15, "step": "15s", "events": []},
    )

    assert response.status_code == 200
    assert response.json()["matches"] == []
    assert "No events" in response.json()["summary"]
