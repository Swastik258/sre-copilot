# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SRE, platform, and DevOps engineers investigating infrastructure incidents. They need to understand likely causes and verify each finding against source evidence.

## Product Purpose

Tarn helps operators investigate infrastructure incidents and understand the evidence behind likely causes. Success means operators can review the findings, verify their sources, and make their own decisions.

## Positioning

Tarn performs read-only investigations across configured infrastructure sources and returns structured observations, ranked hypotheses, and evidence references so operators can verify the reasoning.

## Operating Context

Operators investigate Kubernetes, CI/CD, Terraform, logs, and metrics in the context of infrastructure incidents. Investigations should preserve source context and remain reproducible and auditable.

## Capabilities and Constraints

- Infrastructure-facing access is read-only; generated infrastructure changes are proposals only.
- Current built-in adapters are Kubernetes, GitHub Actions, and Prometheus.
- The product separates observed facts from hypotheses and recommendations.
- Billing is disabled; Pro and Team are planned and unpriced, not for sale.

## Brand Commitments

- The product name is Tarn.
- Preserve the existing Tarn wordmark.

## Evidence on Hand

- The existing workspace screenshot at `frontend/public/images/tarn-workspace-empty.png` shows an empty recent-investigations state, not a live diagnosis.
- No customer testimonials, customer claims, prices, or performance metrics are approved for use.

## Product Principles

1. Evidence before conclusions.
2. Keep observed facts distinct from hypotheses and recommendations.
3. Keep infrastructure access read-only; proposed changes are never applied.
4. Make investigations reproducible and auditable.
5. Do not invent product proof or status.
