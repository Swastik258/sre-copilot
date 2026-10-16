from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.errors import NotFoundError, register_exception_handlers


def _app() -> FastAPI:
    app = FastAPI()
    register_exception_handlers(app)

    class Body(BaseModel):
        name: str

    @app.post("/echo")
    def echo(body: Body) -> dict:
        return {"name": body.name}

    @app.get("/boom")
    def boom() -> dict:
        raise NotFoundError("Widget not found", details={"id": "42"})

    @app.get("/crash")
    def crash() -> dict:
        raise RuntimeError("secret sk-abcdef0123456789abcdef0123456789")

    return app


def test_validation_error_uses_envelope():
    with TestClient(_app(), raise_server_exceptions=False) as client:
        r = client.post("/echo", json={})
        assert r.status_code == 422
        body = r.json()
        assert body["error"]["code"] == "validation_error"
        assert "errors" in body["error"]["details"]


def test_app_error_is_structured():
    with TestClient(_app(), raise_server_exceptions=False) as client:
        r = client.get("/boom")
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "not_found"
        assert r.json()["error"]["details"] == {"id": "42"}


def test_http_404_uses_envelope():
    with TestClient(_app(), raise_server_exceptions=False) as client:
        r = client.get("/does-not-exist")
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "http_404"


def test_unhandled_error_does_not_leak_details():
    with TestClient(_app(), raise_server_exceptions=False) as client:
        r = client.get("/crash")
        assert r.status_code == 500
        assert r.json()["error"]["code"] == "internal_error"
        assert "sk-abcdef" not in r.text
