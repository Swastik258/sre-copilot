"""Read-only Kubernetes endpoints, scoped to a workspace.

Every endpoint here reads from the cluster. None of them create, update,
patch, delete, restart or scale anything. If the integration is disabled the
routes return a clear ``503 not_configured``; if it is in demo mode they
serve labelled fixtures.

Scoped routes live under ``/workspaces/{workspace_slug}/kubernetes``. The
legacy unprefixed routes keep working only when the workspace resolves from
the ``X-Workspace-Id`` header or the user's single workspace, and log a
deprecation warning.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Response

from app.adapters.kubernetes.client import build_kubernetes_client, cluster_summaries
from app.api.deps import (
    DbSession,
    RequiredUser,
    WorkspaceFromPath,
    WorkspaceFromRequest,
    require_workspace_permission,
)
from app.core.config import get_settings
from app.core.errors import NotFoundError
from app.schemas.kubernetes import (
    ClusterRegisterRequest,
    ClustersResponse,
    NamespacesResponse,
    PodDetailResponse,
    PodDiagnosisResponse,
    PodLogsResponse,
    PodsResponse,
    WorkloadsResponse,
    WorkspaceClusterListResponse,
    WorkspaceClusterOut,
    WorkspaceClusterVerifyResponse,
)
from app.services import workspace_clusters
from app.services.audit import record_event
from app.services.kubernetes_diagnosis import diagnose_pod

log = logging.getLogger("app")

_DEPRECATION = (
    "Unprefixed /kubernetes routes are deprecated; use "
    "/api/v1/workspaces/{workspace_slug}/kubernetes."
)

router = APIRouter(prefix="/kubernetes", tags=["kubernetes"])
scoped_router = APIRouter(
    prefix="/workspaces/{workspace_slug}/kubernetes", tags=["kubernetes"]
)


def _client(cluster: str | None = None):
    return build_kubernetes_client(get_settings(), cluster)


def _workspace_client(context, db: DbSession, cluster: str | None = None):
    """Per-workspace credential when registered; shared env clusters otherwise."""
    return workspace_clusters.resolve_client(
        db, get_settings(), workspace_id=context.workspace_id, cluster=cluster
    )


def _page(items: list, limit: int, offset: int) -> list:
    return items[offset : offset + limit]


@scoped_router.get(
    "/clusters",
    response_model=ClustersResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_clusters_scoped(context: WorkspaceFromPath, db: DbSession) -> ClustersResponse:
    clusters = workspace_clusters.list_summaries(
        db, get_settings(), workspace_id=context.workspace_id
    )
    return ClustersResponse(demo=any(cluster.demo for cluster in clusters), clusters=clusters)


# ---- Workspace-owned cluster credentials ("bring your own cluster") ----


@scoped_router.post(
    "/integrations",
    response_model=WorkspaceClusterOut,
    status_code=201,
    dependencies=[Depends(require_workspace_permission("integration.connect"))],
)
def register_cluster(
    payload: ClusterRegisterRequest,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
) -> WorkspaceClusterOut:
    row = workspace_clusters.register_cluster(
        db,
        settings=get_settings(),
        workspace_id=context.workspace_id,
        name=payload.name,
        kubeconfig=payload.kubeconfig,
        context=payload.context,
    )
    record_event(
        db,
        action="workspace.cluster.register",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"integration_id": row.id, "cluster": row.name},
    )
    config = row.config if isinstance(row.config, dict) else {}
    return WorkspaceClusterOut(
        id=row.id,
        name=row.name,
        context=config.get("context"),
        server=config.get("server"),
        enabled=row.enabled,
        created_at=row.created_at,
    )


@scoped_router.get(
    "/integrations",
    response_model=WorkspaceClusterListResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_registered_clusters(
    context: WorkspaceFromPath, db: DbSession
) -> WorkspaceClusterListResponse:
    rows = workspace_clusters.list_clusters(db, workspace_id=context.workspace_id)
    return WorkspaceClusterListResponse(
        clusters=[WorkspaceClusterOut(**row) for row in rows], total=len(rows)
    )


@scoped_router.delete(
    "/integrations/{integration_id}",
    status_code=204,
    dependencies=[Depends(require_workspace_permission("integration.disconnect"))],
)
def delete_registered_cluster(
    integration_id: str,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
) -> Response:
    removed = workspace_clusters.delete_cluster(
        db, workspace_id=context.workspace_id, integration_id=integration_id
    )
    if not removed:
        raise NotFoundError("Cluster not found.")
    record_event(
        db,
        action="workspace.cluster.delete",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"integration_id": integration_id},
    )
    return Response(status_code=204)


@scoped_router.post(
    "/integrations/{integration_id}/verify",
    response_model=WorkspaceClusterVerifyResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def verify_registered_cluster(
    integration_id: str,
    context: WorkspaceFromPath,
    db: DbSession,
) -> WorkspaceClusterVerifyResponse:
    return WorkspaceClusterVerifyResponse(
        **workspace_clusters.verify_cluster(
            db, get_settings(), workspace_id=context.workspace_id, integration_id=integration_id
        )
    )


@scoped_router.get(
    "/namespaces",
    response_model=NamespacesResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_namespaces_scoped(
    context: WorkspaceFromPath,
    db: DbSession,
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> NamespacesResponse:
    client = _workspace_client(context, db, cluster)
    items = client.list_namespaces()
    return NamespacesResponse(
        namespaces=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@scoped_router.get(
    "/workloads",
    response_model=WorkloadsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_workloads_scoped(
    context: WorkspaceFromPath,
    db: DbSession,
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> WorkloadsResponse:
    client = _workspace_client(context, db, cluster)
    items = client.list_workloads(namespace)
    return WorkloadsResponse(
        workloads=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@scoped_router.get(
    "/pods",
    response_model=PodsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_pods_scoped(
    context: WorkspaceFromPath,
    db: DbSession,
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> PodsResponse:
    client = _workspace_client(context, db, cluster)
    items = client.list_pods(namespace)
    return PodsResponse(
        pods=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@scoped_router.get(
    "/pods/{namespace}/{name}",
    response_model=PodDetailResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def get_pod_scoped(
    namespace: str,
    name: str,
    context: WorkspaceFromPath,
    db: DbSession,
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDetailResponse:
    client = _workspace_client(context, db, cluster)
    return PodDetailResponse(pod=client.get_pod(namespace, name))


@scoped_router.get(
    "/pods/{namespace}/{name}/logs",
    response_model=PodLogsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def get_pod_logs_scoped(
    namespace: str,
    name: str,
    context: WorkspaceFromPath,
    db: DbSession,
    container: str | None = Query(default=None, max_length=253),
    tail_lines: int = Query(default=200, ge=1, le=1000),
    previous: bool = Query(default=False),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodLogsResponse:
    client = _workspace_client(context, db, cluster)
    logs = client.get_pod_logs(
        namespace, name, container=container, tail_lines=tail_lines, previous=previous
    )
    return PodLogsResponse(logs=logs)


@scoped_router.post(
    "/pods/{namespace}/{name}/diagnose",
    response_model=PodDiagnosisResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.diagnose"))],
)
def diagnose_pod_scoped(
    namespace: str,
    name: str,
    context: WorkspaceFromPath,
    db: DbSession,
    log_tail_lines: int = Query(default=100, ge=0, le=1000),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDiagnosisResponse:
    client = _workspace_client(context, db, cluster)
    result = diagnose_pod(client, namespace, name, log_tail_lines=log_tail_lines)
    return PodDiagnosisResponse(
        cluster=result.cluster,
        pod=result.pod,
        diagnosis=result.diagnosis,
        evidence=result.evidence,
    )


# ---- Legacy unprefixed routes (deprecated) ----


@router.get(
    "/clusters",
    response_model=ClustersResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_clusters(context: WorkspaceFromRequest) -> ClustersResponse:
    log.warning(_DEPRECATION)
    settings = get_settings()
    clusters = cluster_summaries(settings)
    return ClustersResponse(demo=any(cluster.demo for cluster in clusters), clusters=clusters)


@router.get(
    "/namespaces",
    response_model=NamespacesResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_namespaces(
    context: WorkspaceFromRequest,
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> NamespacesResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    items = client.list_namespaces()
    return NamespacesResponse(
        namespaces=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get(
    "/workloads",
    response_model=WorkloadsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_workloads(
    context: WorkspaceFromRequest,
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> WorkloadsResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    items = client.list_workloads(namespace)
    return WorkloadsResponse(
        workloads=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get(
    "/pods",
    response_model=PodsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def list_pods(
    context: WorkspaceFromRequest,
    namespace: str | None = Query(default=None, max_length=253),
    cluster: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0, le=1_000_000),
) -> PodsResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    items = client.list_pods(namespace)
    return PodsResponse(
        pods=_page(items, limit, offset),
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get(
    "/pods/{namespace}/{name}",
    response_model=PodDetailResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def get_pod(
    namespace: str,
    name: str,
    context: WorkspaceFromRequest,
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDetailResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    return PodDetailResponse(pod=client.get_pod(namespace, name))


@router.get(
    "/pods/{namespace}/{name}/logs",
    response_model=PodLogsResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.read"))],
)
def get_pod_logs(
    namespace: str,
    name: str,
    context: WorkspaceFromRequest,
    container: str | None = Query(default=None, max_length=253),
    tail_lines: int = Query(default=200, ge=1, le=1000),
    previous: bool = Query(default=False),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodLogsResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    logs = client.get_pod_logs(
        namespace, name, container=container, tail_lines=tail_lines, previous=previous
    )
    return PodLogsResponse(logs=logs)


@router.post(
    "/pods/{namespace}/{name}/diagnose",
    response_model=PodDiagnosisResponse,
    dependencies=[Depends(require_workspace_permission("kubernetes.diagnose"))],
)
def diagnose_pod_endpoint(
    namespace: str,
    name: str,
    context: WorkspaceFromRequest,
    log_tail_lines: int = Query(default=100, ge=0, le=1000),
    cluster: str | None = Query(default=None, max_length=120),
) -> PodDiagnosisResponse:
    log.warning(_DEPRECATION)
    client = _client(cluster)
    result = diagnose_pod(client, namespace, name, log_tail_lines=log_tail_lines)
    return PodDiagnosisResponse(
        cluster=result.cluster,
        pod=result.pod,
        diagnosis=result.diagnosis,
        evidence=result.evidence,
    )
