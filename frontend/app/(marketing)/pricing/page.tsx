import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — SRE Copilot",
  description:
    "Three flat tiers for a local-first, read-only SRE investigation tool.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "For individuals evaluating a local-first diagnosis workflow.",
    features: [
      "Local accounts",
      "Kubernetes diagnosis",
      "Labelled demo fixtures",
      "Documentation and source",
    ],
    cta: "Start free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    description: "For an engineer who wants the full investigation workspace.",
    features: [
      "Everything in Free",
      "Log analysis when it ships",
      "Terraform plan explainer when it ships",
      "Priority support",
    ],
    cta: "Start free",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Team",
    price: "Contact",
    cadence: "custom",
    description: "For a team standardizing evidence across environments.",
    features: [
      "Everything in Pro",
      "Shared workspaces when they ship",
      "SSO when it ships",
      "Onboarding support",
    ],
    cta: "Talk to us",
    href: "mailto:hello@srecopilot.dev",
    highlight: false,
  },
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Pricing</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Flat tiers. No usage metering.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        Start with the live Kubernetes surface. Paid tiers are reserved for
        capabilities that are actually shipped, not for promises.
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
                <span className="badge badge-neutral">Recommended</span>
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
        Pricing is illustrative for this reference implementation. No billing is
        wired up, and no paid feature is presented as shipped before it exists.
      </p>

      <div className="card mt-24 p-8">
        <span className="label-caps">Questions</span>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          Need a self-hosted deployment, a security review, or a design-partner
          arrangement? Use the support page and tell us what you are trying to
          run.
        </p>
        <Link href="/support" className="btn-ghost mt-6">
          Contact support
        </Link>
      </div>
    </div>
  );
}
