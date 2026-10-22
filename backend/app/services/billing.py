"""Plan state, usage metering, and Stripe-ready webhook storage.

Payments are deliberately disabled. The checkout and portal endpoints fail with
``billing_disabled``; webhook receipt, signature verification, and usage records
are implemented so a later billing launch does not require a schema change.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.plans import Plan, get_plan, plan_catalog
from app.core.redaction import redact_obj
from app.db.models import BillingWebhookEvent, Organization, Subscription, UsageEvent, User
from app.schemas.billing import (
    BillingStateResponse,
    PlanCatalogResponse,
    PlanInfo,
    SubscriptionOut,
    UsageMetricSummary,
    UsageSummaryResponse,
)


class BillingDisabledError(AppError):
    status_code = 501
    code = "billing_disabled"


def _now() -> datetime:
    return datetime.now(UTC)


def _as_aware(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def _plan_info(plan: Plan) -> PlanInfo:
    return PlanInfo(
        id=plan.id,
        name=plan.name,
        description=plan.description,
        status=plan.status,
        features=dict(plan.features),
        limits=dict(plan.limits),
    )


def catalog(*, current_plan: str | None = None) -> PlanCatalogResponse:
    settings = get_settings()
    return PlanCatalogResponse(
        plans=[_plan_info(plan) for plan in plan_catalog()],
        billing_enabled=settings.billing_enabled,
        current_plan=_plan_info(get_plan(current_plan)) if current_plan else None,
    )


def state(db: Session, user: User) -> BillingStateResponse:
    settings = get_settings()
    organization = db.get(Organization, user.tenant_id)
    plan_id = organization.plan_id if organization else "free"
    subscription = db.scalar(
        select(Subscription).where(Subscription.organization_id == user.tenant_id)
    )
    return BillingStateResponse(
        organization_id=user.tenant_id,
        plan=_plan_info(get_plan(plan_id)),
        billing_enabled=settings.billing_enabled,
        subscription=(
            SubscriptionOut(
                provider=subscription.provider,
                plan_id=subscription.plan_id,
                status=subscription.status,
                current_period_end=subscription.current_period_end,
                cancel_at_period_end=subscription.cancel_at_period_end,
            )
            if subscription
            else None
        ),
    )


def require_billing_enabled() -> None:
    if not get_settings().billing_enabled:
        raise BillingDisabledError(
            "Billing is not enabled for this deployment. All live features are free."
        )


def record_usage(
    db: Session,
    *,
    organization_id: str,
    user_id: str | None = None,
    metric: str,
    quantity: int = 1,
    idempotency_key: str | None = None,
    properties: dict[str, Any] | None = None,
) -> None:
    """Append a usage event without breaking the user-visible request path.

    Callers should pass a stable ``idempotency_key`` for retryable operations.
    Duplicate keys are ignored. Properties are redacted before persistence.
    """

    if quantity < 0 or len(metric) > 64:
        return
    event = UsageEvent(
        organization_id=organization_id,
        user_id=user_id,
        metric=metric,
        quantity=quantity,
        idempotency_key=idempotency_key[:128] if idempotency_key else None,
        properties=redact_obj(properties, enabled=True) if properties else None,
    )
    try:
        db.add(event)
        db.commit()
    except IntegrityError:
        # Duplicate idempotency key; another request already metered it.
        db.rollback()


def usage_summary(
    db: Session, *, organization_id: str, now: datetime | None = None
) -> UsageSummaryResponse:
    moment = now or _now()
    period_start = datetime(moment.year, moment.month, 1, tzinfo=UTC)
    if moment.month == 12:
        period_end = datetime(moment.year + 1, 1, 1, tzinfo=UTC)
    else:
        period_end = datetime(moment.year, moment.month + 1, 1, tzinfo=UTC)
    organization = db.get(Organization, organization_id)
    rows = list(
        db.execute(
            select(
                UsageEvent.metric,
                func.coalesce(func.sum(UsageEvent.quantity), 0),
                func.count(UsageEvent.id),
            )
            .where(
                UsageEvent.organization_id == organization_id,
                UsageEvent.occurred_at >= period_start,
                UsageEvent.occurred_at < period_end,
            )
            .group_by(UsageEvent.metric)
            .order_by(UsageEvent.metric)
        )
    )
    metrics = [
        UsageMetricSummary(metric=metric, quantity=int(quantity), events=int(events))
        for metric, quantity, events in rows
    ]
    return UsageSummaryResponse(
        organization_id=organization_id,
        plan=_plan_info(get_plan(organization.plan_id if organization else "free")),
        period_start=period_start,
        period_end=period_end,
        total_events=sum(item.events for item in metrics),
        metrics=metrics,
    )


def verify_stripe_signature(
    payload: bytes,
    signature_header: str | None,
    *,
    secret: str,
    tolerance_seconds: int,
) -> bool:
    if not signature_header:
        return False
    timestamp: int | None = None
    signatures: list[str] = []
    for part in signature_header.split(","):
        key, _, value = part.strip().partition("=")
        if key == "t":
            try:
                timestamp = int(value)
            except ValueError:
                return False
        elif key == "v1" and value:
            signatures.append(value)
    if timestamp is None or not signatures:
        return False
    if abs(int(time.time()) - timestamp) > tolerance_seconds:
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        f"{timestamp}.".encode() + payload,
        hashlib.sha256,
    ).hexdigest()
    return any(hmac.compare_digest(expected, item) for item in signatures)


def _minimize_stripe_event(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data")
    obj: dict[str, Any] = {}
    if isinstance(data, dict) and isinstance(data.get("object"), dict):
        raw = data["object"]
        for key in ("id", "customer", "subscription", "status", "current_period_end"):
            value = raw.get(key)
            if isinstance(value, str | int | float | bool):
                obj[key] = value
    return {
        "id": str(payload.get("id", ""))[:255],
        "type": str(payload.get("type", ""))[:120],
        "created": payload.get("created"),
        "object": obj,
    }


def store_webhook(db: Session, *, payload: dict[str, Any]) -> BillingWebhookEvent:
    event_id = str(payload.get("id", "")).strip()
    if not event_id:
        raise BillingDisabledError("Webhook payload has no event id.")
    existing = db.scalar(
        select(BillingWebhookEvent).where(BillingWebhookEvent.event_id == event_id)
    )
    if existing is not None:
        return existing
    event = BillingWebhookEvent(
        provider="stripe",
        event_id=event_id,
        event_type=str(payload.get("type", "unknown"))[:120],
        status="ignored",
        payload=_minimize_stripe_event(payload),
        processed_at=_now(),
    )
    try:
        db.add(event)
        db.commit()
    except IntegrityError:
        db.rollback()
        duplicate = db.scalar(
            select(BillingWebhookEvent).where(BillingWebhookEvent.event_id == event_id)
        )
        if duplicate is None:
            raise
        return duplicate
    db.refresh(event)
    return event
