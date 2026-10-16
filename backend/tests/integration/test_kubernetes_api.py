import pytest

import app.api.v1.kubernetes as k8s_api
from app.core.config import Settings


def _enable_demo(monkeypatch) -> None:
    monkeypatch.setattr(
        k8s_api,
        "get_settings",
        lambda: Settings(kubernetes_enabled=True, kubernetes_demo_mode=True),
    )


def test_disabled_integration_returns_503(client):
    r = client.get("/api/v1/kubernetes/pods")
    assert r.status_code == 503
    body = r.json()
    assert body["error"]["code"] == "not_configured"
    assert "hint" in (body["error"]["details"] or {})


def test_demo_mode_lists_pods_and_flag(client, monkeypatch):
    _enable_demo(monkeypatch)
    r = client.get("/api/v1/kubernetes/clusters")
    assert r.status_code == 200
    assert r.json()["demo"] is True

    r = client.get("/api/v1/kubernetes/pods", params={"namespace": "prod"})
    assert r.status_code == 200
    names = {p["name"] for p in r.json()["pods"]}
    assert {"api-7d9f8b6c4-x2k9p", "worker-5f8c9d-oom1", "web-6b7c8d-ok01"} <= names


def test_diagnose_endpoint_returns_evidence(client, monkeypatch):
    _enable_demo(monkeypatch)
    r = client.post("/api/v1/kubernetes/pods/prod/api-7d9f8b6c4-x2k9p/diagnose")
    assert r.status_code == 200
    body = r.json()
    assert body["diagnosis"]["model_generated"] is False
    assert body["diagnosis"]["evidence_ids"]
    assert body["evidence"]
    assert any("CrashLoopBackOff" in h["statement"] for h in body["diagnosis"]["hypotheses"])
    # Demo data must be labelled.
    assert all(e["demo"] is True for e in body["evidence"])


def test_logs_endpoint_is_bounded(client, monkeypatch):
    _enable_demo(monkeypatch)
    r = client.get(
        "/api/v1/kubernetes/pods/prod/api-7d9f8b6c4-x2k9p/logs",
        params={"tail_lines": 2},
    )
    assert r.status_code == 200
    assert len(r.json()["logs"]["lines"]) <= 2


def test_pod_not_found_returns_404(client, monkeypatch):
    _enable_demo(monkeypatch)
    r = client.get("/api/v1/kubernetes/pods/prod/does-not-exist")
    assert r.status_code == 404


@pytest.mark.parametrize("bad", [0, 1001])
def test_logs_tail_lines_is_validated(client, monkeypatch, bad):
    _enable_demo(monkeypatch)
    r = client.get(
        "/api/v1/kubernetes/pods/prod/api-7d9f8b6c4-x2k9p/logs",
        params={"tail_lines": bad},
    )
    assert r.status_code == 422
