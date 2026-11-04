"""Guard: scoped models are only queried through a workspace filter.

Parses ``app/api/v1/`` and ``app/services/`` with :mod:`ast` and fails when a
``select(...)`` or ``db.query(...)`` touches a scoped model without a
``workspace_id`` filter in the same statement. ``app/repositories`` is the
scoped data-access layer and is deliberately not scanned: every one of its
methods requires ``workspace_id`` as a keyword-only argument with no default,
so a forgotten argument is a ``TypeError``, not a leak.

The check is statement-scoped: a chained ``.where(AuditEvent.workspace_id ==
workspace_id)`` satisfies it; a bare ``select(Investigation)`` does not.
"""

from __future__ import annotations

import ast
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]

# Models that carry a workspace_id tenant column.
SCOPED_MODELS = {
    "Conversation",
    "Message",
    "Integration",
    "Investigation",
    "Evidence",
    "AuditEvent",
}

# Explicit allowlist: unscoped models have no workspace boundary.
UNSCOPED_MODELS = {
    "User",
    "AuthSession",
    "AccountSetting",
    "UserApiKey",
    "EmailToken",
    "Subscription",
    "UsageEvent",
    "BillingWebhookEvent",
    "BackgroundJob",
    "IdempotencyRecord",
    "AppSetting",
    "Organization",
    "OrganizationMembership",
    "Workspace",
    "WorkspaceMembership",
    "WorkspaceInvite",
}

SCAN_DIRS = ("app/api/v1", "app/services")

# Files exempt from the scan; extend deliberately, never by convenience.
FILE_ALLOWLIST: set[str] = set()

_STATEMENT_NODES = (ast.Expr, ast.Assign, ast.AnnAssign, ast.AugAssign, ast.Return)


def _model_aliases(tree: ast.AST) -> dict[str, str]:
    """Map ``from app.db.models import X as Y`` aliases to real model names."""
    aliases: dict[str, str] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module == "app.db.models":
            for name in node.names:
                if name.asname:
                    aliases[name.asname] = name.name
    return aliases


def _references_scoped_model(node: ast.AST, aliases: dict[str, str]) -> bool:
    for sub in ast.walk(node):
        if isinstance(sub, ast.Name):
            if aliases.get(sub.id, sub.id) in SCOPED_MODELS:
                return True
        elif isinstance(sub, ast.Attribute) and sub.attr in SCOPED_MODELS:
            return True
    return False


def _mentions_workspace_filter(node: ast.AST) -> bool:
    for sub in ast.walk(node):
        if isinstance(sub, ast.Attribute) and sub.attr == "workspace_id":
            return True
        if isinstance(sub, ast.Name) and sub.id == "workspace_id":
            return True
        if (
            isinstance(sub, ast.Constant)
            and isinstance(sub.value, str)
            and sub.value == "workspace_id"
        ):
            return True
    return False


def test_scoped_models_are_queried_through_a_workspace_filter():
    violations: list[str] = []
    for directory in SCAN_DIRS:
        for path in sorted((BACKEND_DIR / directory).rglob("*.py")):
            rel = path.relative_to(BACKEND_DIR).as_posix()
            if rel in FILE_ALLOWLIST:
                continue
            tree = ast.parse(path.read_text(encoding="utf-8"))
            aliases = _model_aliases(tree)
            seen: set[int] = set()
            for node in ast.walk(tree):
                if not isinstance(node, _STATEMENT_NODES):
                    continue
                if id(node) in seen:
                    continue
                seen.add(id(node))
                for call in ast.walk(node):
                    if not isinstance(call, ast.Call):
                        continue
                    func = call.func
                    is_select = isinstance(func, ast.Name) and func.id == "select"
                    is_query = isinstance(func, ast.Attribute) and func.attr == "query"
                    if not (is_select or is_query):
                        continue
                    args = list(call.args) + [kw.value for kw in call.keywords]
                    if not any(_references_scoped_model(arg, aliases) for arg in args):
                        continue
                    if _mentions_workspace_filter(node):
                        continue
                    violations.append(f"{rel}:{call.lineno}")
    assert not violations, (
        "select()/db.query() on a scoped model without a workspace_id filter:\n"
        + "\n".join(violations)
    )


def test_scoped_and_unscoped_lists_do_not_overlap():
    assert SCOPED_MODELS.isdisjoint(UNSCOPED_MODELS)
