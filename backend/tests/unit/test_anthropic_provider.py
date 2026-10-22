"""Anthropic Messages adapter shape tests (no network)."""

from __future__ import annotations

import json

import pytest

from app.ai.providers import AnthropicProvider, build_provider
from app.ai.providers import anthropic as anthropic_module
from app.core.config import Settings
from app.core.errors import NotConfiguredError


class _FakeResponse:
    def __init__(self, payload: dict) -> None:
        self._body = json.dumps(payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self) -> bytes:
        return self._body


def test_anthropic_adapter_uses_messages_api_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    def fake_urlopen(request, timeout):
        captured["request"] = request
        captured["timeout"] = timeout
        return _FakeResponse({"content": [{"type": "text", "text": '{"summary": "ok"}'}]})

    monkeypatch.setattr(anthropic_module.urllib.request, "urlopen", fake_urlopen)
    provider = AnthropicProvider(
        model="claude-3-5-sonnet-latest",
        api_key="sk-ant-test",
        base_url="https://api.anthropic.com",
        timeout_seconds=5,
        max_output_tokens=200,
    )

    result = provider.complete(
        [
            {"role": "system", "content": "Return JSON."},
            {"role": "user", "content": "Why did it fail?"},
        ]
    )

    assert result == '{"summary": "ok"}'
    request = captured["request"]
    payload = json.loads(request.data.decode())
    assert request.full_url == "https://api.anthropic.com/v1/messages"
    assert payload["system"] == "Return JSON."
    assert payload["messages"] == [{"role": "user", "content": "Why did it fail?"}]
    assert payload["max_tokens"] == 200


def test_factory_builds_anthropic_when_key_is_set() -> None:
    provider = build_provider(Settings(ai_provider="anthropic", anthropic_api_key="sk-ant-test"))

    assert isinstance(provider, AnthropicProvider)
    assert provider.model == Settings().ai_model


def test_factory_requires_anthropic_key() -> None:
    with pytest.raises(NotConfiguredError):
        build_provider(Settings(ai_provider="anthropic"))
