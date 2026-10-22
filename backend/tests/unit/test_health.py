def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "SRE Copilot"
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
