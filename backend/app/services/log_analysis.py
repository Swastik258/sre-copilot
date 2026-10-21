"""Deterministic log grouping and signature extraction.

The analyzer is deliberately local and deterministic. It never sends raw logs
to a model, never executes a log-derived command, and never claims a cause. It
turns a bounded text stream into grouped signatures that can be cited as
evidence and, later, correlated with metrics or deploys.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.redaction import redact_text
from app.schemas.evidence import EvidenceSource, Severity
from app.schemas.logs import LogAnalyzeRequest, LogAnalyzeResponse, LogSignature
from app.services.evidence import build_evidence

MAX_LINES = 20_000
MAX_FRAMES = 30
MAX_EVIDENCE = 20

_TIMESTAMP_RE = re.compile(
    r"^\s*\[?(?P<stamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]?\s*"
)
_TIME_ONLY_RE = re.compile(r"^\s*\[?(?P<stamp>\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\]?\s*")
_SEVERITY_RE = re.compile(
    r"(?i)\b(FATAL|CRITICAL|ERROR|ERR|WARNING|WARN|INFO|NOTICE|DEBUG|TRACE)\b"
)
_STACK_RE = re.compile(
    r"^\s+(?:at\s|File\s+\"|Traceback\b|Caused by:|goroutine\s+\d+|"
    r"\.\.\.\s+\d+\s+more|#\d+\s)"
)
_UUID_RE = re.compile(
    r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-"
    r"[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b"
)
_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_HEX_RE = re.compile(r"\b0x[0-9a-fA-F]+\b")
_DURATION_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s?(?:ns|us|µs|ms|s|sec|secs|seconds|m|min|mins|h|hr|hrs)\b",
    re.IGNORECASE,
)
_NUMBER_RE = re.compile(r"\b\d+(?:\.\d+)?\b")

_SEVERITY_RANK = {
    Severity.critical: 5,
    Severity.high: 4,
    Severity.medium: 3,
    Severity.low: 2,
    Severity.info: 1,
}


@dataclass
class _Group:
    signature: str
    severity: Severity
    count: int = 0
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    sample: str = ""
    frames: list[str] = field(default_factory=list)


def _parse_timestamp(line: str) -> tuple[datetime | None, str]:
    match = _TIMESTAMP_RE.match(line)
    if match:
        raw = match.group("stamp").replace("Z", "+00:00")
        if " " in raw and "T" not in raw:
            raw = raw.replace(" ", "T", 1)
        try:
            parsed = datetime.fromisoformat(raw)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed, line[match.end() :]
        except ValueError:
            return None, line[match.end() :]

    match = _TIME_ONLY_RE.match(line)
    if match:
        # A time without a date cannot be placed reliably on a timeline.
        return None, line[match.end() :]
    return None, line


def _severity(line: str) -> tuple[Severity, str]:
    match = _SEVERITY_RE.search(line)
    if not match:
        return Severity.info, line
    token = match.group(1).upper()
    mapping = {
        "FATAL": Severity.critical,
        "CRITICAL": Severity.critical,
        "ERROR": Severity.high,
        "ERR": Severity.high,
        "WARNING": Severity.medium,
        "WARN": Severity.medium,
        "NOTICE": Severity.info,
        "INFO": Severity.info,
        "DEBUG": Severity.low,
        "TRACE": Severity.low,
    }
    return mapping.get(token, Severity.info), line[: match.start()] + line[match.end() :]


def _normalize(message: str) -> str:
    text = _UUID_RE.sub("<uuid>", message)
    text = _IP_RE.sub("<ip>", text)
    text = _HEX_RE.sub("<hex>", text)
    text = _DURATION_RE.sub("<duration>", text)
    text = _NUMBER_RE.sub("<n>", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:300] or "(empty message)"


def _signature_id(severity: Severity, signature: str) -> str:
    digest = hashlib.sha1(f"{severity.value}:{signature}".encode()).hexdigest()
    return digest[:16]


def _parse_line_timestamp(line: str) -> datetime | None:
    stamp, _ = _parse_timestamp(line)
    return stamp


def analyze_logs(request: LogAnalyzeRequest) -> LogAnalyzeResponse:
    settings = get_settings()
    redaction_enabled = settings.redaction_enabled

    raw_lines = request.text.splitlines()
    truncated = len(raw_lines) > MAX_LINES
    lines = raw_lines[:MAX_LINES]
    groups: dict[str, _Group] = {}
    last_key: str | None = None
    parsed_lines = 0

    for raw_line in lines:
        if not raw_line.strip():
            continue
        parsed_lines += 1

        line = redact_text(raw_line, enabled=redaction_enabled)
        if _STACK_RE.match(line) and last_key and last_key in groups:
            group = groups[last_key]
            if len(group.frames) < MAX_FRAMES:
                group.frames.append(line.strip()[:500])
            continue

        severity, line = _severity(line)
        timestamp, message = _parse_timestamp(line)
        if timestamp is None:
            timestamp = _parse_line_timestamp(raw_line)
        signature = _normalize(_SEVERITY_RE.sub("", message, count=1))
        key = _signature_id(severity, signature)

        group = groups.get(key)
        if group is None:
            group = _Group(
                signature=signature,
                severity=severity,
                sample=redact_text(raw_line.strip(), enabled=redaction_enabled)[:1000],
            )
            groups[key] = group
        group.count += 1
        if timestamp is not None:
            if group.first_seen is None or timestamp < group.first_seen:
                group.first_seen = timestamp
            if group.last_seen is None or timestamp > group.last_seen:
                group.last_seen = timestamp
        last_key = key

    ordered = sorted(
        groups.items(),
        key=lambda item: (
            -_SEVERITY_RANK.get(item[1].severity, 0),
            -item[1].count,
            item[1].signature,
        ),
    )
    selected = ordered[: request.limit]

    evidence = []
    signatures: list[LogSignature] = []
    for key, group in selected:
        item = build_evidence(
            source_type=EvidenceSource.logs,
            summary=(
                f"{group.severity.value} signature ({group.count} occurrence"
                f"{'s' if group.count != 1 else ''}): {group.signature}"
            ),
            payload={
                "signature": group.signature,
                "count": group.count,
                "first_seen": group.first_seen.isoformat() if group.first_seen else None,
                "last_seen": group.last_seen.isoformat() if group.last_seen else None,
                "sample": group.sample,
                "frames": group.frames,
            },
            source_resource=request.source or "uploaded logs",
            environment=request.environment,
            timestamp=group.first_seen,
            severity=group.severity,
            provenance="logs.analyze",
            redaction_enabled=redaction_enabled,
        )
        included_in_evidence = len(evidence) < MAX_EVIDENCE
        if included_in_evidence:
            evidence.append(item)
        signatures.append(
            LogSignature(
                id=key,
                signature=group.signature,
                severity=group.severity,
                count=group.count,
                first_seen=group.first_seen,
                last_seen=group.last_seen,
                sample=group.sample,
                frames=group.frames,
                evidence_id=item.id if included_in_evidence else None,
            )
        )

    error_count = sum(
        1 for _, group in ordered if group.severity in {Severity.high, Severity.critical}
    )
    summary = (
        f"Analyzed {parsed_lines} line(s) into {len(ordered)} signature(s)"
        f"{' (showing top ' + str(len(signatures)) + ')' if len(ordered) > len(signatures) else ''}; "
        f"{error_count} signature(s) are error-or-worse."
    )
    if truncated:
        summary += f" Only the first {MAX_LINES:,} lines were analyzed."

    return LogAnalyzeResponse(
        total_lines=len(raw_lines),
        parsed_lines=parsed_lines,
        truncated=truncated,
        signatures=signatures,
        summary=summary,
        evidence=evidence,
        demo=False,
    )
