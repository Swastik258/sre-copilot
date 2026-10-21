"""Named Kubernetes cluster configuration tests."""

from __future__ import annotations

import pytest

from app.adapters.kubernetes.client import build_kubernetes_client, cluster_summaries
from app.adapters.kubernetes.clusters import cluster_configs, select_cluster
from app.core.config import Settings
from app.core.errors import ValidationError


def _settings() -> Settings:
    return Settings(
        kubernetes_enabled=True,
        kubernetes_demo_mode=True,
        kubernetes_clusters=(
            '[{"name":"kind","kubeconfig":"C:/Users/me/.kube/kind-config",'
            '"context":"kind-tws"},'
            '{"name":"prod","kubeconfig":"C:/Users/me/.kube/config",'
            '"context":"prod"}]'
        ),
    )


def test_parses_named_clusters_and_preserves_windows_paths() -> None:
    clusters = cluster_configs(_settings())

    assert [cluster.name for cluster in clusters] == ["kind", "prod"]
    assert clusters[0].kubeconfig == "C:/Users/me/.kube/kind-config"
    assert clusters[1].context == "prod"


def test_selects_cluster_by_name_and_rejects_unknown() -> None:
    settings = _settings()
    assert select_cluster(settings, "prod").name == "prod"
    assert select_cluster(settings, None).name == "kind"
    with pytest.raises(ValidationError):
        select_cluster(settings, "missing")


def test_demo_client_uses_selected_cluster_name() -> None:
    client = build_kubernetes_client(_settings(), "prod")

    assert client.demo is True
    assert client.cluster().name == "prod"


def test_cluster_summaries_do_not_claim_live_reachability() -> None:
    summaries = cluster_summaries(_settings())

    assert [item.name for item in summaries] == ["kind", "prod"]
    assert all(item.demo for item in summaries)
    assert all(not item.source == "connected" for item in summaries)


def test_invalid_cluster_json_is_a_validation_error() -> None:
    settings = Settings(kubernetes_enabled=True, kubernetes_clusters="not-json")

    with pytest.raises(ValidationError):
        cluster_configs(settings)
