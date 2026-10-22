# Kubernetes setup

> **Status: implemented (read-only), fixture and live verified.** The adapter was
> verified against a local Kind cluster (`kind-tws-cluster`) on the Windows host.
> Live use requires read-only RBAC and the optional dependency:
> `pip install -e ".[kubernetes]"`.

## Quick demo (no cluster)

```bash
cd backend
KUBERNETES_ENABLED=true KUBERNETES_DEMO_MODE=true uvicorn app.main:app --reload
```

Then open `/kubernetes` or call `GET /api/v1/kubernetes/pods`. Demo records are
labelled `demo: true`.

## Single live cluster

| Env var | Purpose |
|---------|---------|
| `KUBERNETES_ENABLED` | Master switch (default `false`) |
| `KUBERNETES_DEMO_MODE` | Use fixtures when no cluster is configured (set `false` for live) |
| `KUBERNETES_KUBECONFIG` | Path to a kubeconfig |
| `KUBERNETES_CONTEXT` | Explicit context selection |
| `KUBERNETES_IN_CLUSTER` | Use the in-cluster service account |
| `KUBERNETES_REQUEST_TIMEOUT_SECONDS` | Per-call timeout (default 15) |

Windows example (use a Windows-accessible path, not WSL `/home/...`):

```dotenv
KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=false
KUBERNETES_KUBECONFIG=C:/Users/swastik/.kube/kind-config
KUBERNETES_CONTEXT=kind-tws-cluster
KUBERNETES_IN_CLUSTER=false
```

## Multiple clusters

Set `KUBERNETES_CLUSTERS` to a JSON array. Each item has a unique `name` and the
same read-only connection fields. This takes precedence over the legacy
single-target settings.

```dotenv
KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=false
KUBERNETES_CLUSTERS=[{"name":"kind-local","kubeconfig":"C:/Users/swastik/.kube/kind-config","context":"kind-tws-cluster","in_cluster":false},{"name":"staging","kubeconfig":"C:/Users/swastik/.kube/staging","context":"staging","in_cluster":false}]
```

Use `cluster=<name>` on namespace/workload/pod/log/diagnose endpoints. The
`/kubernetes` console lists clusters and passes the selected name through.
`GET /api/v1/kubernetes/clusters` returns the configured names and demo flags.

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
- If no cluster is available, use clearly labelled demo fixtures (`demo: true`).
- Remediation is emitted as *recommendations* for human review. There is no
  execution or apply path in the product.
- Cluster selection is a read-only target selector; it does not grant or change
  cluster permissions.

## Testing

Unit tests use the fixture client and cover every rule scenario plus structural
read-only guarantees. Multi-cluster parsing/selection has dedicated tests.
Live verification used a local Kind cluster; repeat the check after syncing to
the Windows checkout. See `docs/TESTING.md` and `docs/RELEASE.md`.
