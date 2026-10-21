"""AI-assisted diagnosis endpoints.

The endpoint is intentionally a separate step from deterministic diagnosis:
callers decide when evidence may be sent to an external provider, and the
response is always labelled model-generated.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.ai import AIRequest, StructuredDiagnosis
from app.services.ai import summarize

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/diagnose", response_model=StructuredDiagnosis)
def diagnose(request: AIRequest) -> StructuredDiagnosis:
    return summarize(request)


@router.post("/summarize", response_model=StructuredDiagnosis)
def summarize_alias(request: AIRequest) -> StructuredDiagnosis:
    """Alias for clients that use the more explicit ``summarize`` verb."""

    return summarize(request)
