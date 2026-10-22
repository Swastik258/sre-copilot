import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/sre" },
  title: "SRE on-call — SRE Copilot",
  description:
    "Get to the evidence before the third tab with ranked hypotheses and cited next steps.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Solutions / SRE on-call</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Get to the evidence before the third tab.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        At 03:00 you do not need another dashboard. You need the two or three
        facts that explain the page. SRE Copilot turns a failing state into
        observed facts, ranked hypotheses, and cited next steps you can review
        immediately. Nothing is executed on your infrastructure.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <span className="label-caps">Facts first</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Observed, not asserted
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Restart counts, exit codes, events, and conditions are tied to the
            pod status and payload behind each observation.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Next steps</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Safe to review at any hour
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Proposed next steps are review-only. The product does not execute
            remediation or apply infrastructure changes.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/solutions" className="btn-ghost">
          Back to solutions
        </Link>
        <Link href="/kubernetes" className="btn-accent">
          Diagnose a pod
        </Link>
      </div>
    </div>
  );
}
