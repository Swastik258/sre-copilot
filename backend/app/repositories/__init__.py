"""Workspace-scoped data access.

Every function in this package takes ``workspace_id`` as a required
keyword-only argument with no default, so a forgotten argument is a
``TypeError`` at the call site instead of a cross-workspace data leak. Route
handlers and services call these functions instead of querying the ORM
directly.
"""
