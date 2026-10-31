import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/docs" },
  title: "Documentation — Tarn",
  description:
    "Install Tarn locally or with Docker Compose, connect read-only integrations, and learn the workspace and API basics.",
};

const NAV_ITEMS = [
  { id: "quickstart", label: "Quick start" },
  { id: "requirements", label: "Requirements" },
  { id: "source-install", label: "Run from source" },
  { id: "compose-install", label: "Docker Compose" },
  { id: "first-login", label: "First sign-in" },
  { id: "integrations", label: "Connect integrations" },
  { id: "product-guide", label: "Product guide" },
  { id: "production", label: "Production" },
  { id: "troubleshooting", label: "Troubleshooting" },
];
const API_REFERENCE_URL = `${(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "")}/docs`;

function CodeBlock({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <figure className="my-4 overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
      <figcaption className="border-b border-[var(--border)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-[var(--text)]">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[var(--border)] py-10 sm:py-12">
      <h2 className="text-2xl leading-tight text-[var(--text)] sm:text-3xl">{title}</h2>
      <div className="docs-prose mt-5 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
        {children}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="shell pb-20">
      <header className="max-w-4xl border-b border-[var(--border)] pb-10 sm:pb-12">
        <h1 className="max-w-3xl text-4xl leading-[1.05] text-[var(--text)] sm:text-6xl">
          Get Tarn running. Then connect your evidence.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
          Start with a local demo that needs no API keys or cluster. When you are
          ready, add read-only integrations or deploy Tarn for your team.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#quickstart" className="btn-accent">
            Start setup
          </a>
          <a href={API_REFERENCE_URL} className="btn-ghost">
            Explore the API
          </a>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_minmax(0,760px)] lg:gap-16">
        <nav
          aria-label="Documentation sections"
          className="h-fit overflow-x-auto border-b border-[var(--border)] pb-3 lg:sticky lg:top-8 lg:overflow-visible lg:border-b-0 lg:pb-0"
        >
          <p className="mb-3 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)] lg:block">
            In this guide
          </p>
          <ul className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block rounded-sm px-3 py-2 text-xs text-[var(--text-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] focus-visible:outline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0">
          <DocSection id="quickstart" title="Choose how to run Tarn">
            <p>
              For development, run the backend and frontend from source. For a
              quick local deployment, Docker Compose starts the database and both
              app services together. Both options use self-hosted accounts and
              local demo defaults; no third-party login or cloud credentials are
              required.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="border-y border-[var(--border)] py-4">
                <h3 className="text-base text-[var(--text)]">Run from source</h3>
                <p className="mt-2 text-sm leading-6">
                  Best for development and trying changes. Requires Python and
                  Node.js.
                </p>
                <a href="#source-install" className="mt-3 inline-block text-sm text-[var(--accent)] underline underline-offset-4">
                  Follow the source setup
                </a>
              </div>
              <div className="border-y border-[var(--border)] py-4">
                <h3 className="text-base text-[var(--text)]">Docker Compose</h3>
                <p className="mt-2 text-sm leading-6">
                  Best for trying the complete app locally with PostgreSQL.
                  Requires Docker Compose.
                </p>
                <a href="#compose-install" className="mt-3 inline-block text-sm text-[var(--accent)] underline underline-offset-4">
                  Follow the Compose setup
                </a>
              </div>
            </div>
          </DocSection>

          <DocSection id="requirements" title="What you need">
            <ul className="list-disc space-y-2 pl-5">
              <li>Python 3.11 or newer for the backend.</li>
              <li>Node.js 20 or newer and npm for the frontend.</li>
              <li>Docker with the Compose plugin only if using the container setup.</li>
              <li>
                A modern browser. External provider keys and a Kubernetes cluster
                are optional.
              </li>
            </ul>
            <p>
              The source setup uses SQLite by default and creates a local schema
              automatically. Compose provides PostgreSQL. Neither setup requires
              a separately managed database for a local trial.
            </p>
          </DocSection>

          <DocSection id="source-install" title="Run Tarn from source">
            <ol className="list-decimal space-y-3 pl-5">
              <li>Clone the repository, then create a Python environment.</li>
            </ol>
            <CodeBlock label="Repository root">{`git clone https://github.com/Swastik258/sre-copilot.git
cd sre-copilot`}</CodeBlock>
            <CodeBlock label="PowerShell · backend">{`cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item ..\\.env.example .env
uvicorn app.main:app --reload --port 8000`}</CodeBlock>
            <p>
              Keep this terminal open. If PowerShell blocks environment
              activation, activate the environment using your machine’s
              approved execution-policy settings, or call
              <code>.venv\\Scripts\\python.exe</code> directly.
            </p>
            <CodeBlock label="macOS / Linux · backend">{`cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000`}</CodeBlock>
            <ol start={2} className="list-decimal space-y-3 pl-5">
              <li>In a second terminal, install and start the frontend.</li>
            </ol>
            <CodeBlock label="PowerShell · frontend">{`cd frontend
npm ci
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
$env:NEXT_PUBLIC_SITE_URL = "http://localhost:3000"
npm run dev`}</CodeBlock>
            <CodeBlock label="macOS / Linux · frontend">{`cd frontend
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run dev`}</CodeBlock>
            <p>
              Open{" "}
              <a className="underline underline-offset-4" href="http://localhost:3000">
                http://localhost:3000
              </a>
              . Create an account on the sign-up page. The API health check is at{" "}
              <a className="underline underline-offset-4" href="http://localhost:8000/api/v1/health">
                http://localhost:8000/api/v1/health
              </a>
              .
            </p>
            <p>
              For local development, email delivery is disabled by default.
              Verification and password-reset flows that send email require an
              email delivery backend to be configured.
            </p>
          </DocSection>

          <DocSection id="compose-install" title="Run with Docker Compose">
            <p>Clone the repository, then copy the example environment file and start the local stack:</p>
            <CodeBlock label="Repository root">{`git clone https://github.com/Swastik258/sre-copilot.git
cd sre-copilot`}</CodeBlock>
            <CodeBlock label="PowerShell">{`Copy-Item .env.example .env
docker compose --env-file .env -f deploy/docker-compose.yml up --build`}</CodeBlock>
            <CodeBlock label="macOS / Linux">{`cp .env.example .env
docker compose --env-file .env -f deploy/docker-compose.yml up --build`}</CodeBlock>
            <p>
              When the services are ready, open{" "}
              <a className="underline underline-offset-4" href="http://localhost:3000">
                http://localhost:3000
              </a>{" "}
              and create an account. The local Compose stack includes PostgreSQL,
              the backend, and the frontend. To stop it, press
              {" "} <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">Ctrl+C</kbd>
              {" "}in the terminal, then run:
            </p>
            <CodeBlock label="Repository root">{`docker compose --env-file .env -f deploy/docker-compose.yml down`}</CodeBlock>
            <p>
              The local Compose database password is for local use only. Do not
              expose this stack to an untrusted network or reuse its defaults in
              production.
            </p>
          </DocSection>

          <DocSection id="first-login" title="Create your workspace">
            <p>
              Sign up with an email address and password. With the default local
              configuration, the account owns its own personal workspace.
              Workspace data is scoped to the selected workspace; membership and
              roles control which actions are available.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-[var(--text)]">Viewer:</strong>{" "}
                read workspace data.
              </li>
              <li>
                <strong className="font-medium text-[var(--text)]">Member:</strong>{" "}
                read, diagnose, and save investigations.
              </li>
              <li>
                <strong className="font-medium text-[var(--text)]">Admin:</strong>{" "}
                manage members and connections, and delete investigations.
              </li>
              <li>
                <strong className="font-medium text-[var(--text)]">Owner:</strong>{" "}
                manage the workspace and its deletion-level actions.
              </li>
            </ul>
            <p>
              Authentication is self-hosted. Tarn does not use Clerk. See the{" "}
              <Link href="/security" className="underline underline-offset-4">
                security overview
              </Link>{" "}
              for implemented controls and known gaps.
            </p>
          </DocSection>

          <DocSection id="integrations" title="Connect read-only integrations">
            <p>
              The app can be explored without configuring an integration. Demo
              fixtures are labelled. Live integrations are configured server-side;
              do not put credentials in frontend code or share them in support
              requests.
            </p>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">Kubernetes</h3>
                <p className="mt-1">
                  Configure a read-only kubeconfig or in-cluster service account.
                  Start with fixtures, then follow the{" "}
                  <a href="#kubernetes-setup" className="underline underline-offset-4">
                    Kubernetes setup guide
                  </a>{" "}
                  and apply only the documented read permissions.
                </p>
                <CodeBlock label="Demo mode · backend environment">{`KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=true`}</CodeBlock>
                <h4 id="kubernetes-setup" className="scroll-mt-24 pt-3 font-medium text-[var(--text)]">
                  Configure one local cluster
                </h4>
                <p>
                  Install the optional Kubernetes client in the backend
                  environment, then set the following in
                  <code>backend/.env</code>. Use a kubeconfig whose identity has
                  only read permissions.
                </p>
                <CodeBlock label="backend/.env · Windows path example">{`KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=false
KUBERNETES_KUBECONFIG=C:/Users/you/.kube/config
KUBERNETES_CONTEXT=your-context
KUBERNETES_IN_CLUSTER=false`}</CodeBlock>
                <p>
                  Install the optional dependency with
                  {" "}<code>python -m pip install -e &quot;.[kubernetes]&quot;</code>,
                  then restart the backend. On a remote deployment, use the
                  in-cluster service account rather than a developer’s local
                  kubeconfig. Never mount a kubeconfig with write access.
                </p>
                <details className="group border-y border-[var(--border)]">
                  <summary className="cursor-pointer py-3 text-sm text-[var(--text)] underline underline-offset-4">
                    Read-only Kubernetes RBAC example
                  </summary>
                  <div className="pb-3">
                    <p className="mb-3">
                      This ClusterRole grants only <code>get</code>,{" "}
                      <code>list</code>, and <code>watch</code> for the resources
                      the adapter reads. It grants no Secret or ConfigMap access.
                      Replace the <code>tarn</code> namespace with the namespace
                      where your backend runs, then bind the role to the
                      backend’s service account. For Helm deployments, set{" "}
                      <code>backend.rbac.create=true</code>; the chart creates
                      the matching role and binding. Do not apply the example
                      ServiceAccount separately when Helm manages it.
                    </p>
                    <CodeBlock label="ClusterRole · read-only">{`apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: tarn-readonly
rules:
  - apiGroups: [""]
    resources:
      - pods
      - pods/log
      - events
      - namespaces
      - services
      - persistentvolumeclaims
      - nodes
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources:
      - deployments
      - replicasets
      - statefulsets
      - daemonsets
    verbs: ["get", "list", "watch"]`}</CodeBlock>
                    <CodeBlock label="ServiceAccount and binding · replace namespace as needed">{`apiVersion: v1
kind: ServiceAccount
metadata:
  name: tarn-reader
  namespace: tarn
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tarn-reader
subjects:
  - kind: ServiceAccount
    name: tarn-reader
    namespace: tarn
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tarn-readonly`}</CodeBlock>
                  </div>
                </details>
                <p>
                  For multiple clusters, configure
                  <code>KUBERNETES_CLUSTERS</code> as a JSON array of named
                  targets. The Kubernetes console displays the available
                  targets; selection does not grant additional permissions.
                  See the{" "}
                  <a
                    href="https://github.com/Swastik258/sre-copilot/blob/master/docs/KUBERNETES_SETUP.md"
                    className="underline underline-offset-4"
                  >
                    full Kubernetes configuration reference
                  </a>
                  .
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">GitHub Actions</h3>
                <p className="mt-1">
                  Use a fine-grained token limited to Actions read, Contents read,
                  and Metadata read. Save it as <code>GITHUB_TOKEN</code> in
                  the backend environment; do not use a <code>NEXT_PUBLIC_</code>{" "}
                  variable. Set <code>GITHUB_ENABLED=true</code> and restart the
                  backend. The token must not have write permissions. Read the{" "}
                  <a href="https://github.com/Swastik258/sre-copilot/blob/master/docs/GITHUB_SETUP.md" className="underline underline-offset-4">
                    complete GitHub setup and safety notes
                  </a>
                  .
                </p>
                <CodeBlock label="backend environment · keep token private">{`GITHUB_ENABLED=true
GITHUB_TOKEN=your-fine-grained-read-only-token`}</CodeBlock>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">Prometheus</h3>
                <p className="mt-1">
                  Set <code>PROMETHEUS_ENABLED=true</code> and
                  {" "}<code>PROMETHEUS_URL</code> in the backend environment.
                  Use <code>PROMETHEUS_DEMO_MODE=true</code> with an empty URL
                  for labelled fixtures. The adapter issues read-only range
                  queries. See the{" "}
                  <a href="https://github.com/Swastik258/sre-copilot/blob/master/docs/PROMETHEUS_SETUP.md" className="underline underline-offset-4">
                    Prometheus configuration reference
                  </a>
                  .
                </p>
                <CodeBlock label="backend environment · live server">{`PROMETHEUS_ENABLED=true
PROMETHEUS_DEMO_MODE=false
PROMETHEUS_URL=https://prometheus.example.com`}</CodeBlock>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">AI explanations</h3>
                <p className="mt-1">
                  The default mock provider makes no external model calls. To
                  enable a provider, configure its key only in the backend
                  environment; AI is optional and deterministic findings remain
                  primary. Review the{" "}
                  <a href="https://github.com/Swastik258/sre-copilot/blob/master/docs/AI_PROVIDERS.md" className="underline underline-offset-4">
                    provider configuration and privacy guide
                  </a>
                  {" "}before enabling an external provider.
                </p>
                <p>
                  External providers receive redacted evidence summaries and the
                  question, not raw evidence payloads. Set
                  <code>AI_PRIVACY_MODE=true</code> to block external model calls.
                  Keep provider keys server-side.
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection id="product-guide" title="From observations to an investigation">
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                Open <Link href="/kubernetes" className="underline underline-offset-4">Kubernetes</Link>{" "}
                to review pods and workloads, or use another configured
                integration.
              </li>
              <li>
                Run a diagnosis and inspect its observations, hypotheses, evidence,
                and missing information. Recommendations are not executed.
              </li>
              <li>
                Save a pod diagnosis or workload context as an investigation.
                Workload context is a record of observed fields, not a diagnosis.
              </li>
              <li>
                Find saved records in{" "}
                <Link href="/investigations" className="underline underline-offset-4">
                  Investigations
                </Link>
                . Members can update status and notes; workspace admins and owners
                can delete records.
              </li>
            </ol>
            <p>
              The versioned API reference is available at{" "}
              <a className="underline underline-offset-4" href={API_REFERENCE_URL}>
                the backend’s interactive API docs
              </a>
              . API errors use a consistent JSON envelope and include a request
              ID for troubleshooting.
            </p>
          </DocSection>

          <DocSection id="production" title="Deploying for a team">
            <p>
              A local demo is not a production deployment. Production requires
              HTTPS, a managed or separately operated PostgreSQL database,
              strong secret values, and authentication. Production configuration
              rejects unsafe combinations; verify the environment and migration
  status before directing customer traffic.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Use the production Compose stack only with an external database and TLS proxy.</li>
              <li>For Kubernetes, use the Helm chart and its migration job.</li>
              <li>Supply secrets through a secret manager or Kubernetes Secret, never a ConfigMap or committed file.</li>
              <li>Review the security documentation for current controls and remaining gaps.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="https://github.com/Swastik258/sre-copilot/blob/master/docs/DEPLOYMENT.md" className="btn-ghost">
                Deployment and operations
              </a>
              <Link href="/security" className="btn-ghost">
                Security controls and gaps
              </Link>
            </div>
            <p className="mt-4">
              PostgreSQL row-level security, MFA, SSO, and an in-cluster agent are
              not currently implemented. Do not treat the application as having
              those controls.
            </p>
          </DocSection>

          <DocSection id="troubleshooting" title="Common setup issues">
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">The browser cannot reach the API</h3>
                <p className="mt-1">
                  Confirm the backend is listening on port 8000 and that
                  <code>NEXT_PUBLIC_API_URL</code> points to it. Frontend
                  <code>NEXT_PUBLIC_*</code> values are baked into the build; restart
                  the dev server or rebuild after changing them.
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">The page reports a CORS error</h3>
                <p className="mt-1">
                  Set <code>CORS_ORIGINS</code> in the backend environment to
                  include the frontend origin, such as
                  <code>http://localhost:3000</code>, then restart the backend.
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">There is no cluster data</h3>
                <p className="mt-1">
                  Confirm Kubernetes is enabled and choose demo mode or configure
                  a valid read-only cluster. A missing integration should report
                  its state rather than imply a live connection.
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-base text-[var(--text)]">A management action returns 403</h3>
                <p className="mt-1">
                  Your workspace role may not allow that action. Ask a workspace
                  owner to review membership and role settings.
                </p>
              </div>
            </div>
          </DocSection>

          <footer className="border-t border-[var(--border)] pt-8">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Need more detail? Browse the{" "}
              <a href={API_REFERENCE_URL} className="underline underline-offset-4">API reference</a>,{" "}
              <Link href="/security" className="underline underline-offset-4">security overview</Link>,{" "}
              or <Link href="/support" className="underline underline-offset-4">contact support</Link>.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
