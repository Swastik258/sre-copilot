"""Plan catalog, usage metering, and disabled-by-default billing hooks."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Request

from app.api.deps import AdminUser, DbSession, OwnerUser, RequiredUser
from app.core.config import get_settings
from app.core.errors import AppError, ValidationError
from app.schemas.billing import (
    BillingStateResponse,
    PlanCatalogResponse,
    UsageSummaryResponse,
    WebhookAcknowledgement,
)
from app.services import billing as service
from app.services.audit import record_event

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=PlanCatalogResponse)
def plans() -> PlanCatalogResponse:
    return service.catalog()


@router.get("/state", response_model=BillingStateResponse)
def billing_state(user: RequiredUser, db: DbSession) -> BillingStateResponse:
    return service.state(db, user)


@router.get("/usage", response_model=UsageSummaryResponse)
def usage(user: AdminUser, db: DbSession) -> UsageSummaryResponse:
    return service.usage_summary(db, organization_id=user.tenant_id)


@router.post("/checkout", status_code=501)
def checkout(_: OwnerUser) -> None:
    raise service.BillingDisabledError(
        "Checkout is not implemented in this release. All live features are free."
    )


@router.post("/portal", status_code=501)
def portal(_: OwnerUser) -> None:
    raise service.BillingDisabledError(
        "The billing portal is not implemented in this release."
    )


@router.post("/webhook/stripe", response_model=WebhookAcknowledgement)
async def stripe_webhook(request: Request, db: DbSession) -> WebhookAcknowledgement:
    settings = get_settings()
    service.require_billing_enabled()
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not settings.stripe_webhook_secret or not service.verify_stripe_signature(
        payload,
        signature,
        secret=settings.stripe_webhook_secret,
        tolerance_seconds=settings.stripe_webhook_tolerance_seconds,
    ):
        raise AppError(
            "Invalid Stripe webhook signature.",
            status_code=400,
            code="invalid_signature",
        )
    try:
        parsed: Any = json.loads(payload)
    except (ValueError, TypeError):
        raise ValidationError("Webhook payload must be valid JSON.") from None
    if not isinstance(parsed, dict):
        raise ValidationError("Webhook payload must be a JSON object.")
    event = service.store_webhook(db, payload=parsed)
    record_event(
        db,
        action="billing.webhook.received",
        actor="system",
        decision="allow",
        tenant_id="system",
        resource={"provider": "stripe", "event_id": event.event_id},
        outcome={"type": event.event_type, "status": event.status},
    )
    return WebhookAcknowledgement()
