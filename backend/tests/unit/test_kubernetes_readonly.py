"""Structural guarantee that Kubernetes diagnosis is read-only.

These tests assert that the client classes expose no method whose name implies a
mutating operation. The interface is intentionally narrow so that diagnosis code
cannot change cluster state even by mistake.
"""

from app.adapters.kubernetes.client import (
    FixtureKubernetesClient,
    KubernetesReadClient,
    RealKubernetesClient,
)

MUTATING_PREFIXES = (
    "create",
    "update",
    "patch",
    "delete",
    "replace",
    "scale",
    "restart",
    "exec",
    "apply",
    "rollout",
    "drain",
    "cordon",
    "evict",
)


def _public_callables(cls: type) -> list[str]:
    return [
        name
        for name in dir(cls)
        if not name.startswith("_") and callable(getattr(cls, name, None))
    ]


def test_fixture_client_has_no_mutating_methods():
    for name in _public_callables(FixtureKubernetesClient):
        assert not any(name.startswith(p) for p in MUTATING_PREFIXES), name


def test_real_client_has_no_mutating_methods():
    for name in _public_callables(RealKubernetesClient):
        assert not any(name.startswith(p) for p in MUTATING_PREFIXES), name


def test_protocol_is_read_only():
    methods = {m for m in dir(KubernetesReadClient) if not m.startswith("_")}
    expected_read = {
        "cluster",
        "list_namespaces",
        "list_workloads",
        "list_pods",
        "get_pod",
        "list_events",
        "get_pod_logs",
    }
    assert expected_read <= methods
    assert not any(m.startswith(p) for m in methods for p in MUTATING_PREFIXES)


def test_structural_conformance_to_protocol():
    assert isinstance(FixtureKubernetesClient, type)
    # Instance-level protocol check (runtime_checkable).
    from app.adapters.kubernetes.client import DEFAULT_FIXTURE

    client = FixtureKubernetesClient.from_file(DEFAULT_FIXTURE)
    assert isinstance(client, KubernetesReadClient)
