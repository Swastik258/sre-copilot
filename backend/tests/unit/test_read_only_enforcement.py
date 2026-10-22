"""Guardrails that keep the Kubernetes surface structurally read-only."""

from __future__ import annotations

import inspect

from app.adapters.kubernetes.client import (
    FixtureKubernetesClient,
    KubernetesReadClient,
    RealKubernetesClient,
)
from app.main import app

_FORBIDDEN_PREFIXES = (
    "create",
    "patch",
    "delete",
    "replace",
    "update",
    "scale",
    "restart",
    "apply",
)


def test_kubernetes_clients_expose_no_mutating_methods() -> None:
    for cls in (KubernetesReadClient, FixtureKubernetesClient, RealKubernetesClient):
        names = [name for name in dir(cls) if not name.startswith("_")]
        assert not [name for name in names if name.lower().startswith(_FORBIDDEN_PREFIXES)]


def test_kubernetes_client_source_has_no_mutation_calls() -> None:
    source = inspect.getsource(RealKubernetesClient).lower()
    for fragment in (
        ".create_",
        ".patch_",
        ".delete_",
        ".replace_",
        ".connect_post",
        ".connect_put",
        ".connect_delete",
    ):
        assert fragment not in source


def test_kubernetes_http_surface_is_read_only() -> None:
    allowed_posts = {
        "/api/v1/kubernetes/pods/{namespace}/{name}/diagnose",
    }
    for route in app.routes:
        path = getattr(route, "path", "")
        if not path.startswith("/api/v1/kubernetes"):
            continue
        methods = set(getattr(route, "methods", set()))
        if path in allowed_posts:
            assert methods <= {"POST"}
            continue
        assert methods <= {"GET", "HEAD"}, (path, methods)
