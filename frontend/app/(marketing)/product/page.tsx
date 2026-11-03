import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/product" },
  title: "Product — Tarn",
  description:
    "Kubernetes, logs, CI/CD, Terraform, the assistant, and audit: evidence-backed diagnosis for production operations.",
};

const SURFACES = [
  {
    slug: "kubernetes",
    title: "Kubernetes",
    body: "Inspect unhealthy pods with cited, read-only workload findings.",
    status: "Live",
  },
  {
    slug: "logs",
    title: "Logs",
    body: "Group noisy logs, find first occurrences, and redact secrets.",
    status: "Live",
  },
  {
    slug: "cicd",
    title: "CI/CD",
    body: "Trace failed GitHub Actions runs to the step and commit.",
    status: "Live",
  },
  {
    slug: "terraform",
    title: "Terraform",
    body: "Review plan changes, destructive actions, and blast radius.",
    status: "Live",
  },
  {
    slug: "assistant",
    title: "AI Assistant",
    body: "Ask why in plain language. Cited answers separate facts from hypotheses.",
    status: "Live",
  },
  {
    slug: "audit",
    title: "Audit",
    body: "Review questions, policy decisions, and redacted outcomes.",
    status: "Live",
  },
  {
    slug: "metrics",
    title: "Metrics",
    body: "Compare Prometheus signals with events, not assumed causes.",
    status: "Live",
  },
  {
    slug: "runbooks",
    title: "Runbooks",
    body: "Find read-only triage guidance by symptom and area.",
    status: "Live",
  },
  {
    slug: "infra-code",
    title: "Infrastructure Code",
    body: "Review infrastructure proposals with reliability and security defaults.",
    status: "Live",
  },
];

const SURFACE_STATUS_COUNTS = SURFACES.reduce<Record<string, number>>(
  (counts, surface) => {
    counts[surface.status] = (counts[surface.status] ?? 0) + 1;
    return counts;
  },
  {},
);

const COMMON_SURFACE_STATUS = SURFACES.reduce((commonStatus, surface) =>
  SURFACE_STATUS_COUNTS[surface.status] > SURFACE_STATUS_COUNTS[commonStatus]
    ? surface.status
    : commonStatus,
  SURFACES[0].status,
);

export default function Page() {
  return (
    <div className="envelope-product-page">
      <div className="shell">
        <div className="product-packet">
          <header className="product-packet-heading">
            <h1>One evidence model across the surfaces you debug.</h1>
            <p>
              Every live surface produces the same shape of answer: observed
              facts, ranked hypotheses, cited evidence, and next steps.
              Generated infrastructure changes remain proposals and are never
              applied.
            </p>
            <div className="product-packet-actions">
              <Link href="/sign-up" className="envelope-action-primary">
                Get started
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3.5 10h12m-5-5 5 5-5 5" />
                </svg>
              </Link>
              <Link href="/docs" className="envelope-action-secondary">
                Read the docs
              </Link>
            </div>
          </header>

          <section className="product-packet-inserts" aria-labelledby="product-index-title">
            <div className="product-inserts-address">
              <h2 id="product-index-title">Product surfaces</h2>
              <span>Nine surfaces · one console</span>
            </div>
            <ul className="surface-directory">
              {SURFACES.map((surface) => (
                <li key={surface.title}>
                  <Link href={`/product/${surface.slug}`} className="surface-directory-link">
                    <div className="surface-directory-copy">
                      <h3>{surface.title}</h3>
                      <p>{surface.body}</p>
                    </div>
                    {surface.status !== COMMON_SURFACE_STATUS && (
                      <span className="surface-directory-status">{surface.status}</span>
                    )}
                    <svg className="surface-directory-arrow" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 10h11m-5-5 5 5-5 5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="product-packet-edge">
            <aside className="product-status-note">
              <span className="label-caps">Product status</span>
              <p>
                The surfaces above are implemented. Live infrastructure data
                requires operator-configured read-only credentials. AI
                explanations are optional, and deterministic diagnosis remains
                authoritative.
              </p>
            </aside>
            <span className="packet-seal">TARN / PRODUCT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
