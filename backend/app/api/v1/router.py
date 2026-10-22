from fastapi import APIRouter, Depends

from app.api.deps import enforce_auth
from app.api.v1 import (
    account,
    admin,
    ai,
    audit,
    auth,
    github,
    health,
    infra,
    integrations,
    investigations,
    kubernetes,
    logs,
    metrics,
    runbooks,
    settings,
    terraform,
)

api_router = APIRouter()

# Public: health checks and the auth endpoints themselves.
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(account.router)

# Read-only data routes. ``enforce_auth`` is a no-op unless AUTH_REQUIRED=true,
# so the local demo stays open while shared deployments can lock the API down.
api_router.include_router(
    integrations.router, tags=["integrations"], dependencies=[Depends(enforce_auth)]
)
api_router.include_router(kubernetes.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(github.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(terraform.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(ai.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(logs.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(investigations.router)
api_router.include_router(audit.router)
api_router.include_router(settings.router)
api_router.include_router(metrics.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(runbooks.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(infra.router, dependencies=[Depends(enforce_auth)])
api_router.include_router(admin.router)
