export type PlanId = "free" | "pro" | "team";

export type FeatureId =
  | "overview"
  | "kubernetes"
  | "logs"
  | "terraform"
  | "cicd"
  | "history"
  | "settings";

export type FeatureAccess = {
  id: FeatureId;
  label: string;
  href: string;
  routePaths: readonly string[];
  includedIn: readonly PlanId[];
  status: "live" | "planned";
};

export const DEFAULT_PLAN: PlanId = "free";

export const PLANS: Record<PlanId, { name: string }> = {
  free: { name: "Free · full access" },
  pro: { name: "Pro" },
  team: { name: "Team" },
};

export const FEATURES: readonly FeatureAccess[] = [
  { id: "overview", label: "Overview", href: "/dashboard", routePaths: ["/dashboard"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "kubernetes", label: "Kubernetes diagnostics", href: "/kubernetes", routePaths: ["/kubernetes"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "logs", label: "Log analysis", href: "/logs", routePaths: ["/logs"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "terraform", label: "Terraform plan explainer", href: "/terraform", routePaths: ["/terraform"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "cicd", label: "CI/CD", href: "/cicd", routePaths: ["/cicd"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "history", label: "Investigation history", href: "/history", routePaths: ["/history"], includedIn: ["free", "pro", "team"], status: "live" },
  { id: "settings", label: "Settings", href: "/settings", routePaths: ["/settings"], includedIn: ["free", "pro", "team"], status: "live" },
];

export function hasFeatureAccess(plan: PlanId, feature: FeatureId): boolean {
  return FEATURES.find((item) => item.id === feature)?.includedIn.includes(plan) ?? false;
}

export function featureForPath(pathname: string): FeatureAccess | undefined {
  return FEATURES.find((feature) =>
    feature.routePaths.some((path) =>
      pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`)),
    ),
  );
}
