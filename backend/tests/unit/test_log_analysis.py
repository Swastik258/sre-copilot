"""Deterministic log grouping tests."""

from __future__ import annotations

from app.schemas.logs import LogAnalyzeRequest
from app.services.log_analysis import analyze_logs


def test_groups_repeated_lines_and_keeps_stack_frames() -> None:
    text = "\n".join(
        [
            "2026-10-21T18:02:11Z ERROR connect redis: ECONNREFUSED redis:6379",
            "    at Pool.connect (ioredis/redis.js:190)",
            "2026-10-21T18:02:12Z ERROR connect redis: ECONNREFUSED redis:6379",
            "2026-10-21T18:02:13Z INFO healthcheck 200",
        ]
    )

    result = analyze_logs(LogAnalyzeRequest(text=text, source="checkout-api"))

    assert result.parsed_lines == 4
    assert len(result.signatures) == 2
    error = next(item for item in result.signatures if item.severity.value == "high")
    assert error.count == 2
    assert error.first_seen is not None
    assert error.last_seen is not None
    assert error.first_seen < error.last_seen
    assert error.frames
    assert "redis" in error.signature
    assert error.evidence_id is not None
    assert result.evidence


def test_redacts_secrets_before_returning_samples() -> None:
    text = "2026-10-21T18:02:11Z ERROR auth failed token=sk-abcdef0123456789abcdef0123456789"

    result = analyze_logs(LogAnalyzeRequest(text=text))

    assert "sk-abcdef0123456789abcdef0123456789" not in result.signatures[0].sample
    assert "REDACTED" in result.signatures[0].sample
    assert "REDACTED" in str(result.evidence[0].payload)


def test_handles_lines_without_timestamps() -> None:
    result = analyze_logs(LogAnalyzeRequest(text="plain failure\nplain failure"))

    assert result.parsed_lines == 2
    assert result.signatures[0].count == 2
    assert result.signatures[0].first_seen is None
