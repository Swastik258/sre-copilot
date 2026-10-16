from fastapi import APIRouter

from app.api.v1 import health, integrations, kubernetes

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(integrations.router, tags=["integrations"])
api_router.include_router(kubernetes.router)
