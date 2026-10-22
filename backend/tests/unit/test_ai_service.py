"""Tests for AI provider selection and diagnosis orchestration."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import pytest

from app.ai.providers.base import ChatMessage
from app.core.config import Settings
from app.core.errors import AIProviderError, NotConfiguredError
from app.schemas.ai import AIRequest
from app.schemas.evidence import Evidence, EvidenceSource
from app.services import ai as ai_service


def _evidence() -> Evidence:
    return Evidence(
        id="ev-1",
        source_type=EvidenceSource.kubernetes,
        source_resource="default/broken",
        collected_at=datetime.now(UTC),
        severity="high",
        summary="Container image pull failed with ErrImagePull.",
        demo=False,
    )


class FakeProvider:
    name = "fake"
    model = "fake-model"

    def __init__(self, response: str) -> None:
        self.response = response
        self.messages: list[ChatMessage] = []

    def complete(self, messages: list[ChatMessage]) -> str:
        self.messages = messages
        return self.response


def test_mock_provider_returns_labelled_demo_diagnosis(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ai_service, "get_settings", lambda: Settings(ai_provider="mock"))

    result = ai_service.summarize(
        AIRequest(
            question="Why is the pod failing?",
            surface="kubernetes",
            evidence=[_evidence()],
        )
    )

    assert result.model_provider == "mock"
    assert result.model_generated is False
    assert result.demo is True
    assert result.evidence_ids == ["ev-1"]
    assert result.observed_evidence[0].id == "ev-1"
    assert "Mock AI provider" in result.summary


def test_valid_model_json_is_validated_and_citations_filtered(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    response = {
        "summary": "The image reference is invalid.",
        "confidence": 0.82,
        "hypotheses": [
            {
                "explanation": "The registry rejected the image tag.",
                "confidence": 0.9,
                "evidence_ids": ["ev-1", "ev-made-up"],
            }
        ],
        "next_steps": ["Inspect the image reference in the deployment."],
        "risks": ["The deployment may be rolled back if the tag is corrected."],
        "unknowns": ["Registry authentication logs were not supplied."],
        "proposed_remediation": [
            {
                "description": "Correct the image tag and redeploy.",
                "changes_state": True,
                "risk": "medium",
                "requires_approval": True,
            }
        ],
    }
    provider = FakeProvider(json.dumps(response))
    monkeypatch.setattr(ai_service, "build_provider", lambda _: provider)
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(ai_provider="openai", openai_api_key="test"),
    )

    result = ai_service.summarize(
        AIRequest(
            question="Why is the pod failing?",
            surface="kubernetes",
            evidence=[_evidence()],
        )
    )

    assert result.summary == "The image reference is invalid."
    assert result.confidence == 0.82
    assert result.model_generated is True
    assert result.model_provider == "fake"
    assert result.hypotheses[0].evidence_ids == ["ev-1"]
    assert result.next_steps == ["Inspect the image reference in the deployment."]
    assert result.proposed_remediation[0].risk == "medium"
    assert result.risk_level.value == "medium"
    assert result.unknowns == ["Registry authentication logs were not supplied."]


def test_json_fences_are_tolerated(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = FakeProvider(
        "```json\n" + json.dumps({"summary": "Fenced result.", "confidence": 0.4}) + "\n```"
    )
    monkeypatch.setattr(ai_service, "build_provider", lambda _: provider)
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(ai_provider="openai", openai_api_key="test"),
    )

    result = ai_service.summarize(AIRequest(question="Why?"))

    assert result.summary == "Fenced result."


def test_invalid_json_raises_provider_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ai_service, "build_provider", lambda _: FakeProvider("not json"))
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(ai_provider="openai", openai_api_key="test"),
    )

    with pytest.raises(AIProviderError):
        ai_service.summarize(AIRequest(question="Why?"))


def test_privacy_mode_blocks_external_provider() -> None:
    settings = Settings(
        ai_provider="openrouter",
        ai_privacy_mode=True,
        openrouter_api_key="test-key",
    )

    with pytest.raises(NotConfiguredError, match="privacy mode"):
        ai_service.build_provider(settings)


def test_openrouter_configuration_is_reported_as_configured() -> None:
    settings = Settings(
        ai_provider="openrouter",
        openrouter_api_key="test-key",
        ai_model="openai/gpt-4o-mini",
    )

    assert settings.external_ai_configured is True
    provider = ai_service.build_provider(settings)
    assert provider.name == "openrouter"
    assert provider.model == "openai/gpt-4o-mini"


def test_openrouter_without_key_is_not_configured() -> None:
    with pytest.raises(NotConfiguredError, match="OPENROUTER_API_KEY"):
        ai_service.build_provider(Settings(ai_provider="openrouter"))


def test_openrouter_requires_namespaced_model() -> None:
    with pytest.raises(NotConfiguredError, match="namespaced"):
        ai_service.build_provider(Settings(ai_provider="openrouter", openrouter_api_key="test-key"))


def test_groq_configuration_uses_openai_compatible_provider() -> None:
    settings = Settings(
        ai_provider="groq",
        ai_model="llama-3.3-70b-versatile",
        groq_api_key="test-groq-key",
    )

    assert settings.external_ai_configured is True
    provider = ai_service.build_provider(settings)
    assert provider.name == "groq"
    assert provider.model == "llama-3.3-70b-versatile"


def test_groq_without_api_key_is_not_configured() -> None:
    with pytest.raises(NotConfiguredError, match="GROQ_API_KEY"):
        ai_service.build_provider(Settings(ai_provider="groq", ai_model="llama-3.3-70b-versatile"))


def test_unknown_citation_is_removed_from_result(monkeypatch: pytest.MonkeyPatch) -> None:
    response: dict[str, Any] = {
        "summary": "Insufficient evidence.",
        "confidence": 0.1,
        "hypotheses": [
            {
                "explanation": "Unsupported claim.",
                "confidence": 0.2,
                "evidence_ids": ["ev-does-not-exist"],
            }
        ],
    }
    monkeypatch.setattr(ai_service, "build_provider", lambda _: FakeProvider(json.dumps(response)))
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(ai_provider="openai", openai_api_key="test"),
    )

    result = ai_service.summarize(AIRequest(question="Why?"))

    assert result.hypotheses[0].evidence_ids == []
