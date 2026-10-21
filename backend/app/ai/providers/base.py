"""Provider-independent AI interface.

The rest of the backend only depends on :class:`AIProvider`. Adapters are
responsible for transport details, timeouts and provider-specific headers.
"""

from __future__ import annotations

from typing import Protocol, TypedDict


class ChatMessage(TypedDict):
    role: str
    content: str


class AIProvider(Protocol):
    """A minimal text-completion provider used by the diagnosis service."""

    name: str
    model: str

    def complete(self, messages: list[ChatMessage]) -> str:
        """Return the provider's text response for the given messages."""
        ...
