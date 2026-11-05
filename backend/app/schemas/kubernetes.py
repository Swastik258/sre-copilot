"""API schemas for the read-only Kubernetes integration."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.adapters.kubernetes.models import (
    ClusterInfo,
    NamespaceInfo,
    PodInfo,
    PodLogs,
    WorkloadInfo,
)
from app.schemas.evidence import Evidence
from app.schemas.investigation import Diagnosis


class ClusterRegisterRequest(BaseModel):
    """Register a workspace-owned cluster ("bring your own cluster")."""

    name: str = Field(min_length=1, max_length=120)
    kubeconfig: str = Field(min_length=20, max_length=200_000)
    context: str | None = Field(default=None, max_length=253)


class WorkspaceClusterOut(BaseModel):
    id: str
    name: str
    context: str | None = None
    server: str | None = None
    enabled: bool = True
    created_at: datetime


class WorkspaceClusterListResponse(BaseModel):
    clusters: list[WorkspaceClusterOut] = Field(default_factory=list)
    total: int = 0


class WorkspaceClusterVerifyResponse(BaseModel):
    ok: bool
    cluster: str
    namespaces: int | None = None
    error: str | None = None


class ClustersResponse(BaseModel):
    demo: bool
    clusters: list[ClusterInfo] = Field(default_factory=list)


class NamespacesResponse(BaseModel):
    namespaces: list[NamespaceInfo] = Field(default_factory=list)
    total: int = 0
    limit: int = 500
    offset: int = 0


class WorkloadsResponse(BaseModel):
    workloads: list[WorkloadInfo] = Field(default_factory=list)
    total: int = 0
    limit: int = 500
    offset: int = 0


class PodsResponse(BaseModel):
    pods: list[PodInfo] = Field(default_factory=list)
    total: int = 0
    limit: int = 500
    offset: int = 0


class PodDetailResponse(BaseModel):
    pod: PodInfo


class PodLogsResponse(BaseModel):
    logs: PodLogs


class PodDiagnosisResponse(BaseModel):
    cluster: ClusterInfo
    pod: PodInfo
    diagnosis: Diagnosis
    evidence: list[Evidence] = Field(default_factory=list)
