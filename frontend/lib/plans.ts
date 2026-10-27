export type PlanId = "free" | "pro" | "team";
export type PlanStatus = "available" | "planned";

export type PublicPlan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  blurb: string;
  status: PlanStatus;
  features: readonly string[];
  cta: { label: string; href: string };
  accent: boolean;
};

/**
 * Public plan copy. The backend catalog in `app/core/plans.py` is the source of
 * truth for entitlements. Every live capability is currently included in Free;
 * Pro and Team are clearly marked as planned and are not for sale.
 */
export const PLAN_CATALOG: readonly PublicPlan[] = [
  {
    id: "free",
    name: "Free · full access",
    price: "$0",
    period: "during launch",
    blurb: "Every live capability, with no card and no seat limit.",
    status: "available",
    features: [
      "Kubernetes read-only diagnostics",
      "GitHub Actions failure analysis",
      "Deterministic diagnosis with optional AI",
      "Investigations, audit log, and CSV export",
      "Organizations, roles, and API keys",
      "Operator-controlled self-hosted deployment",
    ],
    cta: { label: "Get started", href: "/sign-up" },
    accent: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Planned",
    period: "not for sale",
    blurb:
      "A future paid tier for individual operators and advanced integrations.",
    status: "planned",
    features: [
      "Everything in Free",
      "Future connectors that are not shipped yet",
      "Future higher usage limits",
      "No automatic infrastructure changes, ever",
    ],
    cta: { label: "Read the roadmap", href: "/changelog" },
    accent: true,
  },
  {
    id: "team",
    name: "Team",
    price: "Planned",
    period: "not for sale",
    blurb:
      "A future shared-workspace tier for platform and SRE teams.",
    status: "planned",
    features: [
      "Everything in Pro",
      "Shared workspaces are available in Free today",
      "Future SSO, policy, and billing controls",
      "No compliance claim without an audit",
    ],
    cta: { label: "Contact support", href: "/support" },
    accent: false,
  },
];

export function planById(id: string): PublicPlan | undefined {
  return PLAN_CATALOG.find((plan) => plan.id === id);
}
