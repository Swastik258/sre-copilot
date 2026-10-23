# Plans, entitlements, and billing

> **Status: no payments.** Tarn does not collect payment details and does
> not sell Pro or Team. Every live capability is available on the Free plan.
> Pro and Team are published as planned tiers only. The code contains the
> metering, plan-state, and webhook seams needed for a later launch, but checkout
> and the customer portal return `501 billing_disabled`.

## Source of truth

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Backend entitlements | `backend/app/core/plans.py` | Feature flags, limits, plan status, no prices |
| Plan API | `GET /api/v1/billing/plans` | Public catalog for clients |
| Workspace state | `GET /api/v1/billing/state` | Current organization plan and subscription shape |
| Usage | `GET /api/v1/billing/usage` | Owner/admin monthly totals per metric |
| Usage writes | `backend/app/services/billing.py` | Append-only, redacted, idempotent metering |
| Public copy | `frontend/lib/plans.ts` | UI labels and honest availability status |

The API is authoritative. The frontend copy must not advertise a paid feature,
price, trial, or limit before the backend catalog enables it.

## Current plan behavior

- New workspaces start on `free`.
- `free` has every live feature enabled and no enforced usage limits.
- `pro` and `team` are `planned`; they do not grant additional behavior and are
  not purchasable.
- Organization plan changes are not exposed through the API while payments are
  disabled.
- Monthly usage is recorded for `investigation.created`, `ai.diagnose`, and
  `ai.summarize`. Usage is for reporting and future billing, not enforcement.
- `usage_events.idempotency_key` prevents double-counting retryable operations.
  Event properties are passed through the standard redactor.

## Stripe-ready webhook

`POST /api/v1/billing/webhook/stripe`:

1. Returns `503` unless `BILLING_ENABLED=true`.
2. Verifies the `Stripe-Signature` HMAC using `STRIPE_WEBHOOK_SECRET` and a
   configurable timestamp tolerance.
3. Rejects invalid signatures with `400 invalid_signature`.
4. Stores a minimized event record keyed by Stripe event id. Re-delivery is
   idempotent.
5. Marks the event `ignored`. No plan is changed and no payment state is trusted
   until a reviewed billing implementation exists.

Never store full Stripe payloads, payment method data, or secrets in audit logs.

## Enabling a future paid launch

Before changing any status to `available`:

1. Implement and review checkout, portal, webhook subscription mapping, refunds,
   tax handling, and dunning.
2. Add provider price ids and webhook secrets to secret management.
3. Add entitlement enforcement at the API boundary, with tests proving Free
   remains usable and planned tiers cannot be selected without a verified
   subscription.
4. Add billing-specific audit events and operator runbooks.
5. Update the public catalog, docs, and changelog in the same change.
