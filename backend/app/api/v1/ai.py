"""AI-assisted diagnosis endpoints.

The endpoint is intentionally a separate step from deterministic diagnosis:
callers decide when evidence may be sent to an external provider, and the
response is always labelled model-generated.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.ai import AIRequest, StructuredDiagnosis
from app.services.ai import summarize
from app.services.settings_store import get_ai_privacy_override

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/diagnose", response_model=StructuredDiagnosis)
def diagnose(
    request: AIRequest, db: DbSession, user: CurrentUser
) -> StructuredDiagnosis:
    tenant_id = user.tenant_id if user else "default"
    return summarize(request, privacy_mode=get_ai_privacy_override(db, tenant_id))


@router.post("/summarize", response_model=StructuredDiagnosis)
def summarize_alias(
    request: AIRequest, db: DbSession, user: CurrentUser
) -> StructuredDiagnosis:
    """Alias for clients that use the more explicit ``summarize`` verb."""

    tenant_id = user.tenant_id if user else "default"
    return summarize(request, privacy_mode=get_ai_privacy_override(db, tenant_id))
