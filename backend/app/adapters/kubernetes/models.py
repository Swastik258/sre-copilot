"""Normalized, read-only Kubernetes view models.

These types are deliberately decoupled from the official client's objects. The
adapter layer converts client objects into these models so that diagnosis rules,
API schemas, and tests never depend on the client library's shape.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ContainerState(str, Enum):
    running = "running"
    waiting = "waiting"
    terminated = "terminated"
    unknown = "unknown"


class WorkloadKind(str, Enum):
    deployment = "deployment"
    statefulset = "statefulset"
    daemonset = "daemonset"
    replicaset = "replicaset"
    job = "job"
    cronjob = "cronjob"
    other = "other"


class ContainerStatus(BaseModel):
    name: str
    image: str | None = None
    ready: bool = False
    restart_count: int = 0
    state: ContainerState = ContainerState.unknown
    # Why the container is in that state (e.g. CrashLoopBackOff, OOMKilled, Completed).
    reason: str | None = None
    message: str | None = None
    exit_code: int | None = None
    # Last termination details (present after a restart).
    last_reason: str | None = None
    last_exit_code: int | None = None


class PodCondition(BaseModel):
    type: str
    status: str
    reason: str | None = None
    message: str | None = None


class PodInfo(BaseModel):
    namespace: str
    name: str
    phase: str
    node_name: str | None = None
    labels: dict[str, str] = Field(default_factory=dict)
    containers: list[ContainerStatus] = Field(default_factory=list)
    conditions: list[PodCondition] = Field(default_factory=list)
    created_at: datetime | None = None
    deletion_timestamp: datetime | None = None


class EventInfo(BaseModel):
    namespace: str
    involved_object: str
    reason: str
    message: str
    type: str = "Normal"
    count: int = 1
    last_timestamp: datetime | None = None


class WorkloadInfo(BaseModel):
    namespace: str
    name: str
    kind: WorkloadKind = WorkloadKind.other
    desired: int | None = None
    ready: int | None = None
    available: int | None = None
    images: list[str] = Field(default_factory=list)


class NamespaceInfo(BaseModel):
    name: str


class ClusterInfo(BaseModel):
    name: str
    source: str  # kubeconfig | in-cluster | fixture
    demo: bool = False
    context: str | None = None


class PodLogs(BaseModel):
    namespace: str
    pod: str
    container: str | None = None
    lines: list[str] = Field(default_factory=list)
    truncated: bool = False
    demo: bool = False
    previous: bool = False
