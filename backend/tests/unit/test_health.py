def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "Tarn"
    assert body["docs"] == "/api/docs"
    assert body["openapi"] == "/api/openapi.json"
    assert body["api"] == "/api/v1"


def test_health_returns_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    # New additive fields.
    assert body["version"] == "0.2.0"
    assert body["demo_mode"] is True
    assert body["ai_provider"] == "mock"


def test_liveness_is_independent_of_db(client):
    r = client.get("/api/v1/health/live")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["database"] == "skipped"


def test_readiness_reports_database(client):
    r = client.get("/api/v1/health/ready")
    assert r.status_code == 200
    assert r.json()["database"] == "ok"


def test_request_id_header_is_present_and_echoed(client):
    r = client.get("/")
    assert "X-Request-ID" in r.headers

    r2 = client.get("/", headers={"X-Request-ID": "trace-abc-123"})
    assert r2.headers["X-Request-ID"] == "trace-abc-123"


def test_invalid_request_id_is_replaced(client):
    response = client.get("/", headers={"X-Request-ID": "bad\nvalue"})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "bad\nvalue"


def test_prometheus_metrics_are_exposed(client):
    client.get("/api/v1/health/ready")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    body = response.text
    assert "# TYPE sre_copilot_http_requests_total counter" in body
    assert "sre_copilot_database_ready" in body


def test_metrics_token_can_be_required(client):
    from app.core.config import get_settings

    settings = get_settings()
    previous = settings.metrics_bearer_token
    settings.metrics_bearer_token = "metrics-token-012345"
    try:
        assert client.get("/metrics").status_code == 401
        ok = client.get("/metrics", headers={"Authorization": "Bearer metrics-token-012345"})
        assert ok.status_code == 200
    finally:
        settings.metrics_bearer_token = previous
