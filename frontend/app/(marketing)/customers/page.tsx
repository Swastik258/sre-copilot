import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/customers" },
  title: "Customers — Tarn",
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
        Tarn is early. We would rather show an honest empty state than
        borrow credibility from companies that have not used it.
      </p>

      <section className="customer-ledger mt-16" aria-label="Publication policy">
        <div>
          <p className="label-caps">Publication policy</p>
          <p className="mt-4 font-serif text-3xl leading-snug text-[var(--text)]">
            A reference belongs to the team that gave it.
          </p>
        </div>
        <div className="customer-ledger-notes">
          <p>
            No customer names, logos, testimonials, or outcome metrics are
            published for this build. We will add them only after a real
            deployment and explicit permission.
          </p>
          <Link href="/customers/case-studies">Case studies — what we will document</Link>
          <Link href="/customers/testimonials">Testimonials — attributable feedback only</Link>
        </div>
      </section>

      <div className="mt-16 flex flex-wrap gap-3">
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
