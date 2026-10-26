import type { Metadata } from "next";
import Link from "next/link";

import { PLAN_CATALOG } from "@/lib/plans";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "Pricing — Tarn",
  description:
    "Every live Tarn capability is free during launch. Paid tiers are planned, not sold.",
};

const TIERS = PLAN_CATALOG.map((plan) => ({
  name: plan.name,
  price: plan.price,
  cadence: plan.period,
  description: plan.blurb,
  features: plan.features,
  cta: plan.cta.label,
  href: plan.cta.href,
  status: plan.status,
  highlight: plan.accent,
}));

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Pricing</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Every live feature is free.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Kubernetes, CI/CD, investigations, audit export, organizations, and API
        keys are available at no cost. Pro and Team are planned, not sold, and
        not presented as shipped.
      </p>

      <div className="pricing-table-wrap mt-12">
        <table className="editorial-table pricing-table">
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">Price and status</th>
              <th scope="col">Included</th>
              <th scope="col">Availability</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => (
              <tr key={tier.name}>
                <th scope="row">
                  <span className="font-serif text-2xl text-[var(--text)]">{tier.name}</span>
                  <span className="mt-2 block font-normal text-[var(--text-muted)]">{tier.description}</span>
                </th>
                <td>
                  <span className="font-serif text-2xl text-[var(--text)]">{tier.price}</span>
                  <span className="ml-2 text-sm text-[var(--text-subtle)]">{tier.cadence}</span>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {tier.status === "available" ? "Free today" : "Planned · not for sale"}
                  </p>
                </td>
                <td>
                  <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
                    {tier.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                </td>
                <td>
                  <Link
                    href={tier.href}
                    className={tier.highlight ? "btn-accent" : "link-editorial"}
                  >
                    {tier.cta}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs leading-5 text-[var(--text-subtle)]">
        No billing is wired up and no payment is collected. Paid tiers remain
        planned until the features and purchase flow actually exist.
      </p>

      <div className="card mt-24 p-8">
        <span className="label-caps">Questions</span>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          Need a self-hosted deployment, a security review, or a design-partner
          arrangement? Use the support page and tell us what you are trying to
          run. We do not claim certifications or customer outcomes that have not
          been independently verified.
        </p>
        <Link href="/support" className="btn-ghost mt-6">
          Contact support
        </Link>
      </div>
    </div>
  );
}
