// Marketing content that is factual about the repository. Do not add customer
// names, quotes, or outcome metrics without written permission and a source.

export const INTEGRATION_SURFACES = [
  { name: "Kubernetes", mark: "K8s" },
  { name: "GitHub Actions", mark: "GH" },
  { name: "Terraform", mark: "TF" },
  { name: "Prometheus", mark: "P" },
  { name: "PostgreSQL", mark: "PG" },
  { name: "OpenTelemetry", mark: "OTel" },
  { name: "SMTP", mark: "SMTP" },
  { name: "Sentry", mark: "S" },
] as const;

export const DESIGN_PARTNER_QUESTIONS = [
  {
    title: "Did the evidence match reality?",
    body: "We compare the cited observations with what the operator saw during the incident, including the facts that were missing.",
  },
  {
    title: "What was missing from the diagnosis?",
    body: "The next adapter, rule, or evidence source should come from a real gap, not a roadmap guess.",
  },
  {
    title: "Would you page with it?",
    body: "We will publish a named result only after a design partner uses the product on real incidents and agrees to share it.",
  },
] as const;
