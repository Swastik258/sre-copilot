"""Plan, entitlement, usage, and billing contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

PlanId = Literal["free", "pro", "team"]


class PlanInfo(BaseModel):
    id: PlanId
    name: str
    description: str
    status: Literal["available", "planned"]
    features: dict[str, bool]
    limits: dict[str, int | None]


class PlanCatalogResponse(BaseModel):
    plans: list[PlanInfo]
    billing_enabled: bool
    current_plan: PlanInfo | None = None


class UsageMetricSummary(BaseModel):
    metric: str
    quantity: int
    events: int


class UsageSummaryResponse(BaseModel):
    organization_id: str
    plan: PlanInfo
    period_start: datetime
    period_end: datetime
    total_events: int
    metrics: list[UsageMetricSummary]


class SubscriptionOut(BaseModel):
    provider: str
    plan_id: str
    status: str
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False


class BillingStateResponse(BaseModel):
    organization_id: str
    plan: PlanInfo
    billing_enabled: bool
    subscription: SubscriptionOut | None = None


class WebhookAcknowledgement(BaseModel):
    received: bool = True
