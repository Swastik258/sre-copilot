"""Integration status schemas.

These describe what is *configured*, not what is reachable. A status of
``connected`` is only returned by an adapter that has actually performed a
successful read; this model alone never asserts reachability.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class IntegrationState(str, Enum):
    connected = "connected"  # enabled and a live read succeeded
    enabled = "enabled"  # enabled but not yet verified
    unconfigured = "unconfigured"  # enabled but missing credentials/config
    demo = "demo"  # fixture-backed, no live source
    disabled = "disabled"  # explicitly off


class IntegrationInfo(BaseModel):
    kind: str
    name: str
    state: IntegrationState
    enabled: bool
    read_only: bool = True
    detail: str | None = None
    demo: bool = False


class IntegrationsResponse(BaseModel):
    demo_mode: bool
    integrations: list[IntegrationInfo] = Field(default_factory=list)
