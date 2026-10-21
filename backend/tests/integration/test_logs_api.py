"""API tests for local log analysis."""

from __future__ import annotations


def test_logs_analyze_endpoint_groups_signatures(client) -> None:
    response = client.post(
        "/api/v1/logs/analyze",
        json={
            "text": (
                "2026-10-21T18:02:11Z ERROR redis down\n"
                "2026-10-21T18:02:12Z ERROR redis down\n"
                "2026-10-21T18:02:13Z INFO boot\n"
            ),
            "source": "checkout-api",
            "environment": "production",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["parsed_lines"] == 3
    assert len(body["signatures"]) == 2
    assert body["evidence"]
    assert body["evidence"][0]["source_type"] == "logs"
    assert body["evidence"][0]["environment"] == "production"


def test_logs_analyze_validates_empty_input(client) -> None:
    response = client.post("/api/v1/logs/analyze", json={"text": ""})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
