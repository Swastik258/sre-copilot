import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/customers/case-studies" },
  title: "Case studies — Tarn",
  description:
    "Case studies will be published only when a real team has a measured result.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Customers / Case studies</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Case studies, once they are real.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        We will publish a case study only when a design partner has used SRE
        Copilot on real incidents and agrees to share the result — including the
        number.
      </p>

      <div className="card mt-12 p-8">
        <span className="label-caps">Status</span>
        <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
          No published studies yet
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Each future study will cover the environment, the failure, the
          approach, and a measured outcome. Until then, this page stays empty
          rather than borrowing credibility.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/customers" className="btn-ghost">
            Back to customers
          </Link>
          <Link href="/support" className="btn-accent">
            Become a partner
          </Link>
        </div>
      </div>
    </div>
  );
}
