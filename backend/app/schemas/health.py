"""Health, readiness and liveness schemas.

The first two fields (``status`` and ``database``) are kept stable for backward
compatibility with earlier clients; the remaining fields are additive.
"""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str | None = None
    environment: str | None = None
    ai_provider: str | None = None
    demo_mode: bool | None = None
    integrations_enabled: list[str] | None = None


class DependencyHealth(BaseModel):
    name: str
    status: str
    detail: str | None = None
