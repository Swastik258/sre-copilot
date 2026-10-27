import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/docs" },
  title: "Documentation — Tarn",
  description:
    "Local setup, API reference, architecture, security, Kubernetes, and the investigation engine.",
};

const SECTIONS = [
  {
    id: "public-demo",
    title: "Public demo",
    description:
      "Saved output from the deterministic Kubernetes rules against a labelled fixture.",
  },
  {
    id: "local-setup",
    title: "Local setup",
    description:
      "Run the FastAPI backend and Next.js frontend with SQLite and no external services.",
  },
  {
    id: "api-reference",
    title: "API reference",
    description:
      "The versioned HTTP API, its error envelope, request IDs, and the endpoints used by the console.",
  },
  {
    id: "architecture",
    title: "Architecture",
    description:
      "Adapters, services, the shared evidence model, and how a diagnosis is assembled.",
  },
  {
    id: "security",
    title: "Security",
    description:
      "Read-only adapters, Argon2id passwords, session and CSRF handling, and secret redaction.",
  },
  {
    id: "kubernetes",
    title: "Kubernetes",
    description:
      "Fixture mode, real-cluster configuration, and the read-only client contract.",
  },
  {
    id: "investigation-engine",
    title: "Investigation engine",
    description:
      "How observations become ranked hypotheses, and why every claim carries evidence IDs.",
  },
];

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Documentation"
        title="Read the system before you trust the diagnosis."
        lead="These notes describe the implementation as it exists. Live product surfaces are identified as live; paid plans and future work remain explicitly labelled as planned."
        meta={<span>Last reviewed against the working tree</span>}
        actions={
          <Link href="/demo" className="btn-primary">
            Open the public demo
          </Link>
        }
      />

      <nav aria-label="Documentation contents">
        <ul className="docs-index mt-4">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>
                <span>{section.title}</span>
                <span aria-hidden="true">↓</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="docs-body mt-16">
        <section id="public-demo">
          <div>
            <p className="section-label">Public demo</p>
          </div>
          <div>
            <h2>A fixture, not a live cluster.</h2>
            <p>
              The no-signup demo shows saved outputs generated from the public
              Kubernetes fixture by the existing deterministic diagnosis rules.
              It does not call the API or connect to infrastructure.
            </p>
            <p>
              The fixture covers five failure modes: CrashLoopBackOff, OOMKilled,
              ImagePullBackOff, Pending with a scheduling failure, and a failing
              readiness probe. Each snapshot separates observations, evidence,
              and ranked hypotheses.
            </p>
            <Link href="/demo" className="link-editorial mt-4 inline-block text-sm">
              Open the interactive demo
            </Link>
          </div>
        </section>

        <section id="local-setup">
          <div>
            <p className="section-label">Local setup</p>
          </div>
          <div>
            <h2>One repository, two processes.</h2>
            <p>
              Start the backend with its local SQLite database, then run the
              frontend against the versioned API. Demo fixtures make the
              Kubernetes surface usable without a cluster.
            </p>
            <pre className="docs-code">
              <code>{`# backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload

# frontend, in a second terminal
cd frontend
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev`}</code>
            </pre>
            <p>
              The backend defaults to SQLite and creates its schema for local use.
              Public signup creates an account with its own personal workspace.
              Authentication is enforced for shared deployments by{" "}
              <code>ENVIRONMENT=production</code> and{" "}
              <code>AUTH_REQUIRED=true</code>.
            </p>
          </div>
        </section>

        <section id="api-reference">
          <div>
            <p className="section-label">API reference</p>
          </div>
          <div>
            <h2>Predictable errors, traceable requests.</h2>
            <p>
              Responses use a uniform error envelope, every request carries an
              ID, and secrets are redacted before they reach logs or evidence.
              The frontend uses the same-origin <code>/api</code> proxy so
              authenticated writes keep working when the frontend and backend are
              deployed on separate origins.
            </p>
            <p>
              The versioned API is documented by the FastAPI schema shipped with
              the backend. The console uses the same endpoints exposed to
              operators; there is a separate admin surface for workspace-scoped
              administration.
            </p>
          </div>
        </section>

        <section id="architecture">
          <div>
            <p className="section-label">Architecture</p>
          </div>
          <div>
            <h2>Adapters in, evidence out.</h2>
            <p>
              Infrastructure adapters normalize read-only observations. Services
              turn those observations into evidence, and the deterministic
              diagnosis layer ranks hypotheses without hiding the facts
              underneath them.
            </p>
            <p>
              AI is optional and downstream of the evidence. The model receives a
              redacted evidence set and returns text. It has no tools, shell, or
              network access. Deterministic rules remain authoritative when no
              provider is configured.
            </p>
          </div>
        </section>

        <section id="security">
          <div>
            <p className="section-label">Security</p>
          </div>
          <div>
            <h2>Read-only is a structural property.</h2>
            <p>
              Infrastructure adapters expose no mutating operations. Passwords
              use Argon2id, session tokens are stored hashed, and sensitive
              values are removed before they enter the evidence trail. CSRF,
              trusted-proxy rate limits, idempotency, and request-size caps are
              implemented in the backend.
            </p>
            <p>
              Tarn does not claim SOC 2, ISO 27001, MFA, SSO, or a third-party
              penetration test. The{" "}
              <Link href="/security" className="link-editorial">
                security page
              </Link>{" "}
              lists the real controls and the real gaps.
            </p>
          </div>
        </section>

        <section id="kubernetes">
          <div>
            <p className="section-label">Kubernetes</p>
          </div>
          <div>
            <h2>Fixtures first, cluster second.</h2>
            <p>
              Start with the bundled demo fixtures, then connect a real cluster
              with a read-only kubeconfig. The console reports connected, demo,
              and disabled states from the backend instead of assuming a source
              is live.
            </p>
            <p>
              The client can list pods, events, and bounded logs. It has no exec,
              delete, patch, apply, or scale method. A missing integration is
              named in the diagnosis as missing evidence.
            </p>
          </div>
        </section>

        <section id="investigation-engine">
          <div>
            <p className="section-label">Investigation engine</p>
          </div>
          <div>
            <h2>Facts first. Hypotheses second.</h2>
            <p>
              Each diagnosis exposes its evidence IDs, the resource and payload
              behind each observation, and a confidence for every hypothesis. A
              plausible guess is never presented as a fact.
            </p>
            <p>
              Confidence reflects the deterministic rule match and the evidence
              available. It is not a probability that the operator should apply a
              change. Suggested next steps remain review-only.
            </p>
          </div>
        </section>
      </div>

      <div className="surface-detail-actions mt-10 border-t border-[var(--border)] pt-5">
        <Link href="/support" className="link-editorial">
          Ask a question
        </Link>
        <Link href="/security">Read the security page</Link>
        <Link href="/changelog">See what changed</Link>
      </div>
    </article>
  );
}
