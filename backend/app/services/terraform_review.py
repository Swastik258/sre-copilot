"""Deterministic Terraform plan review.

This module parses the JSON produced by ``terraform show -json`` (or a saved plan
converted to JSON). It never runs Terraform, reads cloud credentials, or applies
changes. Only resource-change metadata and attribute *names* are returned, never
attribute values, because plan files can contain sensitive data.
"""

from __future__ import annotations

from typing import Any

from app.core.errors import ValidationError
from app.schemas.evidence import Evidence, EvidenceSource, Severity
from app.schemas.terraform import (
    BlastRadius,
    TerraformAction,
    TerraformChange,
    TerraformFinding,
    TerraformReviewResponse,
    TerraformSummary,
)
from app.services.evidence import build_evidence

# Resource types where replacement or deletion commonly means data loss or a
# substantial outage. The list is intentionally conservative; suffix checks
# below cover common provider naming patterns.
_STATEFUL_TYPES = {
    "aws_db_instance",
    "aws_rds_cluster",
    "aws_rds_cluster_instance",
    "aws_dynamodb_table",
    "aws_elasticache_cluster",
    "aws_redshift_cluster",
    "aws_s3_bucket",
    "aws_ebs_volume",
    "aws_efs_file_system",
    "aws_fsx_lustre_file_system",
    "google_sql_database_instance",
    "google_storage_bucket",
    "google_compute_disk",
    "google_bigquery_dataset",
    "google_kms_crypto_key",
    "azurerm_postgresql_server",
    "azurerm_mysql_server",
    "azurerm_sql_server",
    "azurerm_storage_account",
    "azurerm_managed_disk",
    "azurerm_key_vault",
    "kubernetes_persistent_volume_claim",
    "kubernetes_secret",
    "kubernetes_config_map",
}
_STATEFUL_SUFFIXES = (
    "_bucket",
    "_volume",
    "_database",
    "_cluster",
    "_db_instance",
    "_rds_cluster",
    "_dynamodb_table",
    "_persistent_volume_claim",
)


def _ev(**kwargs) -> Evidence:
    kwargs.setdefault("source_type", EvidenceSource.terraform)
    return build_evidence(**kwargs)


def _is_stateful(resource_type: str | None) -> bool:
    value = (resource_type or "").lower()
    if value in _STATEFUL_TYPES:
        return True
    return any(value.endswith(suffix) for suffix in _STATEFUL_SUFFIXES)


def _action(actions: list[str]) -> TerraformAction:
    if actions == ["create"]:
        return "create"
    if actions == ["update"]:
        return "update"
    if actions == ["delete"]:
        return "destroy"
    if "delete" in actions and "create" in actions:
        return "replace"
    if actions == ["read"]:
        return "read"
    if actions == ["no-op"]:
        return "no-op"
    return "unknown"


def _flatten_paths(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value[:100]:
        if isinstance(item, list):
            result.append(".".join(str(part) for part in item))
        else:
            result.append(str(item))
    return result


def _diff_paths(before: Any, after: Any, *, limit: int = 100) -> list[str]:
    """Return attribute paths whose values differ. Values are never returned."""

    result: list[str] = []

    def walk(left: Any, right: Any, prefix: str) -> None:
        if len(result) >= limit:
            return
        if isinstance(left, dict) and isinstance(right, dict):
            for key in sorted(set(left) | set(right)):
                if len(result) >= limit:
                    return
                key_path = f"{prefix}.{key}" if prefix else str(key)
                walk(left.get(key), right.get(key), key_path)
            return
        if left != right:
            result.append(prefix or "(root)")

    walk(before, after, "")
    return result


def _unknown_paths(value: Any, *, prefix: str = "", limit: int = 100) -> list[str]:
    result: list[str] = []

    def walk(current: Any, path: str) -> None:
        if len(result) >= limit:
            return
        if isinstance(current, dict):
            for key, child in current.items():
                walk(child, f"{path}.{key}" if path else str(key))
        elif isinstance(current, list):
            for index, child in enumerate(current):
                walk(child, f"{path}[{index}]" if path else f"[{index}]")
        elif current:
            result.append(path or "(root)")

    walk(value, prefix)
    return result


def _risk(
    *,
    action: TerraformAction,
    actions: list[str],
    stateful: bool,
    unknown_attributes: list[str],
) -> tuple[str, list[str]]:
    reasons: list[str] = []
    if stateful:
        reasons.append("Stateful resource type")
    if action == "replace":
        risk = "critical" if stateful else "high"
        reasons.append("Replacement destroys the existing resource")
        if actions == ["delete", "create"]:
            reasons.append("Terraform will destroy before creating")
        elif actions == ["create", "delete"]:
            reasons.append("Terraform will create before destroying")
    elif action == "destroy":
        risk = "critical" if stateful else "high"
        reasons.append("Destroy removes the resource")
    elif action == "update":
        risk = "medium" if stateful else "low"
        reasons.append("Update changes an existing resource")
    elif action == "unknown":
        risk = "medium"
        reasons.append("Unrecognized action sequence")
    else:
        risk = "low"
    if unknown_attributes:
        reasons.append("Some values are unknown until apply")
        if risk == "low":
            risk = "medium"
    return risk, reasons


def _finding_title(change: TerraformChange) -> str | None:
    if change.action == "replace":
        return f"Replacement: {change.address}"
    if change.action == "destroy":
        return f"Destroy: {change.address}"
    if change.action == "update" and change.stateful:
        return f"Stateful update: {change.address}"
    if change.unknown_attributes:
        return f"Unknown values: {change.address}"
    return None


def _finding_detail(change: TerraformChange) -> str:
    parts = [f"{change.action} for {change.address}."]
    if change.risk_reasons:
        parts.append(" ".join(change.risk_reasons) + ".")
    if change.replace_paths:
        parts.append("Replacement paths: " + ", ".join(change.replace_paths[:10]) + ".")
    if change.changed_attributes:
        parts.append(
            "Changed attributes: " + ", ".join(change.changed_attributes[:10]) + "."
        )
    if change.unknown_attributes:
        parts.append(
            "Unknown attributes: " + ", ".join(change.unknown_attributes[:10]) + "."
        )
    return " ".join(parts)


def _severity(risk: str) -> Severity:
    return {
        "critical": Severity.critical,
        "high": Severity.high,
        "medium": Severity.medium,
        "low": Severity.low,
    }.get(risk, Severity.info)


def review_plan(plan: dict[str, Any]) -> TerraformReviewResponse:
    if not isinstance(plan, dict):
        raise ValidationError("plan must be a JSON object.")

    raw_changes = plan.get("resource_changes", [])
    if raw_changes is None:
        raw_changes = []
    if not isinstance(raw_changes, list):
        raise ValidationError("plan.resource_changes must be a list.")

    changes: list[TerraformChange] = []
    counts = {
        "create": 0,
        "update": 0,
        "replace": 0,
        "destroy": 0,
        "read": 0,
        "no-op": 0,
        "unknown": 0,
    }

    for item in raw_changes:
        if not isinstance(item, dict):
            raise ValidationError("Each resource_changes entry must be an object.")
        change_data = item.get("change") or {}
        if not isinstance(change_data, dict):
            raise ValidationError("resource_changes[].change must be an object.")
        raw_actions = change_data.get("actions") or []
        if not isinstance(raw_actions, list):
            raise ValidationError("resource_changes[].change.actions must be a list.")

        actions = [str(action) for action in raw_actions]
        action = _action(actions)
        before = change_data.get("before")
        after = change_data.get("after")
        after_unknown = change_data.get("after_unknown")
        changed_attributes = _diff_paths(before, after)
        unknown_attributes = _unknown_paths(after_unknown)
        resource_type = item.get("type")
        stateful = _is_stateful(resource_type)
        risk, risk_reasons = _risk(
            action=action,
            actions=actions,
            stateful=stateful,
            unknown_attributes=unknown_attributes,
        )
        changes.append(
            TerraformChange(
                address=str(item.get("address") or "unknown"),
                type=resource_type,
                name=item.get("name"),
                provider=item.get("provider_name"),
                module=item.get("module_address"),
                actions=actions,
                action=action,
                action_reason=change_data.get("action_reason"),
                replace_paths=_flatten_paths(change_data.get("replace_paths")),
                changed_attributes=changed_attributes,
                unknown_attributes=unknown_attributes,
                stateful=stateful,
                risk=risk,
                risk_reasons=risk_reasons,
            )
        )
        counts[action] += 1

    total = len(changes)
    if any(change.risk == "critical" for change in changes):
        blast_radius: BlastRadius = "critical"
    elif any(change.action in {"replace", "destroy"} for change in changes):
        blast_radius = "high"
    elif any(
        change.risk == "medium"
        or (change.action == "update" and change.stateful)
        or change.unknown_attributes
        for change in changes
    ):
        blast_radius = "medium"
    elif any(change.action in {"create", "update", "read"} for change in changes):
        blast_radius = "low"
    else:
        blast_radius = "none"

    if total == 0:
        headline = "No resource changes in this plan."
    else:
        headline = (
            f"{total} resource change(s): {counts['create']} create, "
            f"{counts['update']} update, {counts['replace']} replacement, "
            f"{counts['destroy']} destroy — {blast_radius} blast radius."
        )

    summary = TerraformSummary(
        total=total,
        create=counts["create"],
        update=counts["update"],
        replace=counts["replace"],
        destroy=counts["destroy"],
        read=counts["read"],
        no_op=counts["no-op"],
        unknown=counts["unknown"],
        blast_radius=blast_radius,
        headline=headline,
    )

    plan_evidence = _ev(
        summary=headline,
        source_resource="terraform.plan",
        payload={
            "format_version": plan.get("format_version"),
            "terraform_version": plan.get("terraform_version"),
            "summary": summary.model_dump(),
        },
        severity=(
            Severity.critical
            if blast_radius == "critical"
            else Severity.high
            if blast_radius == "high"
            else Severity.medium
            if blast_radius == "medium"
            else Severity.info
        ),
        provenance="terraform.plan",
    )
    evidence: list[Evidence] = [plan_evidence]
    findings: list[TerraformFinding] = []

    for change in changes:
        title = _finding_title(change)
        if title is None or len(findings) >= 50:
            continue
        detail = _finding_detail(change)
        item_evidence = _ev(
            summary=f"{title}. {detail}",
            source_resource=change.address,
            payload=change.model_dump(mode="json"),
            severity=_severity(change.risk),
            provenance="terraform.plan.resource_changes",
        )
        evidence.append(item_evidence)
        findings.append(
            TerraformFinding(
                severity=_severity(change.risk),
                title=title,
                detail=detail,
                address=change.address,
                action=change.action,
                evidence_id=item_evidence.id,
            )
        )

    return TerraformReviewResponse(
        format_version=(
            str(plan["format_version"]) if plan.get("format_version") is not None else None
        ),
        terraform_version=(
            str(plan["terraform_version"])
            if plan.get("terraform_version") is not None
            else None
        ),
        summary=summary,
        changes=changes,
        findings=findings,
        evidence=evidence,
    )
