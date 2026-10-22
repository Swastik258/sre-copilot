"""Central plan catalog and entitlements.

The product currently ships with every live capability available on the Free
plan. Pro and Team are published as planned options only; they are not sold and
no entitlement is withheld today. Keeping the catalog in one module avoids the
frontend and backend drifting into different definitions of a plan.

Prices are intentionally absent until billing is actually enabled. Never show a
price or trial that cannot be purchased.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Final, Literal

PlanId = Literal["free", "pro", "team"]
PlanStatus = Literal["available", "planned"]

FEATURE_IDS: Final[tuple[str, ...]] = (
    "overview",
    "kubernetes",
    "logs",
    "terraform",
    "cicd",
    "history",
    "settings",
    "ai_diagnosis",
    "audit_export",
    "organizations",
    "api_keys",
)


@dataclass(frozen=True)
class Plan:
    id: PlanId
    name: str
    description: str
    status: PlanStatus
    features: dict[str, bool] = field(default_factory=dict)
    limits: dict[str, int | None] = field(default_factory=dict)


def _all_live_features() -> dict[str, bool]:
    return {feature: True for feature in FEATURE_IDS}


_FREE = Plan(
    id="free",
    name="Free · full access",
    description=(
        "Every live capability, including read-only Kubernetes, GitHub Actions, "
        "Terraform review, investigations, audit export, and organizations."
    ),
    status="available",
    features=_all_live_features(),
    limits={
        "organizations": None,
        "workspace_members": None,
        "monthly_ai_requests": None,
        "audit_retention_days": None,
    },
)

_PRO = Plan(
    id="pro",
    name="Pro",
    description="Planned paid tier. Not available for purchase yet.",
    status="planned",
    features=_all_live_features(),
    limits={
        "organizations": None,
        "workspace_members": None,
        "monthly_ai_requests": None,
        "audit_retention_days": None,
    },
)

_TEAM = Plan(
    id="team",
    name="Team",
    description="Planned shared-workspace tier. Not available for purchase yet.",
    status="planned",
    features=_all_live_features(),
    limits={
        "organizations": None,
        "workspace_members": None,
        "monthly_ai_requests": None,
        "audit_retention_days": None,
    },
)

PLANS: Final[dict[PlanId, Plan]] = {"free": _FREE, "pro": _PRO, "team": _TEAM}


def get_plan(plan_id: str | None) -> Plan:
    if plan_id in PLANS:
        return PLANS[plan_id]  # type: ignore[index]
    return _FREE


def entitlement(plan_id: str | None, feature: str) -> bool:
    return bool(get_plan(plan_id).features.get(feature, False))


def plan_catalog() -> list[Plan]:
    return [PLANS["free"], PLANS["pro"], PLANS["team"]]
