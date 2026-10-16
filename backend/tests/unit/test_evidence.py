from app.schemas.evidence import EvidenceSource, Severity
from app.services.evidence import build_evidence, fingerprint


def test_build_evidence_redacts_payload_and_summary():
    ev = build_evidence(
        source_type=EvidenceSource.kubernetes,
        summary="Auth failed with token sk-abcdef0123456789abcdef0123456789",
        payload={"env": {"OPENAI_API_KEY": "sk-abcdef0123456789abcdef0123456789"}},
    )
    assert "sk-abcdef" not in ev.summary
    assert "sk-abcdef" not in str(ev.payload)
    assert ev.redacted is True
    assert ev.integrity is not None


def test_integrity_is_stable_and_payload_sensitive():
    payload = {"a": 1, "b": 2}
    assert fingerprint(payload) == fingerprint({"b": 2, "a": 1})
    assert fingerprint(payload) != fingerprint({"a": 1, "b": 3})


def test_evidence_defaults():
    ev = build_evidence(source_type=EvidenceSource.logs, summary="ok")
    assert ev.severity == Severity.info
    assert ev.demo is False
    assert ev.source_resource is None


def test_evidence_demo_flag_is_propagated():
    ev = build_evidence(source_type=EvidenceSource.kubernetes, summary="fixture", demo=True)
    assert ev.demo is True
