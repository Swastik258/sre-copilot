# Review Guide — Milestones 1 & 2

> **Status:** uncommitted work, committed locally on branch `milestones-1-2-foundation`.
> **Baseline:** original commit `68d4c44 initial`.
> **Diff size:** 84 files changed, +5,600 / −244.
> This document is a map of *everything that changed and why*. It contains no secrets.

---

## 1. How to see the code right now

All of it lives on disk at `/tmp/opencode/sre-copilot` (branch `milestones-1-2-foundation`).
Nothing is pushed to GitHub yet.

**Browse the change set:**

```bash
cd /tmp/opencode/sre-copilot

# One-line summary of every changed file
git diff --stat 68d4c44 HEAD

# Which files were added / modified / deleted
git diff --name-status 68d4c44 HEAD

# The full commit with message
git show --stat HEAD

# Read any single file's full contents
git show HEAD:backend/app/services/kubernetes_diagnosis.py

# Read the complete diff for one area only (e.g. the K8s adapter)
git diff 68d4c44 HEAD -- backend/app/adapters/kubernetes
git diff 68d4c44 HEAD -- frontend/app/kubernetes/page.tsx
```

**Portable copy (no credentials needed):** `/tmp/opencode/sre-copilot-m1-m2.bundle`
(a complete git bundle; `git clone` it anywhere).

If you want, I can print any specific file in full in this chat, or produce a single
self-contained HTML/markdown review of the whole diff.

---

## 2. What the repo was before

The original repo was a **marketing-style scaffold**, not a working SRE product:

- A FastAPI app with only a `/health` shell.
- A Next.js marketing site with a pricing page and placeholder status numbers.
- **No** investigation engine, Kubernetes/GitHub/Prometheus adapters, evidence model,
  AI provider layer, persistence, or tests of substance.
- Two latent bugs meant **nothing ever touched the database**:
  1. `backend/alembic/versions/0001_initial.py` was empty — no tables were ever created.
  2. SQLAlchemy mapper error: `User.audit_events` declared `back_populates="user"`, but
     `AuditEvent` had no `user` relationship.

Milestones 1 and 2 fixed the foundation and added the first real capability:
**read-only, evidence-backed Kubernetes diagnosis**.

---

## 3. Milestone 1 — foundation & stabilization

Goal: make the app honest, bootable without any third-party credentials, and safe by default.

### Bugs fixed
| File | Change |
|---|---|
| `backend/alembic/versions/0001_initial.py` | Replaced empty migration with a correct (no-op baseline) revision. |
| `backend/alembic/versions/0002_core_tables.py` | **New** — real migration that creates the core tables. |
| `backend/app/db/models.py` | Added missing `AuditEvent.user` relationship to fix the mapper failure. |
| `backend/app/main.py` | Terraform-safe Clerk-optional boot; local SQLite schema auto-create; middleware order. |
| `backend/app/core/config.py` | Single validated `Settings` source of truth; fixed env-var mismatch. |
| `frontend/lib/api.ts`, `frontend/proxy.ts` | Fixed `NEXT_PUBLIC_API_BASE` vs `NEXT_PUBLIC_API_URL` mismatch. |
| `frontend/Dockerfile` | Correct build-time `NEXT_PUBLIC_*` args for Next.js. |

### New backend building blocks
| File | Purpose |
|---|---|
| `backend/app/core/errors.py` | Uniform JSON error envelope + exception handlers. |
| `backend/app/core/logging.py` | Structured logging with request IDs. |
| `backend/app/core/request_context.py` | Per-request correlation IDs. |
| `backend/app/core/redaction.py` | Redacts obvious secrets before persistence/model calls. |
| `backend/app/core/ratelimit.py` | Request-size cap + optional rate-limit middleware. |
| `backend/app/schemas/common.py` | Shared response/envelope schemas. |
| `backend/app/schemas/evidence.py` | Evidence contract (the product's core building block). |
| `backend/app/schemas/investigation.py` | Investigation/diagnosis/hypothesis contracts. |
| `backend/app/schemas/integrations.py` | Integration-status contracts. |
| `backend/app/services/audit.py` | Audit-event service (human-action trail). |
| `backend/app/services/integrations.py` | Honest integration-status aggregation. |
| `backend/app/services/evidence.py` | `build_evidence`, redaction, sha256 `fingerprint`. |
| `backend/app/api/v1/integrations.py` | `/api/v1/integrations` status endpoint. |
| `backend/app/api/deps.py` | Shared API dependencies. |

### Behavior changes
- App **boots with zero credentials** (demo mode is a *label*, not a silent fallback).
- Fabricated status numbers replaced with **live** integration status.
- Every response carries request IDs; errors are machine-readable.
- Request bodies are capped (`MAX_REQUEST_BYTES`, default 2 MB); optional rate limiting
  (`RATE_LIMIT_PER_MINUTE`, default off).
- Secrets are redacted (config flag `REDACTION_ENABLED`, default on).

### Infra & docs
- `.github/workflows/ci.yml` — CI (ruff + pytest + frontend lint/build).
- Hardened `backend/Dockerfile`, `frontend/Dockerfile`, `deploy/docker-compose.yml`.
- Removed committed build artifacts (`*.egg-info`, `tsconfig.tsbuildinfo`) from tracking.
- New docs: `docs/{ARCHITECTURE,SECURITY,LOCAL_DEVELOPMENT,TESTING,API,ROADMAP,...}.md`
  and updated `README.md`, `BUILD_STATUS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `.env.example`.

---

## 4. Milestone 2 — read-only Kubernetes diagnosis

Goal: *"Diagnose infrastructure failures with evidence, not guesses"* — proof of concept
on Kubernetes, read-only.

### Read-only adapter
| File | Purpose |
|---|---|
| `backend/app/adapters/kubernetes/models.py` | Normalized models: `ClusterInfo`, `NamespaceInfo`, `WorkloadInfo`, `PodInfo`, `ContainerStatus/State`, `PodCondition`, `EventInfo`, `PodLogs`. |
| `backend/app/adapters/kubernetes/client.py` | `KubernetesReadClient` interface (**no mutating methods**), `RealKubernetesClient` (lazy `kubernetes` import), `FixtureKubernetesClient`, and `build_kubernetes_client`. |
| `backend/app/adapters/kubernetes/__init__.py` | Public exports. |

The interface is **structurally read-only** and a test (`test_kubernetes_readonly.py`)
asserts no create/update/patch/delete/restart/scale methods exist.

### Deterministic diagnosis engine
| File | Purpose |
|---|---|
| `backend/app/services/kubernetes_diagnosis.py` | Deterministic rules → evidence-backed `Diagnosis`. |
| `backend/app/fixtures/kubernetes/demo_cluster.json` | Labelled demo snapshot (crashloop / OOM / imagepull / pending / healthy). |

**Rules implemented:** `CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`/`ErrImagePull`,
`Pending`/`Unschedulable`, probe failures, non-zero container exits, and log-derived leads.

Each diagnosis separates:
- **Confirmed observations** (facts from the cluster, each with an evidence id), from
- **Hypotheses** (ranked, with confidence), plus read-only **next steps** and
  **human-approval-gated** remediation suggestions.

### API (all under `/api/v1/kubernetes`, `tags=["kubernetes"]`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/kubernetes/clusters` | Cluster + `demo` flag. |
| GET | `/kubernetes/namespaces` | Namespaces. |
| GET | `/kubernetes/workloads?namespace=` | Workloads (optional namespace filter). |
| GET | `/kubernetes/pods?namespace=` | Pods (optional namespace filter). |
| GET | `/kubernetes/pods/{namespace}/{name}` | Pod detail. |
| GET | `/kubernetes/pods/{namespace}/{name}/logs?container=&tail_lines=&previous=` | Pod logs (`tail_lines` 1–1000). |
| POST | `/kubernetes/pods/{namespace}/{name}/diagnose?log_tail_lines=` | Evidence-backed diagnosis (`log_tail_lines` 0–1000). |

Behavior:
- Integration **disabled** → clean `503 not_configured`.
- Integration **demo mode** → serves labelled fixtures (all evidence `demo: true`).

### Frontend
- `frontend/app/kubernetes/page.tsx` — functional diagnosis console (cluster/pod pickers,
  diagnosis, evidence list, hypotheses, demo labelling).
- `frontend/lib/api.ts` — typed client for all K8s endpoints.
- `frontend/components/StatusStrip.tsx` — live integration status (replaced fabricated data).
- `frontend/components/{TopNav,HealthPill}.tsx`, `app/layout.tsx` — navigation/status updates.

---

## 5. Data flow (Milestone 2)

```
UI (/kubernetes)
   │  POST /api/v1/kubernetes/pods/{ns}/{name}/diagnose
   ▼
api/v1/kubernetes.py  ──build_kubernetes_client(settings)──┐
   │                                                        │
   │                                    ┌───────────────────┴───────────────────┐
   │                                    │ RealKubernetesClient  (live cluster)   │
   │                                    │ FixtureKubernetesClient (demo mode)    │
   │                                    └───────────────────┬───────────────────┘
   ▼                                                        ▼
services/kubernetes_diagnosis.diagnose_pod()  ──reads──► normalized models
   │  deterministic rules
   ▼
Diagnosis (confirmed observations vs hypotheses, confidence, next steps)
   │  services/evidence.build_evidence()  → redaction + sha256 fingerprint
   ▼
PodDiagnosisResponse { cluster, pod, diagnosis, evidence }
```

---

## 6. Tests & verification actually executed

| Command | Result |
|---|---|
| `cd backend && . .venv/bin/activate && ruff check .` | all checks passed |
| `cd backend && . .venv/bin/activate && pytest` | **67 passed** |
| `cd frontend && npm run lint` | clean |
| `cd frontend && npm run build` | success (25 routes) |

End-to-end demo check (`KUBERNETES_ENABLED=true KUBERNETES_DEMO_MODE=true`), calling
`POST /api/v1/kubernetes/pods/prod/api-7d9f8b6c4-x2k9p/diagnose` returned:
`model_generated=false`, confidence `0.9`, risk `high`, 3 hypotheses, 5 evidence items
(all `demo:true`), redacted, with a sha256 integrity fingerprint.

Test coverage added:
- unit: config, errors, evidence, redaction, ratelimit, health, kubernetes diagnosis,
  kubernetes fixture client, **kubernetes read-only enforcement**.
- integration: integrations API, audit, DB persistence, migrations, kubernetes API.

---

## 7. Security posture

**Implemented:** read-only-by-construction K8s adapter (test-enforced), demo data clearly
labelled (`demo: true`), secret redaction, request-size cap, optional rate limiting,
structured logs with request IDs, uniform error envelope, no fabricated status.

**Not yet implemented (explicitly tracked in `docs/SECURITY.md`):** backend
authentication/authorization, per-user scoping, and secret storage/rotation. These are
scheduled before any mutating/approval workflows in later milestones.

---

## 8. Known limitations

- **Live cluster not verified here** — this environment has **no Docker daemon**
  (no kind/minikube). The live path is code-complete but only fixture/mock-verified;
  live verification needs a Docker-enabled host. See `docs/KUBERNETES_SETUP.md`.
- GitHub and Prometheus integrations are **config + status only** in M1/M2 (no data adapters yet).
- AI provider layer (`mock`/`openai`/`anthropic`) is configured but investigated content
  send/receive arrives in Milestone 3.
- Backend has no authN/authZ yet (documented; demo/local only).

---

## 9. File manifest (all 84 changes)

### Root
`M .env.example`, `M .gitignore`, `M BUILD_STATUS.md`, `M CONTRIBUTING.md`, `M README.md`, `M SECURITY.md`, `A .github/workflows/ci.yml`, `M deploy/docker-compose.yml`

### Backend — new
`A backend/alembic/versions/0002_core_tables.py`,
`A backend/app/adapters/kubernetes/{__init__,client,models}.py`,
`A backend/app/api/deps.py`, `A backend/app/api/v1/{integrations,kubernetes}.py`,
`A backend/app/core/{errors,ratelimit,redaction,request_context}.py`,
`A backend/app/fixtures/kubernetes/demo_cluster.json`,
`A backend/app/schemas/{common,evidence,integrations,investigation,kubernetes}.py`,
`A backend/app/services/{audit,evidence,integrations,kubernetes_diagnosis}.py`,
tests: `A backend/tests/integration/test_{api_integrations,audit,db_persistence,kubernetes_api,migrations}.py`,
`A backend/tests/unit/test_{config,errors,evidence,kubernetes_diagnosis,kubernetes_fixture_client,kubernetes_readonly,ratelimit,redaction}.py`

### Backend — modified
`M backend/Dockerfile`, `M backend/alembic/env.py`, `M backend/alembic/versions/0001_initial.py`,
`M backend/app/api/v1/{health,router}.py`, `M backend/app/core/{config,logging}.py`,
`M backend/app/db/{__init__,models}.py`, `M backend/app/main.py`,
`M backend/app/schemas/health.py`, `M backend/pyproject.toml`, `M backend/requirement.txt`,
`M backend/tests/conftest.py`, `M backend/tests/unit/test_health.py`

### Backend — removed from tracking
`D backend/sre_copilot_backend.egg-info/*` (build artifact)

### Frontend
`A frontend/lib/{api,auth}.ts`, `A frontend/Dockerfile`, `M frontend/app/kubernetes/page.tsx`,
`M frontend/app/{layout,page}.tsx`, `M frontend/components/{HealthPill,StatusStrip,TopNav}.tsx`,
`M frontend/proxy.ts`, `M frontend/next-env.d.ts`, `D frontend/tsconfig.tsbuildinfo`

### Docs
`A docs/{AI_PROVIDERS,API,ARCHITECTURE,GITHUB_SETUP,KUBERNETES_SETUP,LOCAL_DEVELOPMENT,PROMETHEUS_SETUP,ROADMAP,SECURITY,TESTING}.md`

---

## 10. Suggested next step (Milestone 3 — not started)

Core investigation engine: investigation persistence + messages API; a mock AI provider
plus OpenAI/Anthropic behind one interface (schema-validated, timeouts, privacy mode);
and a demo vertical slice tying Kubernetes + log evidence into a saved, citable investigation.
