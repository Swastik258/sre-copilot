# Release checklist

This is the gate for a local or shared deployment. Do not publish or push without
explicit authorization from the repository owner.

## 1. Credential hygiene

- [ ] Revoke the previously exposed GitHub token and OpenRouter key.
- [ ] Create a fresh GitHub fine-grained token with **Actions: read**,
      **Contents: read**, and **Metadata: read** only. No write scopes.
- [ ] Create a fresh Groq, OpenRouter, or Anthropic key for live AI checks.
- [ ] Put keys only in the backend environment or `.env`; never in
      `NEXT_PUBLIC_*`, logs, screenshots, issues, or commits.
- [ ] Confirm `.env` and local database files are untracked.
- [ ] Do **not** commit `frontend/public/SRE_Copilot_Build_Report.pdf`.

## 2. Automated gates

```bash
# Backend
cd backend
.venv/bin/ruff check app tests
.venv/bin/pytest -q

# Frontend
cd frontend
npm run lint
npm run build
npm run start &
RELEASE_BASE_URL=http://localhost:3000 npm run smoke
```

Expected: ruff clean, **184 backend tests** passing, lint clean, production build
with **37 routes**, and **16/16** route smoke checks. CI runs the same backend and
frontend gates.

## 3. Security configuration

- [ ] `ENVIRONMENT=production` for shared deployments.
- [ ] `AUTH_REQUIRED=true` (production enforces it anyway, but set it explicitly).
- [ ] `CORS_ORIGINS` is the exact frontend origin, never `*`.
- [ ] `RATE_LIMIT_PER_MINUTE` is set appropriately (production defaults to 120).
- [ ] `AI_PRIVACY_MODE` matches the data policy; per-tenant overrides reviewed.
- [ ] TLS terminates in front of both services.
- [ ] Postgres + Alembic migrations are used; `AUTO_CREATE_SCHEMA` is not used for
      production.
- [ ] At least two active admins exist; the last-admin guard is verified.
- [ ] Administrators are provisioned from a trusted backend shell; public
      signup never assigns admin privileges.
- [ ] Audit retention policy is set and tested.

## 4. Demo-mode verification (no credentials)

- [ ] Start backend and frontend locally.
- [ ] `/dashboard` loads and shows integration status.
- [ ] `/kubernetes` loads labelled fixtures and a diagnosis.
- [ ] `/logs` analyzes pasted logs and shows signatures/evidence.
- [ ] `/assistant` creates an investigation, sends a message (mock provider), and
      reloads the persisted history.
- [ ] `/metrics` returns labelled fixture series and correlation.
- [ ] `/runbooks` searches and opens a runbook.
- [ ] `/infra-code` generates a Deployment/Service/Terraform proposal.
- [ ] `/terraform` reviews the sample plan and shows the AI explanation path
      (mock provider).
- [ ] `/audit` lists events and exports CSV; retention is disabled for a member.
- [ ] `/settings` saves customer profile/preferences; `/admin/settings` is
      restricted to administrators.

## 5. Live integration verification

Use only fresh, least-privilege credentials.

### Kubernetes

- [ ] `KUBERNETES_ENABLED=true`, `KUBERNETES_DEMO_MODE=false`.
- [ ] Windows: `KUBERNETES_KUBECONFIG=C:/Users/<you>/.kube/kind-config` — **not**
      a WSL `/home/...` path.
- [ ] `KUBERNETES_CONTEXT=kind-tws-cluster` (or the intended context).
- [ ] For multiple clusters, set `KUBERNETES_CLUSTERS` JSON and verify the
      selector on `/kubernetes`.
- [ ] Verify namespaces, pods, bounded logs, and a real diagnosis.
- [ ] Confirm the identity has only read verbs (no create/update/patch/delete).

### GitHub

- [ ] `GITHUB_ENABLED=true`, fresh read-only `GITHUB_TOKEN`.
- [ ] `/cicd` lists runs, opens jobs/steps, and diagnoses a failed run.
- [ ] Confirm the token scopes are exactly `Actions: read`, `Contents: read`, and
      `Metadata: read`.
- [ ] Confirm the backend never returns the token.

### Prometheus

- [ ] `PROMETHEUS_ENABLED=true`, `PROMETHEUS_DEMO_MODE=false`,
      `PROMETHEUS_URL=<url>`.
- [ ] Run a query with a real metric; verify the returned series and exact query.
- [ ] Submit a timestamped event to `/metrics/correlate` and confirm matches are
      labelled as hypotheses.

### AI

- [ ] Rotate and set the provider key.
- [ ] Verify `/terraform` explain, `/kubernetes` explain, and `/assistant`.
- [ ] Confirm evidence sent is redacted and no key appears in browser responses.
- [ ] Toggle privacy mode and verify external providers return `503`.

### Terraform

- [ ] Review a real `terraform show -json` plan.
- [ ] Confirm values are omitted and blast radius/findings are sensible.
- [ ] Confirm no Terraform process is launched and nothing is applied.

## 6. Windows checkout sync and restart

The Windows checkout is expected at `D:\sre-copilot\openai-agent`. Sync the working
tree from this environment (or the chosen source of truth), then:

```powershell
cd D:\sre-copilot\openai-agent\backend
.venv\Scripts\activate
alembic upgrade head
uvicorn app.main:app --port 8000
```

```powershell
cd D:\sre-copilot\openai-agent\frontend
npm install
npm run build
npm run start
```

Checklist:

- [ ] Backend and frontend restarted after sync.
- [ ] `alembic upgrade head` applied (including `0005_roles_tenants`).
- [ ] Windows env uses `C:/Users/...` kubeconfig paths.
- [ ] `/dashboard`, `/kubernetes`, `/logs`, `/assistant`, `/metrics`, `/runbooks`,
      `/audit`, `/settings`, `/terraform`, `/infra-code`, and `/cicd` load.
- [ ] Existing local SQLite data survived the additive upgrade.
- [ ] Logs show no credential values or stack traces.

## 7. Rollback

- [ ] Keep the previous deployed image/build available.
- [ ] Back up the database before migrations.
- [ ] `alembic downgrade -1` only after verifying the previous application version
      is compatible.
- [ ] Revoke any credential that may have leaked during verification.
- [ ] Restore the last known-good environment file from a secure store.

## 8. Known release limitations

- Full browser E2E is not automated; run the manual browser pass above.
- Rate limiting is per-process until a shared limiter is deployed.
- Dependency/image scanning and prompt-injection regression tests are not yet in
  CI.
- Encryption at rest is delegated to the database/platform.
- No apply path exists for generated infrastructure code or remediation.
