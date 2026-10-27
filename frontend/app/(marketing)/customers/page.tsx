import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/customers" },
  title: "Customers — Tarn",
  description:
    "An honest look at early adoption: no invented logos, no fabricated testimonials.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Customers"
        title="No logos yet. No invented quotes either."
        lead="Tarn is early. We would rather show an honest empty state than borrow credibility from companies that have not used it."
        meta={<StatusText state="disabled">No published customers</StatusText>}
        actions={
          <>
            <Link href="/support" className="btn-primary">
              Become a design partner
            </Link>
            <Link href="/product" className="btn-ghost">
              See the product
            </Link>
          </>
        }
      />

      <section className="rail-section" aria-labelledby="publication-policy-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Publication policy</p>
            <p>
              A reference belongs to the team that gave it. We publish nothing on
              their behalf without permission.
            </p>
          </aside>
          <div className="rail-section__body">
            <h2 id="publication-policy-title">
              A reference belongs to the team that gave it.
            </h2>
            <p>
              No customer names, logos, testimonials, or outcome metrics are
              published for this build. We will add them only after a real
              deployment and explicit permission.
            </p>
            <div className="ledger-grid mt-8">
              <section>
                <h2>Case studies</h2>
                <ul>
                  <li>Only after a real team has used Tarn on real incidents.</li>
                  <li>Environment, failure, approach, and measured outcome.</li>
                  <li>Including the number, whether or not it flatters us.</li>
                </ul>
                <Link href="/customers/case-studies" className="link-editorial mt-5 inline-block text-sm">
                  What we will document
                </Link>
              </section>
              <section>
                <h2>Testimonials</h2>
                <ul>
                  <li>Attributable by name and role.</li>
                  <li>Feedback collected against specific questions.</li>
                  <li>No anonymous praise or invented quotes.</li>
                </ul>
                <Link href="/customers/testimonials" className="link-editorial mt-5 inline-block text-sm">
                  How feedback will be used
                </Link>
              </section>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
