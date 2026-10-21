"""Configured Kubernetes cluster selection.

The default deployment has one cluster (the legacy kubeconfig/context settings).
Set ``KUBERNETES_CLUSTERS`` to a JSON array to expose a named selector:

    [{"name":"prod","kubeconfig":"C:/Users/me/.kube/config","context":"prod"},
     {"name":"kind","kubeconfig":"C:/Users/me/.kube/kind-config","context":"kind-tws"}]

The configuration only describes targets. It never proves reachability.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from app.core.config import Settings
from app.core.errors import ValidationError


class KubernetesCluster(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kubeconfig: str | None = Field(default=None, max_length=1000)
    context: str | None = Field(default=None, max_length=253)
    in_cluster: bool = False
    demo: bool = False


def _legacy_cluster(settings: Settings) -> KubernetesCluster:
    name = (
        settings.kubernetes_context
        or (Path(settings.kubernetes_kubeconfig).name if settings.kubernetes_kubeconfig else None)
        or ("in-cluster" if settings.kubernetes_in_cluster else "demo")
    )
    return KubernetesCluster(
        name=str(name),
        kubeconfig=settings.kubernetes_kubeconfig,
        context=settings.kubernetes_context,
        in_cluster=settings.kubernetes_in_cluster,
    )


def cluster_configs(settings: Settings) -> list[KubernetesCluster]:
    """Return configured clusters, falling back to the legacy single target."""

    raw = (settings.kubernetes_clusters or "").strip()
    if not raw:
        return [_legacy_cluster(settings)]

    try:
        parsed: Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValidationError(
            "KUBERNETES_CLUSTERS must be valid JSON.",
            details={"hint": "Use a JSON array of {name, kubeconfig, context, in_cluster}."},
        ) from exc

    if isinstance(parsed, dict):
        parsed = parsed.get("clusters")
    if not isinstance(parsed, list) or not parsed:
        raise ValidationError("KUBERNETES_CLUSTERS must be a non-empty JSON array.")

    clusters: list[KubernetesCluster] = []
    seen: set[str] = set()
    for index, item in enumerate(parsed):
        if not isinstance(item, dict):
            raise ValidationError(
                "Each KUBERNETES_CLUSTERS entry must be an object.",
                details={"index": index},
            )
        name = str(item.get("name") or item.get("context") or f"cluster-{index + 1}").strip()
        if not name or name in seen:
            raise ValidationError(
                "Kubernetes cluster names must be non-empty and unique.",
                details={"index": index, "name": name},
            )
        seen.add(name)
        try:
            clusters.append(
                KubernetesCluster(
                    name=name,
                    kubeconfig=item.get("kubeconfig"),
                    context=item.get("context"),
                    in_cluster=bool(item.get("in_cluster", False)),
                )
            )
        except ValueError as exc:
            raise ValidationError(
                "Invalid Kubernetes cluster configuration.",
                details={"index": index, "message": str(exc)},
            ) from exc
    return clusters


def select_cluster(settings: Settings, name: str | None) -> KubernetesCluster:
    clusters = cluster_configs(settings)
    if name is None:
        return clusters[0]
    for cluster in clusters:
        if cluster.name == name:
            return cluster
    raise ValidationError(
        "Unknown Kubernetes cluster.",
        details={"cluster": name, "configured": [cluster.name for cluster in clusters]},
    )
