import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/customers" },
  title: "Customers — SRE Copilot",
  description:
    "An honest look at early adoption: no invented logos, no fabricated testimonials.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Customers</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        No logos yet. No invented quotes either.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        SRE Copilot is early. We would rather show an honest empty state than
        borrow credibility from companies that have not used it.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="card p-8">
          <div className="font-serif text-7xl leading-none text-[var(--text)]">
            —
          </div>
          <div className="label-caps mt-4">Published customers</div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            No customer names, logos, or outcome metrics are published for this
            build. A named reference requires a real deployment and permission.
          </p>
        </div>

        <div className="card p-8">
          <p className="font-serif text-2xl leading-snug text-[var(--text)] md:text-3xl">
            We will not invent logos or testimonials. When real teams use this,
            their approved words will appear here.
          </p>
          <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
            The same rule applies to case studies and quotes. A named result
            requires a real team, a real incident class, and permission to
            publish it.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/customers/case-studies" className="card card-hover p-6">
          <span className="label-caps">Case studies</span>
          <h2 className="mt-3 font-serif text-2xl text-[var(--text)]">
            What a study will contain
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            The environment, the failure, the approach, and a measured result.
          </p>
        </Link>
        <Link href="/customers/testimonials" className="card card-hover p-6">
          <span className="label-caps">Testimonials</span>
          <h2 className="mt-3 font-serif text-2xl text-[var(--text)]">
            Quotes we can attribute
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Named, role-attributed feedback or nothing at all.
          </p>
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/support" className="btn-accent">
          Become a design partner
        </Link>
        <Link href="/product" className="btn-ghost">
          See the product
        </Link>
      </div>
    </div>
  );
}
