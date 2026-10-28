# Kubernetes Terraform wrapper (optional)

This module creates a namespace, optionally writes the application Secret, and
installs the Helm chart with the Helm provider. It is a convenience wrapper, not
a cloud provisioning module. It has been validated with `terraform init
-backend=false`, `terraform validate`, and `terraform fmt`; it has **not** been
applied to a live cluster in this repository's CI.

> **State warning.** With `manage_secret = true`, the database URL and any
> `secret_data` values are stored in Terraform state. Use an encrypted remote
> backend with restricted access. For stronger separation, set
> `manage_secret = false` and provision `sre-copilot-secrets` with External
> Secrets, Sealed Secrets, SOPS, or your cloud secret manager.

## Usage

```sh
cd deploy/terraform/kubernetes
cp terraform.tfvars.example terraform.tfvars
chmod 600 terraform.tfvars
# Replace every CHANGE_ME value.
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

`terraform destroy` deletes the namespace and everything in it. Take a backup
and obtain approval before running it.

## Secret keys

The chart consumes environment variables from the referenced Secret. At
minimum:

| Key | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | yes | PostgreSQL DSN. |
| `CREDENTIAL_ENCRYPTION_KEY` | when jobs/email are enabled | Fernet key for queued payloads. |
| `METRICS_BEARER_TOKEN` | production scrape | Protects `/metrics`. |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | when SMTP is enabled | Mail relay credentials. |
| `SENTRY_DSN` | optional | Error tracking. |
| `GOOGLE_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_CLIENT_SECRET` | optional | OAuth providers. |
| `OPENAI_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` | optional | Live AI providers. |
| `GITHUB_TOKEN` | optional | Read-only GitHub integration. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | optional | Billing remains disabled in this release. |

Non-secret settings are in the chart's `backend.env` values. The deploy
workflow overrides public URLs and the existing Secret name.

## Limitations

- The frontend API origin is compiled into the frontend image. Build it with the
  public HTTPS origin before deploying.
- Database migrations are forward-only. A Helm rollback does not reverse schema
  changes, so migrations must remain compatible with the previous application
  revision.
- NetworkPolicy defaults to disabled because probe and ingress-controller
  traffic depends on the CNI. Enable it only after validating your cluster.
- This module does not provision PostgreSQL, TLS certificates, DNS, or a
  container registry.
