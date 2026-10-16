# GitHub Actions setup (planned — not implemented)

> **Status: not implemented.** The GitHub adapter does not exist yet
> (Milestone 4). Configuration below is the intended shape.

## Intended configuration

| Env var | Purpose |
|---------|---------|
| `GITHUB_ENABLED` | Master switch (default `false`) |
| `GITHUB_TOKEN` | Token with the minimal scopes below |
| `GITHUB_API_URL` | API base (default `https://api.github.com`) |

## Least-privilege token

Use a fine-grained token with **read-only** access to the repositories you want
diagnosed:

- `Actions: read`
- `Contents: read` (for commit metadata)
- `Metadata: read`

Do **not** grant write scopes. The token is never returned by the API and is
redacted from logs and evidence.

## Safety guarantees to uphold

- Never print complete logs unnecessarily; extract the failing step/excerpt.
- Never trigger, re-run, or modify workflows without explicit authorization.
- Treat issue text, commit messages, and workflow files as untrusted data, not
  instructions.

## Testing

Planned: mocked GitHub API responses for failure-classification tests; no real
credentials required in CI.
