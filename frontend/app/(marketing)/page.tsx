import type { Metadata } from "next";
import Link from "next/link";
import { HomepageSections } from "@/components/HomepageSections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Tarn — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only infrastructure diagnosis across Kubernetes, GitHub Actions, and Prometheus. Structured findings keep observed facts distinct from ranked hypotheses.",
};

const EVIDENCE_STEPS = [
  {
    label: "Source records",
    title: "Collect",
    body: "Connect a supported source and choose the system you need to inspect.",
  },
  {
    label: "Observed facts",
    title: "Inspect",
    body: "Review observations, events, logs, and their evidence references.",
  },
  {
    label: "Ranked hypotheses",
    title: "Assess",
    body: "Compare ranked hypotheses with the facts before choosing what to do.",
  },
];

export default function Page() {
  return (
    <div className="home-page envelope-homepage">
      <section className="envelope-hero" aria-labelledby="home-title">
        <div className="home-container">
          <div className="envelope-heading">
            <h1 id="home-title">Infrastructure diagnosis you can verify.</h1>
            <p className="envelope-lead">
              Follow every finding back to the source evidence behind it.
            </p>
            <div className="envelope-actions">
              <Link href="/sign-up" className="envelope-action-primary">
                Start free
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3.5 10h12m-5-5 5 5-5 5" />
                </svg>
              </Link>
              <Link href="/docs" className="envelope-action-secondary">
                Read the docs
              </Link>
            </div>
            <p className="envelope-readonly">
              Read-only by default. Infrastructure changes stay with the
              operator.
            </p>
          </div>

          <div className="packet-inserts">
            <div className="packet-address">
              <span>How diagnosis works</span>
              <span>Source to finding</span>
            </div>
            <ol className="packet-sequence">
              {EVIDENCE_STEPS.map((step, index) => (
                <li className="packet-slip" key={step.title}>
                  <span className="packet-slip-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="packet-slip-label">{step.label}</span>
                    <h2>{step.title}</h2>
                    <p>{step.body}</p>
                  </div>
                  {index === 0 && (
                    <span className="packet-source-mark" aria-hidden="true">
                      SOURCE
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <details className="packet-trace">
              <summary>
                <span>Trace how a finding is supported</span>
                <span className="packet-pull-tab">Open insert</span>
              </summary>
              <p>
                Evidence references identify source records. Observed facts
                remain separate from ranked hypotheses.
              </p>
            </details>
          </div>

          <div className="packet-edge">
            <span>Built-in adapters</span>
            <ul aria-label="Current built-in adapters">
              <li>Kubernetes</li>
              <li>GitHub Actions</li>
              <li>Prometheus</li>
            </ul>
            <span className="packet-seal">TARN / 01</span>
          </div>
        </div>
      </section>
      <HomepageSections />
    </div>
  );
}
