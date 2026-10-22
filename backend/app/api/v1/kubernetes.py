"""Read-only Kubernetes endpoints.

Every endpoint here reads from the cluster. None of them create, update, patch,
delete, restart or scale anything. If the integration is disabled the routes
return a clear ``503 not_configured``; if it is in demo mode they serve labelled
fixtures.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.adapters.kubernetes.client import build_kubernetes_client, cluster_summaries
from app.core.config import get_settings
from app.schemas.kubernetes import (
    ClustersResponse,
    NamespacesResponse,
    PodDetailResponse,
    PodDiagnosisResponse,
    PodLogsResponse,
    PodsResponse,
    WorkloadsResponse,
)
from app.services.kubernetes_diagnosis import diagnose_pod

router = APIRouter(prefix="/kubernetes", tags=["kubernetes"])


def _client(cluster: str | None = None):
    return build_kubernetes_client(get_settings(), cluster)


def _page(items: list, limit: int, offset: int) -> list:
    return items[offset : offset + limit]


@router.get("/clusters", response_model=ClustersResponse)
def list_clusters() -> ClustersResponse:
    settings = get_settings()
    clusters = cluster_summaries(settings)
    return ClustersResponse(demo=any(cluster.demo for cluster in clusters), clusters=clusters)


@router.get("/namespaces", response_model=NamespacesResponse)
def list_namespaces(
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> NamespacesResponse:
    client = _client(cluster)
    items = client.list_namespaces()
    return NamespacesResponse(
        namespaces=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get("/workloads", response_model=WorkloadsResponse)
def list_workloads(
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> WorkloadsResponse:
    client = _client(cluster)
    items = client.list_workloads(namespace)
    return WorkloadsResponse(
        workloads=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get("/pods", response_model=PodsResponse)
def list_pods(
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> PodsResponse:
    client = _client(cluster)
    items = client.list_pods(namespace)
    return PodsResponse(
        pods=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get("/pods/{namespace}/{name}", response_model=PodDetailResponse)
def get_pod(
    namespace: str,
    name: str,
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDetailResponse:
    client = _client(cluster)
    return PodDetailResponse(pod=client.get_pod(namespace, name))


@router.get("/pods/{namespace}/{name}/logs", response_model=PodLogsResponse)
def get_pod_logs(
    namespace: str,
    name: str,
    container: str | None = Query(default=None, max_length=253),
    tail_lines: int = Query(default=200, ge=1, le=1000),
    previous: bool = Query(default=False),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodLogsResponse:
    client = _client(cluster)
    logs = client.get_pod_logs(
        namespace, name, container=container, tail_lines=tail_lines, previous=previous
    )
    return PodLogsResponse(logs=logs)


@router.post("/pods/{namespace}/{name}/diagnose", response_model=PodDiagnosisResponse)
def diagnose_pod_endpoint(
    namespace: str,
    name: str,
    log_tail_lines: int = Query(default=100, ge=0, le=1000),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDiagnosisResponse:
    client = _client(cluster)
    result = diagnose_pod(client, namespace, name, log_tail_lines=log_tail_lines)
    return PodDiagnosisResponse(
        cluster=result.cluster,
        pod=result.pod,
        diagnosis=result.diagnosis,
        evidence=result.evidence,
    )
