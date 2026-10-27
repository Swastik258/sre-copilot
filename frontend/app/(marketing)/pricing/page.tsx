import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, StatusText } from "@/components/editorial";
import { PLAN_CATALOG } from "@/lib/plans";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "Pricing — Tarn",
  description:
    "Every live Tarn capability is free during launch. Pro and Team are planned, unpriced, and not sold.",
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
    <article className="shell">
      <PageHeader
        label="Pricing"
        title="Every live feature is free."
        lead="Kubernetes, logs, CI/CD, Terraform, investigations, audit export, organizations, and API keys are available at no cost. Pro and Team are planned, not sold, and not presented as shipped."
        meta={<StatusText state="live">Free is available</StatusText>}
        actions={
          <Link href="/sign-up" className="btn-primary">
            Create an account
          </Link>
        }
      />

      <div className="pricing-table-wrap mt-4">
        <table className="pricing-table">
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
                <th scope="row" data-label="Plan">
                  <span>{tier.name}</span>
                  <span>{tier.description}</span>
                </th>
                <td data-label="Price and status">
                  <span>{tier.price}</span>
                  <span>{tier.cadence}</span>
                  <p>
                    {tier.status === "available"
                      ? "Free during launch. No card."
                      : "Planned. No price has been set."}
                  </p>
                </td>
                <td data-label="Included">
                  <ul>
                    {tier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </td>
                <td data-label="Availability">
                  <Link
                    href={tier.href}
                    className={tier.highlight ? "link-editorial" : "btn-ghost btn-small"}
                  >
                    {tier.cta}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="pricing-notes" aria-labelledby="pricing-notes-title">
        <div>
          <p className="section-label">The billing boundary</p>
          <h2 id="pricing-notes-title">Nothing here takes a payment.</h2>
        </div>
        <div className="pricing-notes__body">
          <p>
            No billing provider is wired up and no payment is collected. The
            Free plan reflects the capabilities currently implemented in this
            repository. Pro and Team are placeholders for future work, with no
            price and no purchase flow.
          </p>
          <p>
            A future paid tier will need a real catalog, entitlements, tax and
            invoicing behavior, and support commitments before it can be sold.
            Until then, the correct state is “planned.”
          </p>
          <p>
            Need a self-hosted deployment, a security review, or a design-partner
            arrangement? Use the support page and state what you are trying to
            run. Tarn does not claim certifications, customer outcomes, or
            uptime that have not been independently verified.
          </p>
          <div className="surface-detail-actions">
            <Link href="/support" className="link-editorial">
              Ask a deployment question
            </Link>
            <Link href="/security">Read the security page</Link>
          </div>
        </div>
      </section>
    </article>
  );
}
