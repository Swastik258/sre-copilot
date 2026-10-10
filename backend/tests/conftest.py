import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sre_copilot.db")

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as c:
        yield c