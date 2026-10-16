from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.ratelimit import MaxBodySizeMiddleware, RateLimitMiddleware


def _limited_app(limit: int) -> FastAPI:
    app = FastAPI()

    @app.get("/ping")
    def ping() -> dict:
        return {"ok": True}

    @app.get("/api/v1/health")
    def health() -> dict:
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, limit_per_minute=limit)
    return app


def test_rate_limit_disabled_when_zero():
    with TestClient(_limited_app(0)) as client:
        for _ in range(10):
            assert client.get("/ping").status_code == 200


def test_rate_limit_returns_429_when_exceeded():
    with TestClient(_limited_app(3)) as client:
        codes = [client.get("/ping").status_code for _ in range(5)]
        assert codes[:3] == [200, 200, 200]
        assert 429 in codes


def test_health_is_exempt_from_rate_limit():
    with TestClient(_limited_app(1)) as client:
        for _ in range(5):
            assert client.get("/api/v1/health").status_code == 200


def test_body_size_limit_returns_413():
    app = FastAPI()

    @app.post("/echo")
    def echo(payload: dict) -> dict:
        return payload

    app.add_middleware(MaxBodySizeMiddleware, max_bytes=100)
    with TestClient(app) as client:
        big = {"data": "x" * 500}
        r = client.post("/echo", json=big)
        assert r.status_code == 413
        assert r.json()["error"]["code"] == "payload_too_large"
