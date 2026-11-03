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
    <div className="envelope-pricing-page">
      <div className="shell">
        <div className="pricing-packet">
          <header className="pricing-packet-heading">
            <h1>Every live feature is free.</h1>
            <p>
              Kubernetes, CI/CD, investigations, audit export, organizations,
              and API keys are available at no cost. Pro and Team are planned,
              not sold, and not presented as shipped.
            </p>
          </header>

          <section className="pricing-insert" aria-label="Plan pricing and availability">
            <div className="pricing-insert-address">
              <span>Plan details</span>
              <span>No billing / no payment collected</span>
            </div>
            <div className="pricing-table-wrap">
              <table
                className="editorial-table pricing-table"
                aria-label="Plan pricing and availability"
              >
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
                    <tr key={tier.name} data-status={tier.status}>
                      <th scope="row">
                        <span className="pricing-plan-name">{tier.name}</span>
                        <span className="pricing-plan-description">{tier.description}</span>
                      </th>
                      <td data-label="Price and status">
                        <span className="pricing-plan-price">{tier.price}</span>
                        <span className="pricing-plan-cadence">{tier.cadence}</span>
                        <p className="pricing-plan-status" data-status={tier.status}>
                          {tier.status === "available" ? "Free today" : "Planned · not for sale"}
                        </p>
                      </td>
                      <td data-label="Included">
                        <ul className="pricing-features">
                          {tier.features.map((feature) => <li key={feature}>{feature}</li>)}
                        </ul>
                      </td>
                      <td data-label="Availability">
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
            <p className="pricing-billing-note">
              No billing is wired up and no payment is collected. Paid tiers
              remain planned until the features and purchase flow actually
              exist.
            </p>
          </section>

          <aside className="pricing-questions">
            <div>
              <h2>Questions?</h2>
              <p>
                Need a self-hosted deployment, a security review, or a
                design-partner arrangement? Use the support page and tell us
                what you are trying to run. We do not claim certifications or
                customer outcomes that have not been independently verified.
              </p>
            </div>
            <Link href="/support" className="envelope-action-secondary">
              Contact support
            </Link>
          </aside>
          <div className="pricing-packet-edge">
            <span>Availability is stated as shipped</span>
            <span className="packet-seal">TARN / PRICING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
