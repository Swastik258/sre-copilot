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
    body: "Read-only diagnosis of unhealthy pods and workloads, with cited observations and review-only next steps.",
    status: "Live",
    live: true,
  },
  {
    slug: "logs",
    title: "Logs",
    body: "Group and deduplicate log streams, surface the first occurrence, and redact secrets before evidence is returned.",
    status: "Live",
    live: true,
  },
  {
    slug: "cicd",
    title: "CI/CD",
    body: "Explain a failed GitHub Actions run, pinpoint the failing step, and show the triggering branch and commit.",
    status: "Live",
    live: true,
  },
  {
    slug: "terraform",
    title: "Terraform",
    body: "Turn a plan into plain language, flag destructive changes, and show the blast radius before apply.",
    status: "Live",
    live: true,
  },
  {
    slug: "assistant",
    title: "AI Assistant",
    body: "Ask why in plain language. Responses use evidence already attached to the investigation and separate facts from hypotheses. The model has no tool access.",
    status: "Live",
    live: true,
  },
  {
    slug: "audit",
    title: "Audit",
    body: "A durable trail of what was asked, the policy decision recorded, and the redacted outcome.",
    status: "Live",
    live: true,
  },
  {
    slug: "metrics",
    title: "Metrics",
    body: "Review Prometheus signals alongside operational events without confusing correlation for causation.",
    status: "Live",
    live: true,
  },
  {
    slug: "runbooks",
    title: "Runbooks",
    body: "Find read-only triage guidance organized around symptoms and operational areas.",
    status: "Live",
    live: true,
  },
  {
    slug: "infra-code",
    title: "Infrastructure Code",
    body: "Generate reviewable infrastructure proposals with reliability and security defaults.",
    status: "Live",
    live: true,
  },
];

export default function Page() {
  return (
    <div className="shell product-index-page py-24">
      <span className="label-caps">Product</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        One evidence model across the surfaces you debug.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Every live surface produces the same shape of answer: observed facts,
        ranked hypotheses, cited evidence, and next steps. Generated
        infrastructure changes remain proposals and are never applied.
      </p>

      <ul className="surface-directory mt-12">
        {SURFACES.map((surface) => (
          <li key={surface.title}>
            <Link href={`/product/${surface.slug}`} className="surface-directory-link">
              <div>
                <span className="surface-directory-status">{surface.status}</span>
                <h2>{surface.title}</h2>
                <p>{surface.body}</p>
              </div>
              <span className="surface-directory-arrow" aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/kubernetes" className="btn-accent">
          Open Kubernetes diagnosis
        </Link>
        <Link href="/docs" className="btn-ghost">
          Read the docs
        </Link>
      </div>

      <aside className="product-status-note mt-20">
        <span className="label-caps">Product status</span>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          The surfaces above are implemented. Live infrastructure data requires
          operator-configured read-only credentials; deterministic fixtures are
          always labelled as demo data. AI explanations are optional, and
          deterministic diagnosis remains authoritative.
        </p>
      </aside>
    </div>
  );
}
