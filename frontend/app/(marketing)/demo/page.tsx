import type { Metadata } from "next";
import Link from "next/link";
import { DiagnosisDemo } from "@/components/DiagnosisDemo";
import { PageHeader } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/demo" },
  title: "Try a diagnosis — Tarn",
  description:
    "Review saved diagnosis output from Tarn's deterministic Kubernetes rules. No account, cluster access, or API key required.",
};

export default function DemoPage() {
  return (
    <article className="demo-page">
      <div className="shell">
        <PageHeader
          label="Public Kubernetes fixture"
          title="Inspect the evidence before the conclusion."
          lead="Choose a failure. Read the observed facts, the payloads behind them, and the rules engine's ranked explanations. The public demo uses saved output, not a live cluster."
          actions={
            <>
              <Link href="/sign-up" className="btn-primary">
                Create an account
              </Link>
              <Link href="/docs#investigation-engine" className="btn-ghost">
                Read how diagnosis works
              </Link>
            </>
          }
        />

        <div className="demo-page__artifact">
          <DiagnosisDemo />
          <p className="demo-page__note">
            <span>
              Five failure modes: CrashLoopBackOff, OOMKilled,
              ImagePullBackOff, Pending, and a failing readiness probe.
            </span>
            <span>
              Synthetic fixture. Read-only. No cluster connection or account.
            </span>
          </p>
        </div>
      </div>

      <section className="demo-page__support-section" aria-labelledby="demo-detail-title">
        <div className="shell demo-page__support">
          <div>
            <p className="section-label">What you are reading</p>
            <h2 id="demo-detail-title">Saved rules-engine output.</h2>
          </div>
          <div>
            <p>
              Each tab is a snapshot produced by Tarn's deterministic Kubernetes
              rules against a labelled fixture. The evidence payloads are
              redacted before they are returned. No language model interprets
              the snapshot on this page, so the output is reproducible.
            </p>
            <p>
              The same rule set runs against a read-only cluster connection when
              an operator configures one. If metrics or GitHub data are absent,
              the diagnosis says so rather than filling the gap.
            </p>
            <div className="ledger-grid mt-8">
              <section>
                <h2>Included in the fixture</h2>
                <ul>
                  <li>Pod status, container state, restart counts</li>
                  <li>Kubernetes warning events and scheduling failures</li>
                  <li>Bounded current and previous container logs</li>
                  <li>One evidence reference per cited claim</li>
                </ul>
              </section>
              <section>
                <h2>Not included</h2>
                <ul>
                  <li>Live cluster or production credentials</li>
                  <li>Customer names, logos, or testimonials</li>
                  <li>An AI provider call on this page</li>
                  <li>Mutation, remediation, or apply actions</li>
                </ul>
              </section>
            </div>
            <div className="surface-detail-actions">
              <Link href="/security" className="link-editorial">
                Read the security model
              </Link>
              <Link href="/pricing">See what is purchasable</Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
