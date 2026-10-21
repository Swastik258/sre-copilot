import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SRE Copilot — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
};

const SURFACES = [
  {
    index: "01",
    title: "Kubernetes diagnostics",
    body: "Read pod status, events, and previous logs through a client with no mutating methods. Every observation is cited.",
    status: "Live",
    live: true,
  },
  {
    index: "02",
    title: "Log analysis",
    body: "Group noisy streams, surface the first occurrence, and keep secrets out of the evidence trail.",
    status: "Planned",
    live: false,
  },
  {
    index: "03",
    title: "Terraform plan explainer",
    body: "Translate a plan into creates, replacements, and deletions, with destructive changes called out before apply.",
    status: "Planned",
    live: false,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Choose a surface",
    body: "Start with a live Kubernetes cluster or a labelled demo fixture. No write credentials are required.",
  },
  {
    number: "02",
    title: "Collect evidence",
    body: "The read-only client gathers observed facts and links each one to the resource and payload behind it.",
  },
  {
    number: "03",
    title: "Act on the diagnosis",
    body: "Review cited next steps, ranked hypotheses, and any approval-gated remediation with a rollback path.",
  },
];

export default function Page() {
  return (
    <div className="shell py-24">
      <section className="max-w-4xl">
        <span className="label-caps">Read-only by default</span>
        <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
          Investigate infrastructure with evidence, not guesses.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
          SRE Copilot turns a failing state into a structured diagnosis. It keeps
          observed facts separate from ranked hypotheses, cites the evidence
          behind each claim, and proposes next steps that only read.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/assistant" className="btn-accent">
            Start an investigation
          </Link>
          <Link href="/docs" className="btn-ghost">
            Read the docs
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 label-caps">
          <span className="flex items-center gap-2">
            <span className="dot dot-good" />
            Read-only by construction
          </span>
          <span>Local accounts</span>
          <span>Demo fixtures available</span>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        {SURFACES.map((surface) => (
          <article key={surface.title} className="card flex flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-[var(--text-subtle)]">
                {surface.index}
              </span>
              <span
                className={`badge ${surface.live ? "tag-live" : "tag-planned"}`}
              >
                {surface.status}
              </span>
            </div>
            <h2 className="mt-8 font-serif text-2xl text-[var(--text)]">
              {surface.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {surface.body}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-24 border-t border-[var(--border)] pt-12">
        <span className="label-caps">How it works</span>
        <h2 className="heading-display mt-4 text-[var(--text)] text-3xl md:text-4xl">
          Three steps, no guesswork.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number}>
              <div className="font-mono text-xs text-[var(--accent)]">
                {step.number}
              </div>
              <h3 className="mt-4 text-base font-semibold text-[var(--text)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-24 p-8 md:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <span className="label-caps">Start here</span>
            <h2 className="heading-display mt-4 text-[var(--text)] text-4xl md:text-5xl">
              Bring a failing pod. Leave with evidence.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
              The Kubernetes surface is live today. Logs, CI/CD, Terraform, and
              the assistant are labelled planned until they ship.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/kubernetes" className="btn-accent">
              Diagnose a pod
            </Link>
            <Link href="/product" className="btn-ghost">
              See the product
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
