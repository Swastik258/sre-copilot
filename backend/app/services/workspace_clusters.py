"""Per-workspace Kubernetes clusters ("bring your own cluster").

Each workspace registers its own kubeconfig(s) in the ``integrations`` table.
The kubeconfig is encrypted at rest with ``CREDENTIAL_ENCRYPTION_KEY`` and is
never returned by any API. When a workspace has registered clusters, every
scoped Kubernetes route uses them exclusively; a workspace with none falls
back to the operator-configured shared clusters (single-operator model).
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import yaml

from app.adapters.kubernetes.client import (
    RealKubernetesClient,
    build_kubernetes_client,
    cluster_summaries,
)
from app.adapters.kubernetes.models import ClusterInfo
from app.core.errors import (
    ConflictError,
    NotConfiguredError,
    NotFoundError,
    ValidationError,
)
from app.db.models import Integration
from app.repositories import integrations as integrations_repository
from app.security.encryption import secret_box

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.core.config import Settings

_KIND = "kubernetes"


def parse_kubeconfig(
    kubeconfig: str, context: str | None = None
) -> tuple[dict[str, Any], str, str | None]:
    """Validate a kubeconfig; return (parsed, resolved_context, server_url)."""
    try:
        parsed = yaml.safe_load(kubeconfig)
    except yaml.YAMLError as exc:
        raise ValidationError(
            "kubeconfig is not valid YAML.",
            details={"error": str(exc)},
        ) from exc
    if not isinstance(parsed, dict):
        raise ValidationError("kubeconfig must be a YAML mapping.")

    clusters = parsed.get("clusters")
    contexts = parsed.get("contexts")
    if not isinstance(clusters, list) or not clusters:
        raise ValidationError("kubeconfig contains no clusters.")
    if not isinstance(contexts, list) or not contexts:
        raise ValidationError("kubeconfig contains no contexts.")

    resolved = context or parsed.get("current-context")
    if not isinstance(resolved, str) or not resolved:
        raise ValidationError(
            "kubeconfig has no current-context and no context was supplied."
        )

    server: str | None = None
    for entry in clusters:
        if not isinstance(entry, dict):
            continue
        cluster = entry.get("cluster") or {}
        if not isinstance(cluster, dict):
            continue
        cluster_name = entry.get("name")
        for ctx_entry in contexts:
            if not isinstance(ctx_entry, dict):
                continue
            ctx = ctx_entry.get("context") or {}
            if (
                ctx_entry.get("name") == resolved
                and isinstance(ctx, dict)
                and ctx.get("cluster") == cluster_name
            ):
                candidate = cluster.get("server")
                server = candidate if isinstance(candidate, str) else None
                break

    return parsed, resolved, server


def _public(row: Integration) -> dict[str, Any]:
    config = row.config if isinstance(row.config, dict) else {}
    return {
        "id": row.id,
        "name": row.name,
        "context": config.get("context"),
        "server": config.get("server"),
        "enabled": row.enabled,
        "created_at": row.created_at,
    }


def register_cluster(
    db: Session,
    *,
    settings: Settings,
    workspace_id: str,
    name: str,
    kubeconfig: str,
    context: str | None = None,
) -> Integration:
    existing = integrations_repository.list_for_workspace(
        db, workspace_id=workspace_id, kind=_KIND
    )
    if any(row.name == name for row in existing):
        raise ConflictError(
            "A cluster with that name is already connected to this workspace."
        )

    parsed, resolved_context, server = parse_kubeconfig(kubeconfig, context)
    sealed = secret_box(settings).encrypt_text(kubeconfig)
    return integrations_repository.create(
        db,
        workspace_id=workspace_id,
        kind=_KIND,
        name=name,
        enabled=True,
        config={
            "kubeconfig_sealed": sealed,
            "context": resolved_context,
            "server": server,
        },
    )


def list_clusters(db: Session, *, workspace_id: str) -> list[dict[str, Any]]:
    rows = integrations_repository.list_for_workspace(
        db, workspace_id=workspace_id, kind=_KIND
    )
    return [_public(row) for row in rows]


def delete_cluster(db: Session, *, workspace_id: str, integration_id: str) -> bool:
    return integrations_repository.delete(
        db, workspace_id=workspace_id, integration_id=integration_id
    )


def _workspace_rows(db: Session, workspace_id: str) -> list[Integration]:
    return [
        row
        for row in integrations_repository.list_for_workspace(
            db, workspace_id=workspace_id, kind=_KIND
        )
        if row.enabled
    ]


def _decrypt(row: Integration, settings: Settings) -> str:
    config = row.config if isinstance(row.config, dict) else {}
    sealed = config.get("kubeconfig_sealed")
    if not isinstance(sealed, str):
        raise NotConfiguredError(
            "The stored cluster credential is missing or unreadable."
        )
    try:
        return secret_box(settings).decrypt_text(sealed)
    except ValueError as exc:
        raise NotConfiguredError(
            "The stored kubeconfig could not be decrypted; "
            "CREDENTIAL_ENCRYPTION_KEY may have been rotated."
        ) from exc


def resolve_client(
    db: Session,
    settings: Settings,
    *,
    workspace_id: str,
    cluster: str | None = None,
) -> Any:
    """Read client for the workspace's own cluster, else the shared ones.

    ``cluster`` matches a workspace cluster by id or name. When the workspace
    has no registered clusters the operator-configured (env) clusters are
    used, preserving the single-operator deployment model.
    """
    rows = _workspace_rows(db, workspace_id)
    selected: Integration | None
    if cluster is not None:
        selected = next(
            (row for row in rows if row.id == cluster or row.name == cluster), None
        )
        if selected is None:
            raise NotFoundError(
                "Cluster not found.",
                details={"cluster": cluster},
            )
    else:
        selected = rows[0] if rows else None

    if selected is None:
        return build_kubernetes_client(settings, None)

    kubeconfig_text = _decrypt(selected, settings)
    _, resolved_context, _ = parse_kubeconfig(
        kubeconfig_text,
        (selected.config or {}).get("context") if isinstance(selected.config, dict) else None,
    )
    return RealKubernetesClient(
        settings.model_copy(update={"kubernetes_context": resolved_context}),
        kubeconfig_text=kubeconfig_text,
        display_name=selected.name,
    )


def list_summaries(
    db: Session, settings: Settings, *, workspace_id: str
) -> list[ClusterInfo]:
    """Cluster listing for the scoped routes: own clusters, else shared."""
    rows = _workspace_rows(db, workspace_id)
    if rows:
        return [
            ClusterInfo(
                name=row.name,
                source="workspace",
                demo=False,
                context=(row.config or {}).get("context")
                if isinstance(row.config, dict)
                else None,
            )
            for row in rows
        ]
    return cluster_summaries(settings)


def verify_cluster(
    db: Session, settings: Settings, *, workspace_id: str, integration_id: str
) -> dict[str, Any]:
    """Attempt a live read; returns a structured result, never a 500."""
    rows = integrations_repository.list_for_workspace(
        db, workspace_id=workspace_id, kind=_KIND
    )
    row = next((candidate for candidate in rows if candidate.id == integration_id), None)
    if row is None:
        raise NotFoundError("Cluster not found.")

    try:
        client: Any = resolve_client(
            db, settings, workspace_id=workspace_id, cluster=row.id
        )
        namespaces = client.list_namespaces()
    except Exception as exc:  # noqa: BLE001 - surfaced to the workspace, not raised
        return {"ok": False, "cluster": row.name, "error": str(exc)}
    return {"ok": True, "cluster": row.name, "namespaces": len(namespaces)}
