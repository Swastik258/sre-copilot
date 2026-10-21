import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms — SRE Copilot",
  description:
    "Terms for the SRE Copilot reference implementation: no warranty, use at your own risk.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Terms</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        A reference implementation, with no warranty.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        SRE Copilot is provided as-is for evaluation and development. It is not a
        commercial service, and it is not a substitute for your own operational
        judgment.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-8">
          <span className="label-caps">Use</span>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
            You may run, inspect, and modify the implementation. You are
            responsible for the infrastructure you connect, the credentials you
            provide, and the changes you approve.
          </p>
        </div>
        <div className="card p-8">
          <span className="label-caps">Warranty</span>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
            There is no warranty of fitness, availability, or correctness. A
            diagnosis is evidence to review, not an instruction to apply.
          </p>
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        If you deploy this for an organization, replace these notes with terms
        reviewed for your jurisdiction and risk model.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/privacy" className="btn-accent">
          Read the privacy page
        </Link>
        <Link href="/support" className="btn-ghost">
          Ask a question
        </Link>
      </div>
    </div>
  );
}
