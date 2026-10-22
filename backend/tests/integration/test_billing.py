"""Plan catalog, free entitlements, usage metering, and webhook stubs."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.models import BillingWebhookEvent, UsageEvent
from app.services.billing import record_usage


def _signup(client, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "correct-horse", "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]


def test_plan_catalog_is_public_and_free_has_full_live_access(client) -> None:
    response = client.get("/api/v1/billing/plans")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["billing_enabled"] is False
    plans = {plan["id"]: plan for plan in body["plans"]}
    assert set(plans) == {"free", "pro", "team"}
    assert plans["free"]["status"] == "available"
    assert plans["pro"]["status"] == "planned"
    assert plans["team"]["status"] == "planned"
    assert all(plans["free"]["features"].values())
    assert plans["free"]["limits"]["monthly_ai_requests"] is None


def test_new_workspace_state_and_checkout_stub(client) -> None:
    _signup(client, "billing-state@example.com")
    state = client.get("/api/v1/billing/state")
    assert state.status_code == 200, state.text
    body = state.json()
    assert body["plan"]["id"] == "free"
    assert body["plan"]["status"] == "available"
    assert body["billing_enabled"] is False
    assert body["subscription"] is None

    checkout = client.post("/api/v1/billing/checkout")
    assert checkout.status_code == 501
    assert checkout.json()["error"]["code"] == "billing_disabled"


def test_usage_metering_and_idempotency(client, db_session) -> None:
    user = _signup(client, "billing-usage@example.com")
    created = client.post(
        "/api/v1/investigations",
        json={"title": "Metered investigation", "kind": "logs"},
    )
    assert created.status_code == 201, created.text

    usage = client.get("/api/v1/billing/usage")
    assert usage.status_code == 200, usage.text
    metrics = {item["metric"]: item for item in usage.json()["metrics"]}
    assert metrics["investigation.created"]["quantity"] >= 1

    record_usage(
        db_session,
        organization_id=user["tenant_id"],
        user_id=user["id"],
        metric="test.sample",
        idempotency_key="billing-test-idempotency",
    )
    record_usage(
        db_session,
        organization_id=user["tenant_id"],
        user_id=user["id"],
        metric="test.sample",
        idempotency_key="billing-test-idempotency",
    )
    count = db_session.scalar(
        select(func.count(UsageEvent.id)).where(
            UsageEvent.idempotency_key == "billing-test-idempotency"
        )
    )
    assert count == 1


def test_stripe_webhook_rejects_bad_signature_and_stores_once(client, db_session) -> None:
    settings = get_settings()
    previous_enabled = settings.billing_enabled
    previous_secret = settings.stripe_webhook_secret
    settings.billing_enabled = True
    settings.stripe_webhook_secret = "whsec_test"
    try:
        payload = json.dumps(
            {
                "id": "evt_test_1",
                "type": "customer.subscription.updated",
                "created": int(time.time()),
                "data": {
                    "object": {
                        "id": "sub_test_1",
                        "customer": "cus_test_1",
                        "status": "active",
                        "secret": "must-not-be-retained",
                    }
                },
            }
        ).encode()
        rejected = client.post(
            "/api/v1/billing/webhook/stripe",
            content=payload,
            headers={"content-type": "application/json"},
        )
        assert rejected.status_code == 400
        assert rejected.json()["error"]["code"] == "invalid_signature"

        timestamp = int(time.time())
        signature = hmac.new(
            b"whsec_test",
            f"{timestamp}.".encode() + payload,
            hashlib.sha256,
        ).hexdigest()
        headers = {
            "content-type": "application/json",
            "stripe-signature": f"t={timestamp},v1={signature}",
        }
        accepted = client.post(
            "/api/v1/billing/webhook/stripe", content=payload, headers=headers
        )
        assert accepted.status_code == 200, accepted.text
        assert accepted.json()["received"] is True

        duplicate = client.post(
            "/api/v1/billing/webhook/stripe", content=payload, headers=headers
        )
        assert duplicate.status_code == 200, duplicate.text

        events = list(
            db_session.scalars(
                select(BillingWebhookEvent).where(
                    BillingWebhookEvent.event_id == "evt_test_1"
                )
            )
        )
        assert len(events) == 1
        assert events[0].status == "ignored"
        assert events[0].payload is not None
        assert "secret" not in events[0].payload.get("object", {})
    finally:
        settings.billing_enabled = previous_enabled
        settings.stripe_webhook_secret = previous_secret
