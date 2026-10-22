"""API-level tests for the AI diagnosis endpoint."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.config import Settings
from app.services import ai as ai_service


def _body() -> dict[str, object]:
    return {
        "question": "Why is the pod failing?",
        "surface": "kubernetes",
        "evidence": [
            {
                "id": "ev-1",
                "source_type": "kubernetes",
                "source_resource": "default/broken",
                "collected_at": datetime.now(UTC).isoformat(),
                "severity": "high",
                "summary": "Container image pull failed with ErrImagePull.",
                "redacted": True,
                "demo": False,
            }
        ],
    }


def test_ai_diagnose_endpoint_returns_validated_shape(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ai_service, "get_settings", lambda: Settings(ai_provider="mock"))

    response = client.post("/api/v1/ai/diagnose", json=_body())

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_provider"] == "mock"
    assert payload["model_generated"] is False
    assert payload["evidence_ids"] == ["ev-1"]
    assert payload["observed_evidence"][0]["id"] == "ev-1"


def test_ai_diagnose_endpoint_reports_unconfigured_provider(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(ai_provider="openrouter"),
    )

    response = client.post("/api/v1/ai/diagnose", json=_body())

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "not_configured"


def test_ai_diagnose_endpoint_validates_blank_question(client) -> None:
    body = _body()
    body["question"] = "   "

    response = client.post("/api/v1/ai/diagnose", json=body)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
