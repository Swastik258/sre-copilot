"""API tests for runbooks, infra-code generation, and Terraform AI explanation."""

from __future__ import annotations

import pytest

from app.core.config import Settings
from app.services import ai as ai_service


def _plan() -> dict:
    return {
        "format_version": "1.2",
        "terraform_version": "1.9.0",
        "resource_changes": [
            {
                "address": "aws_db_instance.primary",
                "type": "aws_db_instance",
                "name": "primary",
                "change": {
                    "actions": ["delete", "create"],
                    "before": {"engine_version": "15.4"},
                    "after": {"engine_version": "15.6"},
                    "replace_paths": [["engine_version"]],
                },
            }
        ],
    }


def test_runbooks_list_search_get_and_match(client) -> None:
    listing = client.get("/api/v1/runbooks")
    assert listing.status_code == 200
    assert listing.json()["total"] >= 8

    search = client.get("/api/v1/runbooks", params={"query": "redis"})
    assert search.status_code == 200
    assert any(item["id"] == "redis-connection" for item in search.json()["runbooks"])

    detail = client.get("/api/v1/runbooks/oom-killed")
    assert detail.status_code == 200
    assert detail.json()["steps"]

    matched = client.post(
        "/api/v1/runbooks/match",
        json={"kind": "crash_loop", "signal": "restart count climbing"},
    )
    assert matched.status_code == 200
    assert matched.json()["runbook"]["id"] == "crashloop-backoff"

    fallback = client.post("/api/v1/runbooks/match", json={"kind": "mystery"})
    assert fallback.status_code == 200
    assert fallback.json()["runbook"]["id"] == "general-triage"


def test_runbook_detail_is_404_for_unknown_id(client) -> None:
    response = client.get("/api/v1/runbooks/not-real")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_infra_generation_returns_a_safe_deployment(client) -> None:
    response = client.post(
        "/api/v1/infra/generate",
        json={
            "kind": "kubernetes_deployment",
            "name": "checkout",
            "namespace": "shop",
            "image": "ghcr.io/acme/checkout:1.4.2",
            "replicas": 3,
            "port": 8080,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["demo"] is False
    assert body["files"][0]["path"] == "deployment.yaml"
    content = body["files"][0]["content"]
    assert "readOnlyRootFilesystem: true" in content
    assert "allowPrivilegeEscalation: false" in content
    assert "replicas: 3" in content
    assert body["findings"] == []
    assert body["evidence"][0]["provenance"] == "infra.generate"


def test_infra_generation_flags_a_mutable_image_tag(client) -> None:
    response = client.post(
        "/api/v1/infra/generate",
        json={
            "kind": "kubernetes_service",
            "name": "checkout",
            "namespace": "shop",
            "image": "ghcr.io/acme/checkout:latest",
        },
    )

    assert response.status_code == 200
    rules = {finding["rule"] for finding in response.json()["findings"]}
    assert "image-tag" in rules


def test_infra_generation_builds_terraform_module_files(client) -> None:
    response = client.post(
        "/api/v1/infra/generate",
        json={
            "kind": "terraform_module",
            "name": "checkout",
            "namespace": "shop",
            "image": "ghcr.io/acme/checkout:1.4.2",
        },
    )

    assert response.status_code == 200
    paths = [file["path"] for file in response.json()["files"]]
    assert paths == ["versions.tf", "variables.tf", "main.tf", "outputs.tf"]
    assert "kubernetes_deployment_v1" in response.json()["files"][2]["content"]


def test_infra_generation_rejects_invalid_kubernetes_name(client) -> None:
    response = client.post(
        "/api/v1/infra/generate",
        json={"kind": "kubernetes_deployment", "name": "Bad_Name"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_terraform_explain_uses_review_evidence_and_mock_provider(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ai_service, "get_settings", lambda: Settings(ai_provider="mock"))

    response = client.post(
        "/api/v1/terraform/explain",
        json={"plan": _plan(), "question": "What should I verify before apply?"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["review"]["summary"]["replace"] == 1
    assert body["review"]["evidence"]
    assert body["explanation"]["model_provider"] == "mock"
    assert body["explanation"]["model_generated"] is False
