import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/solutions/devops" },
  title: "DevOps — Tarn",
  description:
    "Review failing pipelines and risky infrastructure plans before production.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Solutions / DevOps</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Review failures and changes before production.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Pipelines and infrastructure code fail in ways that are hard to read
        under time pressure. Tarn explains a failing run or a risky plan
        in plain language, so review happens before the incident, not after.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <span className="label-caps">CI/CD</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            The step, the line, the commit
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Surface the exact failing step and log line, then correlate it with
            the triggering branch and commit. Read-only on your repository.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Terraform</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Destructive changes, called out
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Translate a plan into creates, replacements, and deletions, with the
            blast radius visible before anyone runs apply.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/solutions" className="btn-ghost">
          Back to solutions
        </Link>
        <Link href="/product" className="btn-accent">
          See the product
        </Link>
      </div>
    </div>
  );
}
