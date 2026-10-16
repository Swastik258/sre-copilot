def test_integrations_endpoint(client):
    r = client.get("/api/v1/integrations")
    assert r.status_code == 200
    body = r.json()
    assert body["demo_mode"] is True
    kinds = {i["kind"] for i in body["integrations"]}
    assert {"kubernetes", "github", "prometheus", "ai"} <= kinds
    assert all(i["read_only"] is True for i in body["integrations"])


def test_integrations_pagination_params_ignored_gracefully(client):
    r = client.get("/api/v1/integrations", params={"page": 1, "page_size": 10})
    assert r.status_code == 200


def test_openapi_document_is_available(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json()["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/integrations" in paths
