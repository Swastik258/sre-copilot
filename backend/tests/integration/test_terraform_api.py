"""API tests for Terraform plan review."""

from __future__ import annotations


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


def test_review_endpoint(client) -> None:
    response = client.post("/api/v1/terraform/review", json={"plan": _plan()})

    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["replace"] == 1
    assert body["summary"]["blast_radius"] == "critical"
    assert body["findings"][0]["address"] == "aws_db_instance.primary"
    assert body["evidence"]


def test_review_endpoint_rejects_malformed_plan(client) -> None:
    response = client.post(
        "/api/v1/terraform/review",
        json={"plan": {"resource_changes": "not-a-list"}},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_review_endpoint_rejects_missing_plan(client) -> None:
    response = client.post("/api/v1/terraform/review", json={})

    assert response.status_code == 422
