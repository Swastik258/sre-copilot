"""Terraform plan review endpoints.

This route parses a supplied plan JSON document. It never invokes Terraform,
reads cloud credentials, or applies changes.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.terraform import TerraformReviewRequest, TerraformReviewResponse
from app.services.terraform_review import review_plan

router = APIRouter(prefix="/terraform", tags=["terraform"])


@router.post("/review", response_model=TerraformReviewResponse)
def review(request: TerraformReviewRequest) -> TerraformReviewResponse:
    return review_plan(request.plan)
