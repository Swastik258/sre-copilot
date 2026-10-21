"""Kubernetes client adapters.

The :class:`KubernetesReadClient` interface exposes **only read operations**:
describe cluster, list namespaces/workloads/pods, get a pod, list events, read
bounded pod logs. There is deliberately no create/update/patch/delete method, so
diagnosis code is structurally incapable of mutating a cluster.

Two implementations:

* :class:`RealKubernetesClient` — wraps the official ``kubernetes`` client. The
  library is imported lazily so it is only required when a live cluster is used.
* :class:`FixtureKubernetesClient` — serves a labelled JSON snapshot for demo
  mode. Every record it produces is marked ``demo``.

Select between them with :func:`build_kubernetes_client`.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

from app.adapters.kubernetes.clusters import cluster_configs, select_cluster
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
from app.core.config import Settings
from app.core.errors import NotConfiguredError

FIXTURE_DIR = Path(__file__).resolve().parent.parent.parent / "fixtures" / "kubernetes"
DEFAULT_FIXTURE = FIXTURE_DIR / "demo_cluster.json"


@runtime_checkable
class KubernetesReadClient(Protocol):
    demo: bool

    def cluster(self) -> ClusterInfo: ...
    def list_namespaces(self) -> list[NamespaceInfo]: ...
    def list_workloads(self, namespace: str | None = None) -> list[WorkloadInfo]: ...
    def list_pods(self, namespace: str | None = None) -> list[PodInfo]: ...
    def get_pod(self, namespace: str, name: str) -> PodInfo: ...
    def list_events(self, namespace: str, involved_object: str | None = None) -> list[EventInfo]: ...
    def get_pod_logs(
        self,
        namespace: str,
        name: str,
        *,
        container: str | None = None,
        tail_lines: int = 200,
        previous: bool = False,
    ) -> PodLogs: ...


# ---------------------------------------------------------------------------
# Fixture client (demo mode)
# ---------------------------------------------------------------------------


class FixtureKubernetesClient:
    """Serve a labelled, read-only snapshot. No network access."""

    demo = True

    def __init__(self, snapshot: dict[str, Any], *, name: str | None = None) -> None:
        self._snapshot = snapshot
        cluster_payload = dict(
            snapshot.get("cluster") or {"name": name or "demo", "source": "fixture"}
        )
        if name:
            cluster_payload["name"] = name
        self._cluster = ClusterInfo(**cluster_payload)
        self._cluster = self._cluster.model_copy(update={"demo": True})

    @classmethod
    def from_file(cls, path: Path, *, name: str | None = None) -> FixtureKubernetesClient:
        return cls(json.loads(path.read_text(encoding="utf-8")), name=name)

    def cluster(self) -> ClusterInfo:
        return self._cluster

    def list_namespaces(self) -> list[NamespaceInfo]:
        return [NamespaceInfo(**n) for n in self._snapshot.get("namespaces", [])]

    def list_workloads(self, namespace: str | None = None) -> list[WorkloadInfo]:
        items = [WorkloadInfo(**w) for w in self._snapshot.get("workloads", [])]
        if namespace:
            items = [w for w in items if w.namespace == namespace]
        return items

    def list_pods(self, namespace: str | None = None) -> list[PodInfo]:
        items = [PodInfo(**p) for p in self._snapshot.get("pods", [])]
        if namespace:
            items = [p for p in items if p.namespace == namespace]
        return items

    def get_pod(self, namespace: str, name: str) -> PodInfo:
        for pod in self.list_pods(namespace):
            if pod.name == name:
                return pod
        from app.core.errors import NotFoundError

        raise NotFoundError(f"Pod {namespace}/{name} not found", details={"namespace": namespace, "name": name})

    def list_events(self, namespace: str, involved_object: str | None = None) -> list[EventInfo]:
        events = [EventInfo(**e) for e in self._snapshot.get("events", [])]
        events = [e for e in events if e.namespace == namespace]
        if involved_object:
            events = [e for e in events if e.involved_object == involved_object]
        return events

    def get_pod_logs(
        self,
        namespace: str,
        name: str,
        *,
        container: str | None = None,
        tail_lines: int = 200,
        previous: bool = False,
    ) -> PodLogs:
        key = f"{namespace}/{name}"
        logs = self._snapshot.get("logs", {}).get(key, {})
        lines: list[str] = []
        if container and container in logs:
            lines = list(logs[container])
        else:
            for value in logs.values():
                lines.extend(value)
        truncated = len(lines) > tail_lines
        return PodLogs(
            namespace=namespace,
            pod=name,
            container=container,
            lines=lines[-tail_lines:],
            truncated=truncated,
            demo=True,
            previous=previous,
        )


# ---------------------------------------------------------------------------
# Real client
# ---------------------------------------------------------------------------


class RealKubernetesClient:
    """Read-only wrapper around the official Kubernetes client."""

    demo = False

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._core: Any = None
        self._apps: Any = None
        self._context = settings.kubernetes_context
        self._timeout = settings.kubernetes_request_timeout_seconds

    # -- connection -------------------------------------------------------
    def _ensure_clients(self) -> None:
        if self._core is not None:
            return
        try:
            from kubernetes import client
            from kubernetes import config as kube_config
        except ImportError as exc:  # pragma: no cover - depends on optional dep
            raise NotConfiguredError(
                "The 'kubernetes' package is not installed; install it to use a live cluster."
            ) from exc

        try:
            if self._settings.kubernetes_in_cluster:
                kube_config.load_incluster_config()
            else:
                kube_config.load_kube_config(
                    config_file=self._settings.kubernetes_kubeconfig,
                    context=self._settings.kubernetes_context,
                )
        except Exception as exc:  # pragma: no cover - environment dependent
            raise NotConfiguredError(
                f"Unable to load Kubernetes configuration: {exc}"
            ) from exc

        self._core = client.CoreV1Api()
        self._apps = client.AppsV1Api()

    # -- conversions ------------------------------------------------------
    @staticmethod
    def _container_status(cs: Any) -> ContainerStatus:
        state_enum = ContainerState.unknown
        reason = None
        message = None
        exit_code = None
        if getattr(cs, "state", None):
            st = cs.state
            if getattr(st, "running", None):
                state_enum = ContainerState.running
            elif getattr(st, "waiting", None):
                state_enum = ContainerState.waiting
                reason = st.waiting.reason
                message = st.waiting.message
            elif getattr(st, "terminated", None):
                state_enum = ContainerState.terminated
                reason = st.terminated.reason
                message = st.terminated.message
                exit_code = st.terminated.exit_code
        last_reason = None
        last_exit = None
        if getattr(cs, "last_state", None) and getattr(cs.last_state, "terminated", None):
            last_reason = cs.last_state.terminated.reason
            last_exit = cs.last_state.terminated.exit_code
        return ContainerStatus(
            name=cs.name,
            image=cs.image,
            ready=bool(cs.ready),
            restart_count=cs.restart_count or 0,
            state=state_enum,
            reason=reason,
            message=message,
            exit_code=exit_code,
            last_reason=last_reason,
            last_exit_code=last_exit,
        )

    @classmethod
    def _pod_info(cls, pod: Any) -> PodInfo:
        meta = pod.metadata
        status = pod.status
        containers = [cls._container_status(cs) for cs in (status.container_statuses or [])]
        conditions = [
            PodCondition(
                type=c.type,
                status=c.status,
                reason=getattr(c, "reason", None),
                message=getattr(c, "message", None),
            )
            for c in (status.conditions or [])
        ]
        return PodInfo(
            namespace=meta.namespace,
            name=meta.name,
            phase=status.phase or "Unknown",
            node_name=getattr(pod.spec, "node_name", None),
            labels=dict(meta.labels or {}),
            containers=containers,
            conditions=conditions,
            created_at=meta.creation_timestamp,
            deletion_timestamp=getattr(meta, "deletion_timestamp", None),
        )

    # -- read operations --------------------------------------------------
    def cluster(self) -> ClusterInfo:
        self._ensure_clients()
        name = self._context or self._settings.kubernetes_kubeconfig or "in-cluster"
        return ClusterInfo(
            name=str(name),
            source="in-cluster" if self._settings.kubernetes_in_cluster else "kubeconfig",
            demo=False,
            context=self._context,
        )

    def list_namespaces(self) -> list[NamespaceInfo]:
        self._ensure_clients()
        result = self._core.list_namespace(_request_timeout=self._timeout)
        return [NamespaceInfo(name=ns.metadata.name) for ns in result.items]

    def list_pods(self, namespace: str | None = None) -> list[PodInfo]:
        self._ensure_clients()
        if namespace:
            result = self._core.list_namespaced_pod(namespace, _request_timeout=self._timeout)
        else:
            result = self._core.list_pod_for_all_namespaces(_request_timeout=self._timeout)
        return [self._pod_info(p) for p in result.items]

    def get_pod(self, namespace: str, name: str) -> PodInfo:
        self._ensure_clients()
        pod = self._core.read_namespaced_pod(name, namespace, _request_timeout=self._timeout)
        return self._pod_info(pod)

    def list_workloads(self, namespace: str | None = None) -> list[WorkloadInfo]:
        self._ensure_clients()
        target = namespace
        if target:
            deployments = self._apps.list_namespaced_deployment(target, _request_timeout=self._timeout)
            statefulsets = self._apps.list_namespaced_stateful_set(target, _request_timeout=self._timeout)
            daemonsets = self._apps.list_namespaced_daemon_set(target, _request_timeout=self._timeout)
        else:
            deployments = self._apps.list_deployment_for_all_namespaces(_request_timeout=self._timeout)
            statefulsets = self._apps.list_stateful_set_for_all_namespaces(_request_timeout=self._timeout)
            daemonsets = self._apps.list_daemon_set_for_all_namespaces(_request_timeout=self._timeout)

        workloads: list[WorkloadInfo] = []
        for d in deployments.items:
            images = [c.image for c in d.spec.template.spec.containers]
            workloads.append(
                WorkloadInfo(
                    namespace=d.metadata.namespace,
                    name=d.metadata.name,
                    kind=WorkloadKind.deployment,
                    desired=d.spec.replicas,
                    ready=getattr(d.status, "ready_replicas", None),
                    available=getattr(d.status, "available_replicas", None),
                    images=images,
                )
            )
        for s in statefulsets.items:
            images = [c.image for c in s.spec.template.spec.containers]
            workloads.append(
                WorkloadInfo(
                    namespace=s.metadata.namespace,
                    name=s.metadata.name,
                    kind=WorkloadKind.statefulset,
                    desired=s.spec.replicas,
                    ready=getattr(s.status, "ready_replicas", None),
                    images=images,
                )
            )
        for ds in daemonsets.items:
            images = [c.image for c in ds.spec.template.spec.containers]
            workloads.append(
                WorkloadInfo(
                    namespace=ds.metadata.namespace,
                    name=ds.metadata.name,
                    kind=WorkloadKind.daemonset,
                    desired=getattr(ds.status, "desired_number_scheduled", None),
                    ready=getattr(ds.status, "number_ready", None),
                    images=images,
                )
            )
        return workloads

    def list_events(self, namespace: str, involved_object: str | None = None) -> list[EventInfo]:
        self._ensure_clients()
        result = self._core.list_namespaced_event(namespace, _request_timeout=self._timeout)
        events: list[EventInfo] = []
        for e in result.items:
            obj_name = getattr(e.involved_object, "name", "") if e.involved_object else ""
            if involved_object and obj_name != involved_object:
                continue
            events.append(
                EventInfo(
                    namespace=e.metadata.namespace,
                    involved_object=obj_name,
                    reason=e.reason or "Unknown",
                    message=e.message or "",
                    type=e.type or "Normal",
                    count=e.count or 1,
                    last_timestamp=getattr(e, "last_timestamp", None),
                )
            )
        return events

    def get_pod_logs(
        self,
        namespace: str,
        name: str,
        *,
        container: str | None = None,
        tail_lines: int = 200,
        previous: bool = False,
    ) -> PodLogs:
        self._ensure_clients()
        raw = self._core.read_namespaced_pod_log(
            name=name,
            namespace=namespace,
            container=container,
            tail_lines=tail_lines,
            previous=previous,
            _request_timeout=self._timeout,
        )
        lines = [line for line in (raw or "").splitlines() if line]
        return PodLogs(
            namespace=namespace,
            pod=name,
            container=container,
            lines=lines,
            truncated=len(lines) >= tail_lines,
            demo=False,
            previous=previous,
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


def cluster_summaries(settings: Settings) -> list[ClusterInfo]:
    """Describe configured targets without opening a connection."""

    if not settings.kubernetes_enabled:
        raise NotConfiguredError(
            "Kubernetes integration is disabled.",
            details={"hint": "Set KUBERNETES_ENABLED=true to enable read-only diagnosis."},
        )
    clusters = cluster_configs(settings)
    fixture = settings.kubernetes_demo_mode or not any(
        cluster.kubeconfig or cluster.in_cluster for cluster in clusters
    )
    return [
        ClusterInfo(
            name=cluster.name,
            source="fixture" if fixture else ("in-cluster" if cluster.in_cluster else "kubeconfig"),
            demo=fixture,
            context=cluster.context,
        )
        for cluster in clusters
    ]


def build_kubernetes_client(
    settings: Settings, cluster_name: str | None = None
) -> KubernetesReadClient:
    """Return a read client for the selected cluster, or raise a clear error."""

    if not settings.kubernetes_enabled:
        raise NotConfiguredError(
            "Kubernetes integration is disabled.",
            details={"hint": "Set KUBERNETES_ENABLED=true to enable read-only diagnosis."},
        )

    selected = select_cluster(settings, cluster_name)
    live_target = bool(selected.kubeconfig or selected.in_cluster)
    if settings.kubernetes_demo_mode or not live_target:
        if not DEFAULT_FIXTURE.exists():
            raise NotConfiguredError("Demo fixture is missing and no live cluster is configured.")
        return FixtureKubernetesClient.from_file(DEFAULT_FIXTURE, name=selected.name)

    return RealKubernetesClient(
        settings.model_copy(
            update={
                "kubernetes_kubeconfig": selected.kubeconfig,
                "kubernetes_context": selected.context,
                "kubernetes_in_cluster": selected.in_cluster,
            }
        )
    )
