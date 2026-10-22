import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.services.integrations import integration_statuses


def test_defaults_are_demo_and_disabled():
    s = Settings()
    assert s.ai_provider == "mock"
    assert s.demo_mode is True
    assert s.cors_origin_list == ["http://localhost:3000"]


def test_cors_origin_list_splits_and_trims():
    s = Settings(cors_origins="http://a.com, http://b.com ,")
    assert s.cors_origin_list == ["http://a.com", "http://b.com"]


def test_invalid_log_level_is_rejected():
    with pytest.raises(ValidationError):
        Settings(log_level="LOUD")


def test_log_level_is_normalized():
    assert Settings(log_level="debug").log_level == "DEBUG"


def test_demo_mode_is_false_when_any_integration_enabled():
    assert Settings(kubernetes_enabled=True).demo_mode is False
    assert Settings(github_enabled=True).demo_mode is False


def test_external_ai_requires_key():
    assert Settings(ai_provider="openai").external_ai_configured is False
    assert (
        Settings(ai_provider="openai", openai_api_key="sk-x").external_ai_configured is True
    )
    assert (
        Settings(
            ai_provider="openrouter",
            openrouter_api_key="sk-or-x",
            ai_model="openai/gpt-4o-mini",
        ).external_ai_configured
        is True
    )
    assert Settings(ai_provider="groq").external_ai_configured is False
    assert Settings(ai_provider="groq", groq_api_key="gsk-test").external_ai_configured is True


def test_integration_status_reflects_configuration():
    report = integration_statuses(Settings())
    by_kind = {i.kind: i for i in report.integrations}
    assert report.demo_mode is True
    assert by_kind["kubernetes"].state.value == "disabled"
    assert by_kind["ai"].state.value == "demo"
    assert by_kind["github"].state.value == "disabled"

    report2 = integration_statuses(
        Settings(github_enabled=True, github_token="ghp_x")
    )
    by_kind2 = {i.kind: i for i in report2.integrations}
    assert by_kind2["github"].state.value == "enabled"

    report3 = integration_statuses(
        Settings(
            ai_provider="openrouter",
            openrouter_api_key="sk-or-x",
            ai_model="openai/gpt-4o-mini",
        )
    )
    by_kind3 = {i.kind: i for i in report3.integrations}
    assert by_kind3["ai"].state.value == "enabled"

    report4 = integration_statuses(
        Settings(ai_provider="groq", groq_api_key="gsk-test")
    )
    by_kind4 = {i.kind: i for i in report4.integrations}
    assert by_kind4["ai"].name == "AI provider (groq)"
    assert by_kind4["ai"].state.value == "enabled"


def test_integration_status_never_leaks_tokens():
    report = integration_statuses(Settings(github_enabled=True, github_token="ghp_supersecret0000000000"))
    dumped = report.model_dump_json()
    assert "ghp_supersecret0000000000" not in dumped
