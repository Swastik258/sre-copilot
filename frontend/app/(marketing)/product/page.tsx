import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/product" },
  title: "Product — SRE Copilot",
  description:
    "Kubernetes, logs, CI/CD, Terraform, the assistant, and audit: evidence-backed diagnosis for production operations.",
};

const SURFACES = [
  {
    title: "Kubernetes",
    body: "Read-only diagnosis of unhealthy pods and workloads, with cited observations and review-only next steps.",
    status: "Live",
    live: true,
  },
  {
    title: "Logs",
    body: "Group and deduplicate log streams, surface the first occurrence, and redact secrets before evidence is returned.",
    status: "Live",
    live: true,
  },
  {
    title: "CI/CD",
    body: "Explain a failed GitHub Actions run, pinpoint the failing step, and show the triggering branch and commit.",
    status: "Live",
    live: true,
  },
  {
    title: "Terraform",
    body: "Turn a plan into plain language, flag destructive changes, and show the blast radius before apply.",
    status: "Live",
    live: true,
  },
  {
    title: "AI Assistant",
    body: "Ask why in plain language. Responses use evidence already attached to the investigation and separate facts from hypotheses. The model has no tool access.",
    status: "Live",
    live: true,
  },
  {
    title: "Audit",
    body: "A durable trail of what was asked, the policy decision recorded, and the redacted outcome.",
    status: "Live",
    live: true,
  },
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Product</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        One evidence model across the surfaces you debug.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Every live surface produces the same shape of answer: observed facts,
        ranked hypotheses, cited evidence, and next steps. Generated
        infrastructure changes remain proposals and are never applied.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SURFACES.map((surface) => (
          <article key={surface.title} className="card flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-2xl text-[var(--text)]">
                {surface.title}
              </h2>
              <span
                className={`badge ${surface.live ? "tag-live" : "tag-planned"}`}
              >
                {surface.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              {surface.body}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/kubernetes" className="btn-accent">
          Open Kubernetes diagnosis
        </Link>
        <Link href="/docs" className="btn-ghost">
          Read the docs
        </Link>
      </div>

      <div className="card mt-24 p-8">
        <span className="label-caps">Honest status</span>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          The surfaces above are implemented. Live infrastructure data requires
          operator-configured read-only credentials; deterministic fixtures are
          always labelled as demo data. AI explanations are optional, and
          deterministic diagnosis remains authoritative.
        </p>
      </div>
    </div>
  );
}
