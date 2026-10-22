"""Anthropic Messages API adapter.

Anthropic uses a different request shape from OpenAI-compatible providers:
system prompts are a top-level field, and the response content is a list of
content blocks. The adapter uses the standard library so enabling it adds no
runtime dependency.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from app.ai.providers.base import ChatMessage
from app.core.errors import AIProviderError

log = logging.getLogger(__name__)


class AnthropicProvider:
    def __init__(
        self,
        *,
        model: str,
        api_key: str,
        base_url: str,
        timeout_seconds: float,
        max_output_tokens: int,
    ) -> None:
        self.name = "anthropic"
        self.model = model
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds
        self._max_output_tokens = max_output_tokens

    def complete(self, messages: list[ChatMessage]) -> str:
        system = "\n\n".join(
            message["content"] for message in messages if message["role"] == "system"
        )
        conversation = [
            {"role": message["role"], "content": message["content"]}
            for message in messages
            if message["role"] in {"user", "assistant"}
        ]
        if not conversation:
            conversation = [{"role": "user", "content": "No question supplied."}]

        payload: dict[str, object] = {
            "model": self.model,
            "max_tokens": self._max_output_tokens,
            "temperature": 0.1,
            "messages": conversation,
        }
        if system:
            payload["system"] = system

        request = urllib.request.Request(
            f"{self._base_url}/v1/messages",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "x-api-key": self._api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "sre-copilot/0.2",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:  # nosec B310
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            log.warning("AI provider anthropic returned HTTP %s", exc.code)
            raise AIProviderError(
                f"anthropic returned HTTP {exc.code}.",
                details={"provider": self.name, "status": exc.code},
            ) from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            log.warning("AI provider anthropic request failed: %s", exc)
            raise AIProviderError(
                "anthropic request failed.",
                details={"provider": self.name},
            ) from exc

        blocks = data.get("content") if isinstance(data, dict) else None
        if not isinstance(blocks, list):
            raise AIProviderError(
                "anthropic returned an unexpected response.",
                details={"provider": self.name},
            )
        text = "".join(
            str(block.get("text", ""))
            for block in blocks
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
        if not text:
            raise AIProviderError(
                "anthropic returned an empty response.",
                details={"provider": self.name},
            )
        return text
