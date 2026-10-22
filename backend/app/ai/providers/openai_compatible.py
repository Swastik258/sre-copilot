"""OpenAI-compatible chat-completions adapter.

Both OpenAI and OpenRouter expose the same ``/chat/completions`` shape. The
adapter deliberately uses the standard library so enabling AI does not add a
runtime dependency to the backend.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from app.ai.providers.base import ChatMessage
from app.core.errors import AIProviderError

log = logging.getLogger(__name__)


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        name: str,
        model: str,
        api_key: str,
        base_url: str,
        timeout_seconds: float,
        max_output_tokens: int,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self.name = name
        self.model = model
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds
        self._max_output_tokens = max_output_tokens
        self._extra_headers = extra_headers or {}

    def complete(self, messages: list[ChatMessage]) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": self._max_output_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "sre-copilot/0.2",
            **self._extra_headers,
        }
        request = urllib.request.Request(
            f"{self._base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:  # nosec B310
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # Never include the request body or API key in the client response.
            log.warning("AI provider %s returned HTTP %s", self.name, exc.code)
            raise AIProviderError(
                f"{self.name} returned HTTP {exc.code}.",
                details={"provider": self.name, "status": exc.code},
            ) from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            log.warning("AI provider %s request failed: %s", self.name, exc)
            raise AIProviderError(
                f"{self.name} request failed.",
                details={"provider": self.name},
            ) from exc

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            log.warning("AI provider %s returned an unexpected response", self.name)
            raise AIProviderError(
                f"{self.name} returned an unexpected response.",
                details={"provider": self.name},
            ) from exc

        if not isinstance(content, str) or not content.strip():
            raise AIProviderError(
                f"{self.name} returned an empty response.",
                details={"provider": self.name},
            )
        return content
