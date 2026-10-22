import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms — SRE Copilot",
  description:
    "Terms for using this SRE Copilot deployment: no warranty, no paid plan, and operator responsibilities.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Terms</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Provided as-is, with no warranty.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        This release does not sell a plan or process payments. Use is subject to
        the repository owner&rsquo;s permission, and the deployment operator is
        responsible for its operation. It is not a substitute for your own
        operational judgment.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-8">
          <span className="label-caps">Use</span>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
            No open-source license is included. Do not copy, deploy, or
            redistribute this implementation outside the permissions granted by
            the repository owner. You are responsible for the infrastructure you
            connect, the credentials you provide, access control, backups,
            retention, and any infrastructure changes you make outside the
            product.
          </p>
        </div>
        <div className="card p-8">
          <span className="label-caps">Warranty</span>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
            There is no warranty of fitness, availability, or correctness. A
            diagnosis is evidence to review, not an instruction to apply. The
            product does not execute infrastructure changes.
          </p>
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        If you operate this for an organization or the public, replace these
        notes with terms reviewed for your jurisdiction, risk model, support
        commitments, and data-processing obligations.
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
