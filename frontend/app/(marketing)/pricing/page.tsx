import type { Metadata } from "next";
import Link from "next/link";

import { PLAN_CATALOG } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing — SRE Copilot",
  description:
    "Every live SRE Copilot capability is free during launch. Paid tiers are planned, not sold.",
};

const TIERS = PLAN_CATALOG.map((plan) => ({
  name: plan.name,
  price: plan.price,
  cadence: plan.period,
  description: plan.blurb,
  features: plan.features,
  cta: plan.cta.label,
  href: plan.cta.href,
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

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={`${tier.highlight ? "card-soft" : "card"} flex flex-col p-8`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--text)]">
                {tier.name}
              </h2>
              {tier.highlight && (
                <span className="badge badge-neutral">Free today</span>
              )}
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-serif text-4xl text-[var(--text)]">
                {tier.price}
              </span>
              <span className="text-xs text-[var(--text-subtle)]">
                {tier.cadence}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {tier.description}
            </p>

            <ul className="mt-8 space-y-3 text-sm text-[var(--text-muted)]">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--signal-good)]">+</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href={tier.href}
                className={tier.highlight ? "btn-accent w-full" : "btn-ghost w-full"}
              >
                {tier.cta}
              </Link>
            </div>
          </article>
        ))}
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
