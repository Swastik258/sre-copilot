"""API schemas for the read-only Kubernetes integration."""

from __future__ import annotations

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


class ClustersResponse(BaseModel):
    demo: bool
    clusters: list[ClusterInfo] = Field(default_factory=list)


class NamespacesResponse(BaseModel):
    namespaces: list[NamespaceInfo] = Field(default_factory=list)


class WorkloadsResponse(BaseModel):
    workloads: list[WorkloadInfo] = Field(default_factory=list)


class PodsResponse(BaseModel):
    pods: list[PodInfo] = Field(default_factory=list)


class PodDetailResponse(BaseModel):
    pod: PodInfo


class PodLogsResponse(BaseModel):
    logs: PodLogs


class PodDiagnosisResponse(BaseModel):
    cluster: ClusterInfo
    pod: PodInfo
    diagnosis: Diagnosis
    evidence: list[Evidence] = Field(default_factory=list)
