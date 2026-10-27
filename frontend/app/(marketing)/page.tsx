import type { Metadata } from "next";
import Link from "next/link";
import { ContourField } from "@/components/ContourField";
import { DiagnosisDemo } from "@/components/DiagnosisDemo";
import { DepthScale, EvidenceRef, StatusText } from "@/components/editorial";
import { FAQ } from "@/components/FAQ";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Tarn — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
};

const SURFACES = [
  {
    name: "Kubernetes",
    href: "/product/kubernetes",
    reads: "Pod status, events, previous logs",
    output: "Observed facts, ranked causes, read-only next steps",
    status: "Live",
    state: "live" as const,
  },
  {
    name: "Logs",
    href: "/product/logs",
    reads: "Pasted or bounded log streams",
    output: "Grouped signatures, first occurrence, redacted evidence",
    status: "Live",
    state: "live" as const,
  },
  {
    name: "CI/CD",
    href: "/product/cicd",
    reads: "GitHub Actions runs and failing steps",
    output: "Failing step, branch and commit context, no re-run",
    status: "Live",
    state: "live" as const,
  },
  {
    name: "Terraform",
    href: "/product/terraform",
    reads: "A supplied plan or state",
    output: "Creates, updates, replacements, deletions, risk",
    status: "Live",
    state: "live" as const,
  },
  {
    name: "Assistant",
    href: "/product/assistant",
    reads: "Evidence already attached to an investigation",
    output: "Plain-language explanation with the same citations",
    status: "Provider optional",
    state: "demo" as const,
  },
];

const BOUNDARIES = [
  {
    title: "No mutation path.",
    body:
      "Kubernetes connectors list pods, events, and logs. There is no exec, delete, patch, or apply. Terraform analysis never runs plan or apply.",
  },
  {
    title: "No model tools.",
    body:
      "The AI provider receives redacted evidence and returns text. It cannot call the cluster, read a secret, or execute a command.",
  },
  {
    title: "No certainty theatre.",
    body:
      "Facts and hypotheses have different labels. A missing integration appears as missing evidence, not as a lower-confidence guess.",
  },
  {
    title: "No hosted proof on this page.",
    body:
      "There are no invented customers, logos, testimonials, or uptime claims. The public demo uses checked-in data and labels it as demo data.",
  },
];

export default function Page() {
  return (
    <article className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <ContourField className="home-hero__contour" rings={12} />
        <div className="shell home-hero__grid">
          <div className="home-hero__copy">
            <p className="home-hero__note">
              <span>Read-only infrastructure diagnosis</span>
              <span>Kubernetes · logs · CI/CD · Terraform</span>
            </p>
            <h1 id="home-title" className="home-hero__title">
              See what happened.
              <span>Then decide what it means.</span>
            </h1>
            <p className="home-hero__lead">
              Tarn reads the signals your systems already produce, keeps
              observations separate from explanations, and links every
              conclusion back to the evidence that supports it.
            </p>
            <div className="home-hero__actions">
              <Link href="/demo" className="btn-primary">
                Open the demo
              </Link>
              <Link href="/product" className="btn-ghost">
                Read the surfaces
              </Link>
            </div>
            <p className="home-hero__fineprint">
              No account, cluster connection, or API key. The demo runs saved
              output from the deterministic rules engine against a public
              fixture.
            </p>
          </div>

          <div className="home-hero__artifact">
            <DiagnosisDemo />
          </div>
        </div>
      </section>

      <section className="home-surface-ledger" aria-labelledby="surfaces-title">
        <div className="shell surface-ledger__grid">
          <aside className="surface-ledger__margin">
            <p className="section-label">Implemented surfaces</p>
            <p>
              Nine surfaces share one evidence model. These are the places
              operators usually start.
            </p>
          </aside>

          <div className="surface-ledger__body">
            <h2 id="surfaces-title">
              Follow the source, not the color of a dashboard.
            </h2>
            <div className="table-scroll">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th scope="col">Surface</th>
                    <th scope="col">Reads</th>
                    <th scope="col">Returns</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SURFACES.map((surface) => (
                    <tr key={surface.name}>
                      <td data-label="Surface">
                        <Link href={surface.href}>{surface.name}</Link>
                      </td>
                      <td data-label="Reads">{surface.reads}</td>
                      <td data-label="Returns">{surface.output}</td>
                      <td data-label="Status">
                        <StatusText state={surface.state}>
                          {surface.status}
                        </StatusText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/product" className="link-editorial">
              Compare all nine surfaces
            </Link>
          </div>
        </div>
      </section>

      <section className="depth-section" data-theme="ink" aria-labelledby="depth-title">
        <ContourField className="depth-section__contour" rings={10} />
        <div className="shell depth-section__grid">
          <div className="depth-section__rail">
            <p className="section-label">How to read a diagnosis</p>
            <DepthScale
              items={[
                {
                  mark: "0m",
                  label: "Observed",
                  detail: "What the system reported.",
                },
                {
                  mark: "1m",
                  label: "Evidence",
                  detail: "The exact payload behind it.",
                },
                {
                  mark: "2m",
                  label: "Hypothesis",
                  detail: "An explanation with confidence.",
                },
              ]}
            />
          </div>

          <div className="depth-section__body">
            <h2 id="depth-title">
              Facts sit at the surface. Hypotheses sit deeper.
            </h2>
            <p>
              A diagnosis is not a verdict. Tarn shows you the pod status,
              event, or log line that supports a claim — and keeps the
              interpretation visibly separate from the observation.
            </p>
            <p>
              If the evidence is incomplete, the gap remains in the answer.
              No integration is quietly replaced with a confident guess.
            </p>

            <div className="evidence-sample" aria-label="Evidence sample">
              <div className="evidence-sample__header">
                <span>Example from the public CrashLoopBackOff fixture</span>
                <span>demo data</span>
              </div>
              <div className="evidence-sample__row">
                <span>0m</span>
                <p>
                  Container api: state=waiting, reason=CrashLoopBackOff,
                  restarts=14, lastReason=Error, lastExit=1.
                </p>
                <EvidenceRef>pod/status#1</EvidenceRef>
              </div>
              <div className="evidence-sample__row">
                <span>1m</span>
                <p>
                  Event Unhealthy (Warning, count=9): readiness probe failed
                  against 10.1.2.3:8080.
                </p>
                <EvidenceRef>pod/events#2</EvidenceRef>
              </div>
              <div className="evidence-sample__row">
                <span>2m</span>
                <p>
                  Container api is in CrashLoopBackOff after 14 restarts.
                  Confidence 85%.
                </p>
                <EvidenceRef>pod/status#1</EvidenceRef>
              </div>
            </div>

            <Link href="/demo" className="btn-glass">
              Inspect the fixture
            </Link>
          </div>

          <aside className="depth-section__note">
            <p>
              Evidence references are footnotes, not decoration. They point
              to the exact read-only payload Tarn used.
            </p>
          </aside>
        </div>
      </section>

      <section className="boundaries-section" aria-labelledby="boundaries-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">What it does not do</p>
            <p>
              Read-only is a product boundary enforced in the adapter layer,
              not a setting on a permissions page.
            </p>
          </aside>
          <div className="rail-section__body">
            <h2 id="boundaries-title">A diagnosis is not permission to act.</h2>
            <p>
              Tarn can tell you what it observed and what it thinks is likely.
              It does not change production for you, and it does not hide the
              limits of what it read.
            </p>
            <ul className="boundaries-list">
              {BOUNDARIES.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong> {item.body}
                </li>
              ))}
            </ul>
            <div className="boundaries-links">
              <Link href="/security" className="link-editorial">
                Read the security model
              </Link>
              <Link href="/docs">Open the docs</Link>
              <Link href="/pricing">How plans are scoped</Link>
            </div>
          </div>
        </div>
      </section>

      <FAQ />

      <section className="home-cta" data-theme="ink" aria-labelledby="home-cta-title">
        <ContourField className="home-cta__contour" rings={8} />
        <div className="shell home-cta__inner">
          <div>
            <h2 id="home-cta-title">
              Start with a failure you can inspect.
            </h2>
            <p>
              Five saved scenarios, one evidence contract, no account. When you
              connect a source, the same rules run against read-only data.
            </p>
          </div>
          <div className="page-actions">
            <Link href="/demo" className="btn-primary">
              Open the demo
            </Link>
            <Link href="/docs" className="btn-glass">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
