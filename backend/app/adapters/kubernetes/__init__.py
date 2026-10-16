"""Read-only Kubernetes integration.

Exposes the normalized models, the read-only client interface, and the factory
used to obtain a client (live or fixture-backed).
"""

from app.adapters.kubernetes.client import (
    FixtureKubernetesClient,
    KubernetesReadClient,
    RealKubernetesClient,
    build_kubernetes_client,
)
from app.adapters.kubernetes.models import (
    ClusterInfo,
    ContainerState,
    ContainerStatus,
    EventInfo,
    NamespaceInfo,
    PodCondition,
    PodInfo,
    PodLogs,
    WorkloadInfo,
    WorkloadKind,
)

__all__ = [
    "ClusterInfo",
    "ContainerState",
    "ContainerStatus",
    "EventInfo",
    "FixtureKubernetesClient",
    "KubernetesReadClient",
    "NamespaceInfo",
    "PodCondition",
    "PodInfo",
    "PodLogs",
    "RealKubernetesClient",
    "WorkloadInfo",
    "WorkloadKind",
    "build_kubernetes_client",
]
