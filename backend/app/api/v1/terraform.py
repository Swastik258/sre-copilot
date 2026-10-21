"""Terraform plan review endpoints.

This route parses a supplied plan JSON document. It never invokes Terraform,
reads cloud credentials, or applies changes.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.ai import AIRequest
from app.schemas.terraform import (
    TerraformExplainRequest,
    TerraformExplainResponse,
    TerraformReviewRequest,
    TerraformReviewResponse,
)
from app.services.ai import summarize
from app.services.settings_store import get_ai_privacy_override
from app.services.terraform_review import review_plan

router = APIRouter(prefix="/terraform", tags=["terraform"])


@router.post("/review", response_model=TerraformReviewResponse)
def review(request: TerraformReviewRequest) -> TerraformReviewResponse:
    return review_plan(request.plan)


@router.post("/explain", response_model=TerraformExplainResponse)
def explain(
    request: TerraformExplainRequest, db: DbSession, user: CurrentUser
) -> TerraformExplainResponse:
    review_result = review_plan(request.plan)
    explanation = summarize(
        AIRequest(
            question=request.question,
            surface="terraform",
            evidence=review_result.evidence,
        ),
        privacy_mode=get_ai_privacy_override(
            db, user.tenant_id if user else "default"
        ),
    )
    return TerraformExplainResponse(review=review_result, explanation=explanation)
