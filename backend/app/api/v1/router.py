from fastapi import APIRouter, Depends

from app.api.deps import enforce_auth
from app.api.v1 import auth, health, integrations, kubernetes

api_router = APIRouter()

# Public: health checks and the auth endpoints themselves.
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)

# Read-only data routes. ``enforce_auth`` is a no-op unless AUTH_REQUIRED=true,
# so the local demo stays open while shared deployments can lock the API down.
api_router.include_router(
    integrations.router, tags=["integrations"], dependencies=[Depends(enforce_auth)]
)
api_router.include_router(kubernetes.router, dependencies=[Depends(enforce_auth)])
