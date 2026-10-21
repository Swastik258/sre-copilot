"""Tests for deterministic Terraform plan review."""

from __future__ import annotations

import json

import pytest

from app.core.errors import ValidationError
from app.services.terraform_review import review_plan


def _plan() -> dict:
    return {
        "format_version": "1.2",
        "terraform_version": "1.9.0",
        "resource_changes": [
            {
                "address": "aws_s3_bucket.assets",
                "type": "aws_s3_bucket",
                "name": "assets",
                "provider_name": "registry.terraform.io/hashicorp/aws",
                "change": {
                    "actions": ["create"],
                    "before": None,
                    "after": {"bucket": "assets", "tags": {"team": "sre"}},
                    "after_unknown": {"arn": True},
                },
            },
            {
                "address": "aws_db_instance.primary",
                "type": "aws_db_instance",
                "name": "primary",
                "provider_name": "registry.terraform.io/hashicorp/aws",
                "change": {
                    "actions": ["delete", "create"],
                    "before": {"engine_version": "15.4", "storage_gb": 100},
                    "after": {"engine_version": "15.6", "storage_gb": 200},
                    "replace_paths": [["engine_version"]],
                    "after_unknown": {},
                },
            },
            {
                "address": "aws_db_snapshot.legacy",
                "type": "aws_db_snapshot",
                "name": "legacy",
                "change": {
                    "actions": ["delete"],
                    "before": {"identifier": "legacy"},
                    "after": None,
                },
            },
            {
                "address": "aws_instance.web",
                "type": "aws_instance",
                "name": "web",
                "change": {
                    "actions": ["update"],
                    "before": {"ami": "ami-old"},
                    "after": {"ami": "ami-new"},
                },
            },
            {
                "address": "aws_security_group.unchanged",
                "type": "aws_security_group",
                "name": "unchanged",
                "change": {"actions": ["no-op"], "before": {}, "after": {}},
            },
        ],
    }


def test_counts_replacements_destroys_and_creates() -> None:
    result = review_plan(_plan())

    assert result.summary.total == 5
    assert result.summary.create == 1
    assert result.summary.update == 1
    assert result.summary.replace == 1
    assert result.summary.destroy == 1
    assert result.summary.no_op == 1
    assert result.summary.blast_radius == "critical"
    assert "critical blast radius" in result.summary.headline


def test_replacement_is_flagged_with_paths_and_order() -> None:
    result = review_plan(_plan())
    change = next(c for c in result.changes if c.address == "aws_db_instance.primary")

    assert change.action == "replace"
    assert change.stateful is True
    assert change.risk == "critical"
    assert change.replace_paths == ["engine_version"]
    assert "engine_version" in change.changed_attributes
    assert any("destroy before creating" in reason for reason in change.risk_reasons)

    finding = next(f for f in result.findings if f.address == change.address)
    assert "destroy before creating" in finding.detail
    assert finding.evidence_id


def test_destroy_and_unknown_value_findings() -> None:
    result = review_plan(_plan())
    addresses = {finding.address for finding in result.findings}

    assert "aws_db_snapshot.legacy" in addresses
    assert "aws_s3_bucket.assets" in addresses
    assert any("Unknown values" in finding.title for finding in result.findings)


def test_plan_values_are_not_returned() -> None:
    result = review_plan(_plan())
    serialized = json.dumps(result.model_dump(mode="json"))

    assert "15.4" not in serialized
    assert "15.6" not in serialized
    assert "ami-old" not in serialized
    assert "ami-new" not in serialized


def test_empty_plan_is_safe() -> None:
    result = review_plan({"format_version": "1.2"})

    assert result.summary.total == 0
    assert result.summary.blast_radius == "none"
    assert result.summary.headline == "No resource changes in this plan."
    assert result.findings == []
    assert result.evidence


def test_create_before_destroy_is_described() -> None:
    plan = {
        "resource_changes": [
            {
                "address": "aws_instance.web",
                "type": "aws_instance",
                "name": "web",
                "change": {
                    "actions": ["create", "delete"],
                    "before": {"ami": "old"},
                    "after": {"ami": "new"},
                    "replace_paths": [["ami"]],
                },
            }
        ]
    }

    result = review_plan(plan)
    finding = result.findings[0]

    assert "create before destroying" in finding.detail


def test_malformed_resource_changes_are_rejected() -> None:
    with pytest.raises(ValidationError):
        review_plan({"resource_changes": "not-a-list"})
    with pytest.raises(ValidationError):
        review_plan({"resource_changes": [{"change": {"actions": "create"}}]})


def test_unknown_action_is_not_silently_treated_as_safe() -> None:
    result = review_plan(
        {
            "resource_changes": [
                {
                    "address": "example.thing",
                    "type": "example_thing",
                    "change": {"actions": ["forget"], "before": {}, "after": {}},
                }
            ]
        }
    )

    assert result.changes[0].action == "unknown"
    assert result.changes[0].risk == "medium"
    assert result.summary.blast_radius == "medium"
