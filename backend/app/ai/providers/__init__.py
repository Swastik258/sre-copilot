"""AI provider implementations and factory."""

from __future__ import annotations

from app.ai.providers.anthropic import AnthropicProvider
from app.ai.providers.base import AIProvider, ChatMessage
from app.ai.providers.mock import MockProvider
from app.ai.providers.openai_compatible import OpenAICompatibleProvider
from app.core.config import Settings
from app.core.errors import NotConfiguredError

__all__ = [
    "AIProvider",
    "ChatMessage",
    "MockProvider",
    "OpenAICompatibleProvider",
    "AnthropicProvider",
    "build_provider",
]


def build_provider(settings: Settings) -> AIProvider:
    """Build the configured provider, failing clearly when it is unusable."""

    provider = settings.ai_provider

    if provider == "mock":
        return MockProvider()

    if settings.ai_privacy_mode:
        raise NotConfiguredError(
            "External AI is disabled by privacy mode. Set AI_PRIVACY_MODE=false "
            "to allow evidence to be sent to the configured provider."
        )

    if provider == "openrouter":
        if not settings.openrouter_api_key:
            raise NotConfiguredError("OpenRouter is selected but OPENROUTER_API_KEY is not set.")
        if "/" not in settings.ai_model:
            raise NotConfiguredError(
                "OpenRouter model ids are namespaced; set AI_MODEL to a value "
                "such as openai/gpt-4o-mini."
            )
        return OpenAICompatibleProvider(
            name="openrouter",
            model=settings.ai_model,
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            timeout_seconds=settings.ai_timeout_seconds,
            max_output_tokens=settings.ai_max_output_tokens,
            extra_headers={
                "HTTP-Referer": settings.openrouter_http_referer,
                "X-Title": settings.openrouter_app_title,
            },
        )

    if provider == "openai":
        if not settings.openai_api_key:
            raise NotConfiguredError("OpenAI is selected but OPENAI_API_KEY is not set.")
        return OpenAICompatibleProvider(
            name="openai",
            model=settings.ai_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            timeout_seconds=settings.ai_timeout_seconds,
            max_output_tokens=settings.ai_max_output_tokens,
        )

    if provider == "groq":
        if not settings.groq_api_key:
            raise NotConfiguredError("Groq is selected but GROQ_API_KEY is not set.")
        return OpenAICompatibleProvider(
            name="groq",
            model=settings.ai_model,
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            timeout_seconds=settings.ai_timeout_seconds,
            max_output_tokens=settings.ai_max_output_tokens,
        )

    if provider == "nvidia":
        if not settings.nvidia_api_key:
            raise NotConfiguredError("NVIDIA is selected but NVIDIA_API_KEY is not set.")
        return OpenAICompatibleProvider(
            name="nvidia",
            model=settings.ai_model,
            api_key=settings.nvidia_api_key,
            base_url=settings.nvidia_base_url,
            timeout_seconds=settings.ai_timeout_seconds,
            max_output_tokens=settings.ai_max_output_tokens,
        )

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise NotConfiguredError("Anthropic is selected but ANTHROPIC_API_KEY is not set.")
        return AnthropicProvider(
            model=settings.ai_model,
            api_key=settings.anthropic_api_key,
            base_url=settings.anthropic_base_url,
            timeout_seconds=settings.ai_timeout_seconds,
            max_output_tokens=settings.ai_max_output_tokens,
        )

    raise NotConfiguredError(f"Unknown AI provider: {provider}")
