import os

# Configure a throwaway SQLite database BEFORE the app is imported, because the
# engine and settings are constructed at import time.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sre_copilot.db")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _schema() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
    try:
        os.remove("test_sre_copilot.db")
    except OSError:
        pass


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db_session():
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
