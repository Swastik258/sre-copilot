import pytest

from app.adapters.kubernetes.client import DEFAULT_FIXTURE, FixtureKubernetesClient
from app.schemas.evidence import EvidenceSource
from app.services.kubernetes_diagnosis import diagnose_pod


@pytest.fixture(scope="module")
def client() -> FixtureKubernetesClient:
    return FixtureKubernetesClient.from_file(DEFAULT_FIXTURE)


def _statements(result) -> str:
    return " ".join(h.statement for h in result.diagnosis.hypotheses)


def test_crashloop_is_diagnosed_with_evidence(client):
    result = diagnose_pod(client, "prod", "api-7d9f8b6c4-x2k9p")
    assert "CrashLoopBackOff" in _statements(result)
    assert result.diagnosis.confidence >= 0.8
    assert result.diagnosis.model_generated is False
    assert result.diagnosis.evidence_ids
    # Every cited evidence id exists and is Kubernetes-sourced.
    ids = {e.id for e in result.evidence}
    assert set(result.diagnosis.evidence_ids) <= ids
    assert all(e.source_type == EvidenceSource.kubernetes for e in result.evidence)
    assert all(e.demo is True for e in result.evidence)
    assert all(e.integrity for e in result.evidence)


def test_oomkilled_is_diagnosed(client):
    result = diagnose_pod(client, "prod", "worker-5f8c9d-oom1")
    assert "OOMKilled" in _statements(result)
    # The remediation must require explicit approval and never auto-execute.
    assert result.diagnosis.remediation
    assert all(r.requires_approval for r in result.diagnosis.remediation)


def test_image_pull_and_unschedulable_are_diagnosed(client):
    result = diagnose_pod(client, "staging", "reporting-6c4b7d-i9p2")
    text = _statements(result)
    assert "pull" in text.lower()
    assert "schedul" in text.lower()


def test_healthy_pod_has_no_hypotheses(client):
    result = diagnose_pod(client, "prod", "web-6b7c8d-ok01")
    assert result.diagnosis.hypotheses == []
    assert result.diagnosis.confidence == 0.3
    assert result.diagnosis.evidence_ids  # status evidence still collected


class _NoLogsClient(FixtureKubernetesClient):
    def get_pod_logs(self, *args, **kwargs):
        raise RuntimeError("logs are unavailable for a container that has not started")


def test_pending_pod_without_logs_still_diagnoses():
    no_logs = _NoLogsClient.from_file(DEFAULT_FIXTURE)
    result = diagnose_pod(no_logs, "staging", "reporting-6c4b7d-i9p2")
    assert "pull" in _statements(result).lower()


def test_diagnosis_is_deterministic(client):
    a = diagnose_pod(client, "prod", "api-7d9f8b6c4-x2k9p")
    b = diagnose_pod(client, "prod", "api-7d9f8b6c4-x2k9p")
    assert a.diagnosis.summary == b.diagnosis.summary
    assert [h.statement for h in a.diagnosis.hypotheses] == [
        h.statement for h in b.diagnosis.hypotheses
    ]


def test_next_steps_are_read_only(client):
    result = diagnose_pod(client, "prod", "api-7d9f8b6c4-x2k9p")
    assert result.diagnosis.next_steps
    assert all(step.changes_state is False for step in result.diagnosis.next_steps)


def test_secrets_in_logs_are_redacted_before_evidence(client):
    from app.adapters.kubernetes.client import FixtureKubernetesClient

    snapshot = {
        "cluster": {"name": "d", "source": "fixture"},
        "namespaces": [{"name": "prod"}],
        "workloads": [],
        "pods": [
            {
                "namespace": "prod",
                "name": "leaky",
                "phase": "Running",
                "containers": [
                    {"name": "app", "state": "running", "ready": True, "restart_count": 0}
                ],
                "conditions": [],
            }
        ],
        "events": [],
        "logs": {"prod/leaky": {"app": ["token=sk-abcdef0123456789abcdef0123456789"]}},
    }
    leaky = FixtureKubernetesClient(snapshot)
    result = diagnose_pod(leaky, "prod", "leaky")
    dumped = " ".join(str(e.payload) for e in result.evidence)
    assert "sk-abcdef0123456789" not in dumped
