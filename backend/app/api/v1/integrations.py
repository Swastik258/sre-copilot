"""Integration status endpoints.

Exposes what is configured and whether it is live, demo, or unconfigured. Never
returns credentials, tokens, or connection secrets.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.integrations import IntegrationsResponse
from app.services.integrations import integration_statuses

router = APIRouter()


@router.get("/integrations", response_model=IntegrationsResponse, tags=["integrations"])
def list_integrations() -> IntegrationsResponse:
    return integration_statuses(get_settings())
