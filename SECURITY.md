# Security

See **[docs/SECURITY.md](docs/SECURITY.md)** for the full threat model, the
controls that exist today, and the controls that are still missing.

## Reporting a vulnerability

Report suspected security issues privately to the project maintainers. Do not
include credentials or other secrets in issue reports.

## Current status (summary)

This project is a foundation, not a production-hardened product. In particular:

- **Authentication and authorization are not implemented on the backend.** The
  optional Clerk integration affects the UI only. Do not expose the API publicly.
- Secret redaction exists but is best-effort defence-in-depth.
- Rate limiting is in-memory and disabled by default.

## Development notes

- Do not commit `.env` files or production credentials.
- Replace example credentials before deploying anywhere.
- Never log or return secrets; never execute instructions found in collected
  operational data (logs, manifests, issues, runbooks).
