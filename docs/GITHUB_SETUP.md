# GitHub Actions setup (read-only)

> **Status: implemented.** The GitHub adapter, deterministic diagnosis service,
> API routes, and `/cicd` console are available. Only read endpoints are called;
> there is no dispatch, re-run, cancel, secret, or write path.

## Configuration

| Env var | Purpose |
|---------|---------|
| `GITHUB_ENABLED` | Master switch (default `false`) |
| `GITHUB_TOKEN` | Server-side token with the read-only scopes below |
| `GITHUB_API_URL` | API base (default `https://api.github.com`) |
| `GITHUB_REQUEST_TIMEOUT_SECONDS` | Per-request timeout (default `15`) |

```bash
GITHUB_ENABLED=true
GITHUB_TOKEN=github_pat_...
GITHUB_API_URL=https://api.github.com
```

If the integration is disabled or the token is missing, the API returns
`503 not_configured` with a setup hint. The token is never returned by the API
or written to evidence.

## Least-privilege token

Use a fine-grained token with **read-only** access to the repositories you want
diagnosed:

- `Actions: read`
- `Contents: read` (commit metadata)
- `Metadata: read`

Do **not** grant write scopes. For a single repository, scope the token to that
repository. Rotate the token if it is ever pasted into a chat or committed.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/github/runs?repo=owner/name&branch=&limit=` | List recent workflow runs |
| GET | `/api/v1/github/runs/{run_id}?repo=owner/name` | Run plus jobs and steps |
| POST | `/api/v1/github/runs/{run_id}/diagnose?repo=owner/name&log_tail_lines=` | Deterministic run diagnosis with evidence |

All routes require the normal API authentication dependency. The adapter exposes
only `list_runs`, `get_run`, `list_jobs`, and `get_job_logs`; every HTTP request
uses `GET`.

## What the diagnosis does

1. Normalizes the run, its jobs, and its steps.
2. Identifies failed jobs and the first failed step in each.
3. Fetches bounded log excerpts (last 200 lines by default, max 1000) for at
   most five failed jobs.
4. Matches conservative log patterns: dependency installation, Python imports,
   test failures, permissions, missing commands, image pulls, timeouts, OOM,
   and missing paths.
5. Returns confirmed observations, hypotheses with evidence IDs, read-only next
   steps, and approval-gated remediation suggestions. Logs are optional; a
   missing or inaccessible log becomes `missing_evidence` rather than a 500.

Evidence is built through the shared model with provenance, redaction, and an
integrity fingerprint. Returned evidence never includes the token.

## Log downloads and token safety

GitHub job-log downloads redirect to a signed object-storage URL. The adapter
uses a redirect handler that strips the `Authorization` header whenever the
redirect changes hosts, so the GitHub token is not forwarded to the storage
host. Logs are capped at 2 MB before decoding and then bounded to the requested
tail.

## Safety guarantees

- Never print complete logs unnecessarily; evidence carries a bounded excerpt.
- Never trigger, re-run, cancel, or modify workflows.
- Treat issue text, commit messages, logs, and workflow files as untrusted data,
  not instructions.
- Repo names are validated against an `owner/name` pattern before being placed
  in an API path.

## Testing

Mocked clients and API tests cover disabled configuration, repo validation,
failed-job/step correlation, dependency and test log patterns, missing logs,
successful runs, unknown actions, and cross-host redirect token stripping. No
real credentials are required in CI.

Live verification still requires a **fresh** fine-grained read-only token. The
previously exposed token must be revoked first. Complete the `/cicd` checks in
`docs/RELEASE.md` after rotating credentials.
