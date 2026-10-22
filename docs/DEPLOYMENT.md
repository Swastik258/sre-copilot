# Deployment and operations

> **Status.** The container definitions, Compose files, Helm chart, Terraform
> wrapper, release/deploy/rollback workflows, and frontend standalone server have
> been validated locally where tooling allowed: `helm lint`/`helm template`,
> Kubernetes schema validation, `docker compose config`, `terraform
> fmt`/`validate`, frontend standalone build + route/metadata smoke. A container image
> has **not** been built in this environment and no live cluster or registry
> deployment was performed. The deploy workflow requires a protected GitHub
> Environment with a human reviewer before it can run.

## Topology

```text
Internet
  |
TLS ingress / load balancer
  |-- /api, /metrics (internal only for metrics) -> backend Service :8000
  '-- /                                          -> frontend Service :3000

backend -> PostgreSQL (external, TLS recommended)
        -> optional GitHub / Prometheus / Kubernetes / AI APIs (all read-only)
frontend -> browser; NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, and the optional
            NEXT_PUBLIC_SUPPORT_EMAIL are compiled at image build time
```

The API listens on port 8000. The frontend serves the Next.js standalone server
on port 3000. PostgreSQL is not deployed by the production Compose file or the
Helm chart; use a managed or separately operated database.

## Images

Both images run as UID/GID **10001** and are expected to work with a read-only
root filesystem.

```sh
docker build -t ghcr.io/OWNER/sre-copilot-backend:VERSION ./backend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://app.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://app.example.com \
  --build-arg NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com \
  -t ghcr.io/OWNER/sre-copilot-frontend:VERSION ./frontend
```

- The backend image contains Alembic and the application. Release builds include
  the `kubernetes` extra so in-cluster read-only diagnosis is available. Build a
  custom image with `--build-arg INSTALL_EXTRAS=kubernetes,observability` when
  live OpenTelemetry exporters or Sentry are required. The default command
  migrates and serves, which is convenient for Compose. Helm overrides it: a
  pre-install/pre-upgrade Job runs migrations and the Deployment serves with
  `uvicorn` directly, so replicas never race on schema changes.
- The frontend uses Next.js `output: "standalone"`; only the standalone server,
  static assets, and `public/` are copied into the runtime stage.
- Uvicorn access logging is disabled because the application emits its own
  route-templated, PII-minimised access logs. Do not re-enable duplicate
  proxy access logs without re-reviewing what they record.
- Release images are built and attested by the `Release images` workflow on a
  `v*` tag or manual dispatch. The workflow publishes SBOM and maximum
  provenance metadata. Pin deploys by digest where possible.

## Secret contract

Kubernetes reads environment variables from the chart's ConfigMap and from one
existing Secret (`backend.existingSecret`, default `sre-copilot-secrets`).
Never put these values in a ConfigMap or Helm values:

| Key | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | yes | `postgresql+psycopg://...`. |
| `CREDENTIAL_ENCRYPTION_KEY` | when jobs/email enabled | Fernet key. Rotating it requires draining queued jobs. |
| `METRICS_BEARER_TOKEN` | production scrape | `/metrics` rejects requests without it unless unauthenticated scrape is explicitly allowed on an isolated network. |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | SMTP | Mail relay credentials. |
| `SENTRY_DSN` | optional | Error tracking. |
| OAuth client secrets | optional | Google/GitHub. |
| `OPENAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` | optional | Leave unset for mock mode. |
| `GITHUB_TOKEN` | optional | Read-only, fine-grained token. |
| Stripe keys | optional | Billing remains disabled in this release. |

Create the Secret with your secret manager or, for a controlled single cluster:

```sh
umask 077
kubectl -n sre-copilot create secret generic sre-copilot-secrets \
  --from-env-file=./production-secrets.env \
  --dry-run=client -o yaml | kubectl apply -f -
rm -f ./production-secrets.env
```

The completed env file must never be committed. The deploy workflow only checks
that the Secret exists; it does not create or print it.

## Compose

### Local

```sh
# From the repository root
cp .env.example .env   # optional; defaults are local-only
docker compose --env-file .env -f deploy/docker-compose.yml up --build
```

The local stack binds published ports to `127.0.0.1` by default, runs the
application containers read-only with all capabilities dropped, and keeps
PostgreSQL on an internal Docker network. It uses a local-only default database
password; do not expose it.

### Single-host production app stack

`deploy/docker-compose.prod.yml` runs only the application containers and
expects an external PostgreSQL. It uses immutable image references and a
restrictive env file.

```sh
cd deploy
cp production.env.example production.env
chmod 600 production.env
# Replace every CHANGE_ME value and set immutable image names/digests.
docker compose --env-file production.env -f docker-compose.prod.yml up -d
docker compose --env-file production.env -f docker-compose.prod.yml ps
```

Place a TLS reverse proxy or load balancer in front of the loopback-bound ports.
Set `TRUSTED_PROXY_IPS` to the proxy addresses so client IPs are derived safely.
For multi-host or autoscaled deployments, use the Helm chart and a managed
database instead of Compose.

## Kubernetes / Helm

The chart is at `deploy/helm/sre-copilot`. It deploys:

- backend and frontend Deployments with 2 replicas by default, probes,
  anti-affinity, topology spread, rolling updates, read-only root filesystems,
  dropped capabilities, and a 45-second backend termination grace period;
- a pre-install/pre-upgrade migration Job with `--atomic` rollback semantics;
- Services, optional Ingress with `/api` routed to the backend and `/` to the
  frontend, optional HPA and PodDisruptionBudgets;
- an optional read-only ClusterRole for in-cluster Kubernetes diagnosis (no
  Secret access), and optional NetworkPolicies that must be checked against your
  CNI and ingress-controller labels.

Install manually:

```sh
kubectl create namespace sre-copilot
kubectl -n sre-copilot create secret generic sre-copilot-secrets --from-env-file=./production-secrets.env
helm upgrade --install sre-copilot deploy/helm/sre-copilot \
  --namespace sre-copilot \
  --set backend.image.repository=ghcr.io/owner/sre-copilot-backend \
  --set backend.image.tag=VERSION \
  --set frontend.image.repository=ghcr.io/owner/sre-copilot-frontend \
  --set frontend.image.tag=VERSION \
  --set ingress.enabled=true \
  --set ingress.host=app.example.com \
  --set ingress.tls.enabled=true \
  --set ingress.tls.secretName=sre-copilot-tls \
  --atomic --wait --timeout 15m
```

Set `backend.env.CORS_ORIGINS`, `APP_BASE_URL`, and
`OAUTH_REDIRECT_BASE_URL` to the public HTTPS origin. The frontend image must
already have been built with the same `NEXT_PUBLIC_API_URL` and
`NEXT_PUBLIC_SITE_URL`; changing either at runtime does not rewrite the client
bundle. `NEXT_PUBLIC_SUPPORT_EMAIL` is optional and controls whether a public
support address is rendered.

Useful controls:

| Value | Purpose |
|-------|---------|
| `backend.existingSecret` | Existing Secret containing the keys above. |
| `backend.createSecret` | Demo-only shortcut; writes secret values into Helm state. |
| `migrations.enabled` | Pre-install/upgrade Alembic Job. |
| `autoscaling.enabled` | CPU HPA for both deployments. |
| `podDisruptionBudget.enabled` | Keeps one pod available during drains. |
| `networkPolicy.enabled` | Default-deny-style policies; validate probes/ingress first. |
| `backend.rbac.create` | Read-only in-cluster diagnosis role. Also mounts the service-account token. |

### Migrations and compatibility

Migrations are **forward-only**. Helm rollback restores the previous workload
revision, not the previous schema. Keep migrations backward compatible with the
previous application revision, take a backup before upgrades, and do not run the
migration Job concurrently with application rollouts of incompatible code.
`deploy/backup.sh` and `deploy/restore.sh` implement verified backup and guarded
restore; see [OBSERVABILITY.md](OBSERVABILITY.md).

## GitHub Actions release, deploy, and rollback

### Repository and environment setup

1. Configure a protected GitHub Environment for each target (`staging` and
   `production`). Add required reviewers and restrict deployment branches/tags.
   **The approval gate is enforced by GitHub Environment protection; without
   that repository setting the workflow has no human approval step.**
2. Environment secrets: `KUBE_CONFIG_B64` (base64 of a least-privilege
   kubeconfig). Never commit it.
3. Environment variables: `APP_URL`, `INGRESS_HOST`, `APP_SECRET_NAME`,
   `INGRESS_CLASS` (default `nginx`), optional `TLS_SECRET_NAME`, optional
   `TRUSTED_PROXY_IPS`.
4. Repository variables: `NEXT_PUBLIC_API_URL` (public HTTPS API origin),
   `NEXT_PUBLIC_SITE_URL` (public HTTPS frontend origin for canonical metadata,
   robots, and sitemap), and optionally `NEXT_PUBLIC_SUPPORT_EMAIL`.
5. Make GHCR packages readable by the target cluster, or configure an image pull
   Secret and `imagePullSecrets`.

### Release

`.github/workflows/release.yml` builds and pushes both images to GHCR on a `v*`
tag or manual dispatch. It refuses to build the frontend without
`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, adds SBOM/provenance metadata,
and publishes both the version and `sha-*` tags. It does **not** deploy.

### Deploy

`.github/workflows/deploy.yml` is manual-only. It requires:

- a protected environment selection;
- the release image tag;
- the literal confirmation `DEPLOY`.

It validates inputs, decodes the kubeconfig from an environment secret, verifies
the application Secret exists, runs `helm upgrade --install --atomic --wait`,
checks rollouts, and probes readiness. `--atomic` automatically rolls the Helm
release back if the upgrade fails. The workflow summary records the image tag and
Helm revision.

### Rollback

`.github/workflows/rollback.yml` is manual-only, attached to the same protected
environment, and requires confirmation `ROLLBACK`. It runs `helm rollback`,
waits, verifies rollouts and readiness, and records the requested revision.

Rollback steps in an incident:

1. Stop the rollback if the database migration already removed or rewrote data.
2. Prefer rolling back the application to the previous Helm revision/image.
3. Restore the database only with an approved, verified backup and the guarded
   `deploy/restore.sh` process.
4. Revoke any credential exposed during the incident.
5. Record the revision, image digest, and reason in the incident timeline.

## Terraform

`deploy/terraform/kubernetes` is an optional wrapper that creates the namespace,
optionally writes the application Secret from sensitive variables, and installs
the Helm release. It has been formatted and validated with
`terraform init -backend=false` and `terraform validate`; see its README.

Terraform state can contain the database URL and other secrets. Use an encrypted
remote backend with restricted access, or set `manage_secret = false` and manage
the Secret through External Secrets/Sealed Secrets/SOPS. `terraform destroy`
deletes the namespace and its contents; obtain approval and take a backup first.

## Operations

- **Readiness:** `/api/v1/health/ready` verifies database connectivity and, in
  production, schema state. **Liveness:** `/api/v1/health/live` must stay cheap.
- **Metrics:** scrape backend `/metrics` with
  `Authorization: Bearer $METRICS_BEARER_TOKEN`; metrics are per process, so sum
  across replicas. Do not expose `/metrics` through the public Ingress.
- **Logs:** structured JSON is enabled in the production Compose overlay and Helm
  values. Ship stdout to the platform log sink; access logs omit query strings,
  bodies, cookies, addresses, user agents, emails, and user IDs.
- **Backups:** run `deploy/backup.sh` on a schedule, verify checksums, copy
  off-host to encrypted storage, and exercise `deploy/restore.sh` in a drill.
- **Scaling:** keep the app stateless. Rate limits and metrics are per process;
  use the ingress/WAF for global abuse controls. Background jobs are safe to run
  on every replica because the queue uses database claiming, but monitor the
  job backlog and stale-job recovery.
- **Graceful shutdown:** the API has a 45-second termination grace period and
  Uvicorn handles SIGTERM. Do not set a shorter pod termination timeout.
- **Secret rotation:** rotate database and provider credentials in the Secret
  manager, then restart workloads. Rotating `CREDENTIAL_ENCRYPTION_KEY` requires
  draining/re-encrypting queued job payloads first.
- **Email/jobs:** production startup rejects SMTP without background jobs
  enabled and a valid Fernet key. Leave both disabled until a relay is verified.
- **Billing:** checkout/portal remain disabled; do not configure Stripe keys
  expecting paid plans to be purchasable.

## Known limitations

- No live image build, registry push, cluster apply, or TLS issuance is verified
  by this repository's local test environment.
- No managed PostgreSQL, DNS, certificate, or cloud IAM module is provided.
- The chart does not bundle a database, Redis, queue service, or object storage.
- NetworkPolicy correctness depends on CNI/ingress-controller behavior and is
  disabled by default.
- Browser E2E is still manual/route-smoke only; see [TESTING.md](TESTING.md).
- Multi-region deployment, disaster-recovery orchestration, and compliance
  certification are out of scope for this release.
