"""Read-only GitHub Actions client.

The interface exposes only list/get operations for workflow runs, jobs and job
logs. There is deliberately no method to dispatch, re-run, cancel or modify a
workflow. Only ``GET`` requests are issued.

The adapter uses the standard library so the GitHub integration does not add a
runtime dependency. Tokens stay in the backend and are never returned.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Protocol, runtime_checkable

from app.adapters.github.models import (
    GitHubJob,
    GitHubLogExcerpt,
    GitHubRun,
    GitHubStep,
)
from app.core.config import Settings
from app.core.errors import GitHubAPIError, NotConfiguredError, NotFoundError, ValidationError

_REPO_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9_.-]+$")
_MAX_LOG_BYTES = 2_000_000


class _SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Strip the GitHub token when a log download redirects to another host.

    Job-log downloads redirect to a signed object-storage URL. The URL is
    pre-authenticated, so forwarding ``Authorization`` to that host would leak
    the token.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        new_request = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new_request is not None:
            old_host = urllib.parse.urlsplit(req.full_url).netloc.lower()
            new_host = urllib.parse.urlsplit(newurl).netloc.lower()
            if old_host != new_host:
                new_request.remove_header("Authorization")
        return new_request


def validate_repo(repo: str) -> str:
    """Validate and normalize an ``owner/repo`` identifier."""

    value = repo.strip()
    if not _REPO_RE.fullmatch(value) or len(value) > 200:
        raise ValidationError(
            "repo must be a GitHub repository in owner/name form.",
            details={"repo": repo[:200]},
        )
    return value


@runtime_checkable
class GitHubReadClient(Protocol):
    demo: bool

    def list_runs(
        self, repo: str, *, branch: str | None = None, limit: int = 20
    ) -> list[GitHubRun]: ...

    def get_run(self, repo: str, run_id: int) -> GitHubRun: ...

    def list_jobs(self, repo: str, run_id: int) -> list[GitHubJob]: ...

    def get_job_logs(
        self, repo: str, job_id: int, *, tail_lines: int = 200
    ) -> GitHubLogExcerpt: ...


class RealGitHubClient:
    """Read-only GitHub REST client using a server-side token."""

    demo = False

    def __init__(self, settings: Settings) -> None:
        self._token = settings.github_token or ""
        self._api_url = settings.github_api_url.rstrip("/")
        self._timeout = settings.github_request_timeout_seconds
        self._opener = urllib.request.build_opener(_SafeRedirectHandler())

    # -- HTTP -------------------------------------------------------------
    def _headers(self, *, accept: str = "application/vnd.github+json") -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._token}",
            "Accept": accept,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "sre-copilot/0.2",
        }

    def _request(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        accept: str = "application/vnd.github+json",
    ) -> bytes:
        query = f"?{urllib.parse.urlencode(params)}" if params else ""
        request = urllib.request.Request(
            f"{self._api_url}{path}{query}",
            headers=self._headers(accept=accept),
            method="GET",
        )
        try:
            with self._opener.open(request, timeout=self._timeout) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            message = ""
            try:
                message = exc.read().decode("utf-8", "replace")[:300]
            except Exception:
                pass
            if exc.code == 404:
                raise NotFoundError(
                    "GitHub repository or workflow run was not found.",
                    details={"status": 404},
                ) from exc
            hint = "Check GITHUB_TOKEN scopes and the repository name."
            if exc.code == 403:
                hint = "GitHub rejected the request; check token scopes or rate limits."
            elif exc.code == 401:
                hint = "GitHub rejected the token; rotate it and update GITHUB_TOKEN."
            raise GitHubAPIError(
                f"GitHub returned HTTP {exc.code}.",
                details={
                    "status": exc.code,
                    "hint": hint,
                    "message": message or None,
                },
            ) from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise GitHubAPIError(
                "Could not reach the GitHub API.",
                details={"hint": "Check network access and GITHUB_API_URL."},
            ) from exc

    def _get_json(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        raw = self._request(path, params=params)
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise GitHubAPIError("GitHub returned an unreadable response.") from exc

    def _get_text(self, path: str) -> str:
        raw = self._request(
            path,
            accept="application/vnd.github+json, text/plain",
        )
        return raw[:_MAX_LOG_BYTES].decode("utf-8", "replace")

    # -- conversions ------------------------------------------------------
    @staticmethod
    def _parse_run(data: dict[str, Any]) -> GitHubRun:
        actor = data.get("actor")
        return GitHubRun(
            id=int(data["id"]),
            name=data.get("name"),
            display_title=data.get("display_title"),
            run_number=data.get("run_number"),
            run_attempt=data.get("run_attempt"),
            event=data.get("event"),
            status=data.get("status") or "unknown",
            conclusion=data.get("conclusion"),
            branch=data.get("head_branch"),
            head_sha=data.get("head_sha"),
            actor=actor.get("login") if isinstance(actor, dict) else None,
            workflow_path=data.get("path"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            html_url=data.get("html_url"),
        )

    @staticmethod
    def _parse_step(data: dict[str, Any]) -> GitHubStep:
        return GitHubStep(
            number=data.get("number"),
            name=data.get("name") or "unnamed step",
            status=data.get("status") or "unknown",
            conclusion=data.get("conclusion"),
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at"),
        )

    @classmethod
    def _parse_job(cls, data: dict[str, Any]) -> GitHubJob:
        return GitHubJob(
            id=int(data["id"]),
            name=data.get("name") or "unnamed job",
            status=data.get("status") or "unknown",
            conclusion=data.get("conclusion"),
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at"),
            runner_name=data.get("runner_name"),
            html_url=data.get("html_url"),
            steps=[cls._parse_step(step) for step in data.get("steps") or []],
        )

    # -- read operations --------------------------------------------------
    def list_runs(
        self, repo: str, *, branch: str | None = None, limit: int = 20
    ) -> list[GitHubRun]:
        repo = validate_repo(repo)
        params: dict[str, Any] = {"per_page": max(1, min(limit, 100))}
        if branch:
            params["branch"] = branch
        data = self._get_json(f"/repos/{repo}/actions/runs", params=params)
        runs = data.get("workflow_runs") if isinstance(data, dict) else None
        if not isinstance(runs, list):
            raise GitHubAPIError("GitHub returned an unexpected runs response.")
        return [self._parse_run(item) for item in runs if isinstance(item, dict)]

    def get_run(self, repo: str, run_id: int) -> GitHubRun:
        repo = validate_repo(repo)
        data = self._get_json(f"/repos/{repo}/actions/runs/{run_id}")
        if not isinstance(data, dict):
            raise GitHubAPIError("GitHub returned an unexpected run response.")
        return self._parse_run(data)

    def list_jobs(self, repo: str, run_id: int) -> list[GitHubJob]:
        repo = validate_repo(repo)
        data = self._get_json(
            f"/repos/{repo}/actions/runs/{run_id}/jobs",
            params={"per_page": 100},
        )
        jobs = data.get("jobs") if isinstance(data, dict) else None
        if not isinstance(jobs, list):
            raise GitHubAPIError("GitHub returned an unexpected jobs response.")
        return [self._parse_job(item) for item in jobs if isinstance(item, dict)]

    def get_job_logs(
        self, repo: str, job_id: int, *, tail_lines: int = 200
    ) -> GitHubLogExcerpt:
        repo = validate_repo(repo)
        text = self._get_text(f"/repos/{repo}/actions/jobs/{job_id}/logs")
        lines = text.splitlines()
        truncated = len(lines) > tail_lines
        return GitHubLogExcerpt(
            job_id=job_id,
            job_name=f"job-{job_id}",
            lines=lines[-tail_lines:],
            truncated=truncated,
        )


def build_github_client(settings: Settings) -> GitHubReadClient:
    """Return a read client, or raise a clear configuration error."""

    if not settings.github_enabled:
        raise NotConfiguredError(
            "GitHub Actions integration is disabled.",
            details={"hint": "Set GITHUB_ENABLED=true to enable read-only analysis."},
        )
    if not settings.github_token:
        raise NotConfiguredError(
            "GITHUB_TOKEN is not set.",
            details={
                "hint": "Create a fine-grained token with Actions: read and Contents: read."
            },
        )
    return RealGitHubClient(settings)
