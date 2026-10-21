"""Read-only infrastructure-code generation endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.infra import InfraGenerateRequest, InfraGenerateResponse
from app.services.infra_code import generate_infra_code

router = APIRouter(prefix="/infra", tags=["infra"])


@router.post("/generate", response_model=InfraGenerateResponse)
def generate(request: InfraGenerateRequest) -> InfraGenerateResponse:
    return generate_infra_code(request)
