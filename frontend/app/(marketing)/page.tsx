import type { Metadata } from "next";
import Link from "next/link";
import { DiagnosisDemo } from "@/components/DiagnosisDemo";
import { HomepageSections } from "@/components/HomepageSections";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Tarn — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
};

const SURFACES = [
  {
    title: "Kubernetes diagnostics",
    body: "Read pod status, events, and previous logs. The diagnosis keeps observations separate from possible causes.",
    href: "/product/kubernetes",
    status: "Live",
  },
  {
    title: "Log analysis",
    body: "Group repeated log messages, locate the first occurrence, and redact sensitive values before returning evidence.",
    href: "/product/logs",
    status: "Live",
  },
  {
    title: "Terraform plan review",
    body: "Summarize creates, updates, replacements, and deletions without running Terraform or applying a plan.",
    href: "/product/terraform",
    status: "Live",
  },
];

const STEPS = [
  {
    phase: "Surface",
    body: "Choose an infrastructure surface or start with a public, read-only fixture.",
  },
  {
    phase: "Evidence",
    body: "Review the reported status, events, logs, and references collected for the investigation.",
  },
  {
    phase: "Diagnosis",
    body: "Inspect the facts and ranked hypotheses separately. Suggested steps remain yours to review.",
  },
];

export default function Page() {
  return (
    <>
      <div className="shell home-page">
        <section className="home-hero contour-field">
          <div className="home-hero-layout">
            <div className="home-hero-copy">
              <h1>
                See what happened.
                <span> Then decide what it means.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg sm:leading-8">
                Tarn reads infrastructure signals, keeps observations separate
                from hypotheses, and links each conclusion to its evidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/demo" className="btn-accent">
                  Try the diagnosis demo
                </Link>
                <Link href="/docs" className="btn-ghost">
                  Read how it works
                </Link>
              </div>
              <p className="mt-6 max-w-md text-sm leading-6 text-[var(--text-subtle)]">
                The demo uses a public fixture. It does not connect to a cluster
                or require an account.
              </p>
            </div>
            <DiagnosisDemo />
          </div>
        </section>

        <Reveal>
          <section className="home-surface-reference" aria-labelledby="surfaces-title">
            <div className="home-surface-intro">
              <p className="label-caps">Implemented surfaces</p>
              <h2 id="surfaces-title" className="heading-display mt-4 text-4xl sm:text-5xl">
                Follow the source, not the color of a dashboard.
              </h2>
            </div>
            <ul className="home-surface-list">
              {SURFACES.map((surface) => (
                <li key={surface.title}>
                  <Link href={surface.href} className="home-surface-link">
                    <div>
                      <span className="home-surface-status">{surface.status}</span>
                      <h3>{surface.title}</h3>
                      <p>{surface.body}</p>
                    </div>
                    <span className="home-surface-arrow" aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="home-steps">
            <div className="home-steps-intro">
              <p className="label-caps">A diagnosis you can inspect</p>
              <h2 className="heading-display mt-4 max-w-lg text-4xl sm:text-5xl">
                Every conclusion has a trail back to its source.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                Tarn does not turn a plausible explanation into an observed
                fact. Open the evidence reference and check what the system
                actually returned.
              </p>
            </div>
            <ol className="home-steps-list">
              {STEPS.map((step) => (
                <li key={step.phase} className="home-step-row">
                  <span className="home-step-number">{step.phase}</span>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <section className="home-cta" aria-labelledby="home-cta-title">
          <div>
            <p className="label-caps">Start with a fixture</p>
            <h2 id="home-cta-title" className="heading-display mt-4 max-w-2xl text-4xl sm:text-5xl">
              Inspect a failure before connecting infrastructure.
            </h2>
          </div>
          <Link href="/demo" className="btn-accent">Open the demo</Link>
        </section>
      </div>
      <HomepageSections />
    </>
  );
}
