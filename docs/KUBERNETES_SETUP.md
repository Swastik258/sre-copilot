# Kubernetes setup

> **Status: implemented (read-only), verified in demo/fixture mode.** Live-cluster
> runs require a Docker-enabled host (this development container has no Docker
> daemon) and the optional dependency: `pip install -e ".[kubernetes]"`.

## Quick demo (no cluster)

```bash
cd backend
KUBERNETES_ENABLED=true KUBERNETES_DEMO_MODE=true uvicorn app.main:app --reload
```

Then open the Kubernetes console at `/kubernetes` (or call
`GET /api/v1/kubernetes/pods`). All demo records are labelled `demo: true`.

## Live cluster configuration

| Env var | Purpose |
|---------|---------|
| `KUBERNETES_ENABLED` | Master switch (default `false`) |
| `KUBERNETES_DEMO_MODE` | Use labelled fixtures when no cluster is configured (set `false` for live) |
| `KUBERNETES_KUBECONFIG` | Path to a kubeconfig for local development |
| `KUBERNETES_CONTEXT` | Explicit context selection |
| `KUBERNETES_IN_CLUSTER` | Use in-cluster service account when deployed |
| `KUBERNETES_REQUEST_TIMEOUT_SECONDS` | Per-call timeout (default 15) |

See [docs/API.md](API.md#kubernetes-read-only) for the endpoint list.

## Read-only RBAC

Access must use least-privilege **read-only** rules. No `create`, `update`,
`patch`, `delete`, or `deletecollection` verbs.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sre-copilot-readonly
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log", "events", "namespaces",
                "services", "persistentvolumeclaims", "nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch"]
```

## Safety guarantees enforced in code

- The client interface (`KubernetesReadClient`) exposes **only** read methods;
  there is no create/update/patch/delete anywhere in the adapter, and a test
  (`tests/unit/test_kubernetes_readonly.py`) enforces this structurally.
- Logs are bounded by `tail_lines` and redacted before becoming evidence.
- If no cluster is available, use clearly-labelled demo fixtures (`demo: true`).
- Remediation is emitted as *recommendations* that require explicit human
  approval and are never executed.

## Testing

Unit tests use the fixture client and cover every rule scenario plus structural
read-only guarantees. Live verification is planned via `kind`/`minikube`
integration tests on a Docker-enabled host.
