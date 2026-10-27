import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/ui";

const SURFACES = {
  assistant: {
    name: "AI Assistant",
    href: "/assistant",
    title: "A clearer answer to “what changed?”",
    summary:
      "Tarn keeps an incident conversation tied to its evidence, so teams can ask why something failed without losing the trail behind the answer.",
    challenge:
      "Incident questions often span dashboards, logs, and chat history. The useful context gets scattered just when the team needs to compare what it knows.",
    value:
      "Tarn grounds responses in evidence already attached to an investigation and separates observed facts from ranked hypotheses.",
    points: [
      { icon: "chat", title: "Keep investigation context together", body: "Questions, evidence, and answers stay connected to one saved investigation." },
      { icon: "graph", title: "Make reasoning reviewable", body: "See which observations support a conclusion and where uncertainty remains." },
      { icon: "lock", title: "Keep operators in control", body: "The assistant has no infrastructure tools and does not execute remediation." },
    ],
  },
  kubernetes: {
    name: "Kubernetes",
    href: "/kubernetes",
    title: "Understand the pod before changing it.",
    summary:
      "Tarn brings pod status, events, and container logs into one evidence-backed diagnosis, helping operators move from symptoms to a clear next check.",
    challenge:
      "A failing workload can leave its story spread across status fields, event streams, and previous container logs. Gathering those clues by hand slows triage.",
    value:
      "Tarn connects those read-only observations, cites the source for each fact, and keeps suggested next steps review-only.",
    points: [
      { icon: "k8s", title: "Connect the relevant signals", body: "Bring workload state, events, and logs into one focused investigation." },
      { icon: "graph", title: "Separate facts from hypotheses", body: "Review what the cluster reported alongside possible explanations." },
      { icon: "lock", title: "Diagnose without mutation", body: "Inspect infrastructure without applying changes to your cluster." },
    ],
  },
  logs: {
    name: "Logs",
    href: "/logs",
    title: "Find the first useful signal in noisy logs.",
    summary:
      "Tarn groups repeated log messages into readable signatures and helps teams focus on when a failure first appeared and what evidence supports it.",
    challenge:
      "During an incident, repeated messages and long stack traces can hide the first meaningful error and make it hard to compare what changed.",
    value:
      "Tarn organizes a bounded log stream into useful patterns, preserves evidence references, and redacts sensitive values before returning results.",
    points: [
      { icon: "logs", title: "Reduce repetition", body: "Group similar messages so recurring noise is easier to scan." },
      { icon: "route", title: "Trace the first occurrence", body: "Focus review on where a signature appeared and how it developed." },
      { icon: "shield", title: "Keep evidence safer", body: "Redact secrets from evidence and keep raw log handling local." },
    ],
  },
  metrics: {
    name: "Metrics",
    href: "/metrics",
    title: "Put a metric change in incident context.",
    summary:
      "Tarn helps teams inspect bounded Prometheus signals alongside operational events, making it easier to see what changed without mistaking timing for causation.",
    challenge:
      "A chart can show when a service shifted, but it rarely explains what else happened or whether the timing is meaningful.",
    value:
      "Tarn makes a read-only metric query easier to review in context and keeps correlation distinct from a proven cause.",
    points: [
      { icon: "graph", title: "Review focused time windows", body: "Keep metric inspection bounded to the interval that matters." },
      { icon: "route", title: "Compare with operational events", body: "Bring deploy and incident events into the same review." },
      { icon: "check", title: "Avoid false certainty", body: "Treat a correlation as a clue, not proof of causation." },
    ],
  },
  runbooks: {
    name: "Runbooks",
    href: "/runbooks",
    title: "Make the next safe check easier to find.",
    summary:
      "Tarn makes read-only triage guidance easier to search and follow, helping operators move through a consistent investigation without hiding the decision points.",
    challenge:
      "Useful operational guidance often lives in scattered documents or in the memory of the person who handled the last incident.",
    value:
      "Tarn organizes triage sequences around symptoms and categories while leaving every remediation decision with the operator.",
    points: [
      { icon: "book", title: "Find relevant guidance", body: "Search triage sequences by symptom or operational area." },
      { icon: "check", title: "Follow clear inspection steps", body: "Keep read-only checks distinct from any state-changing action." },
      { icon: "users", title: "Make knowledge shareable", body: "Give the team a consistent starting point during on-call." },
    ],
  },
  cicd: {
    name: "CI/CD",
    href: "/cicd",
    title: "See where a pipeline failed and why.",
    summary:
      "Tarn helps operators review GitHub Actions failures by connecting the run, failed job, step, and relevant log evidence in one place.",
    challenge:
      "A red pipeline identifies a failure, but teams still need to find the failing step and understand what the logs actually establish.",
    value:
      "Tarn narrows the review to the failed workflow evidence without re-running, cancelling, or changing the pipeline.",
    points: [
      { icon: "cicd", title: "Locate the failing step", body: "Move from a workflow run to the job and step that need attention." },
      { icon: "logs", title: "Focus on relevant output", body: "Review bounded log excerpts as part of the diagnosis." },
      { icon: "lock", title: "Keep pipeline state untouched", body: "Investigations are read-only; Tarn does not trigger workflow actions." },
    ],
  },
  terraform: {
    name: "Terraform",
    href: "/terraform",
    title: "Understand a plan before anyone applies it.",
    summary:
      "Tarn translates Terraform plan changes into a clearer review of replacements, deletions, and potential blast radius.",
    challenge:
      "A plan can contain a mix of routine updates and consequential replacements. Those risks are easy to miss in a large machine-readable diff.",
    value:
      "Tarn highlights the changes operators should review while keeping plan analysis separate from Terraform execution.",
    points: [
      { icon: "layers", title: "Summarize change intent", body: "Make creates, updates, replacements, and deletions easier to review." },
      { icon: "shield", title: "Surface consequential changes", body: "Draw attention to destructive or stateful-resource risk." },
      { icon: "lock", title: "Keep apply out of scope", body: "Tarn reviews plans; it does not run Terraform or apply changes." },
    ],
  },
  "infra-code": {
    name: "Infrastructure Code",
    href: "/infra-code",
    title: "Start with safer infrastructure proposals.",
    summary:
      "Tarn can generate a reviewable baseline for common infrastructure resources, with policy notes that make important defaults visible.",
    challenge:
      "Starting an infrastructure definition from scratch can leave reliability and security details to be filled in later—or overlooked entirely.",
    value:
      "Tarn creates a proposal to inspect and adapt, while keeping repository writes and deployment firmly in the operator’s hands.",
    points: [
      { icon: "code", title: "Get a structured starting point", body: "Generate common Kubernetes resources and Terraform modules." },
      { icon: "shield", title: "Review important defaults", body: "See policy notes alongside the generated proposal." },
      { icon: "lock", title: "Keep changes proposal-only", body: "Nothing is written to a repository or applied by Tarn." },
    ],
  },
  audit: {
    name: "Audit",
    href: "/audit",
    title: "Keep a clearer record of investigation decisions.",
    summary:
      "Tarn helps teams understand what was asked, which policy decisions were recorded, and what redacted outcome followed.",
    challenge:
      "After an incident, it can be difficult to reconstruct what was investigated, what evidence was considered, and why a decision was made.",
    value:
      "Tarn provides a durable, reviewable trail that supports accountability without replacing your organization’s governance process.",
    points: [
      { icon: "book", title: "Preserve investigation context", body: "Keep a record of questions and outcomes for later review." },
      { icon: "shield", title: "Make policy decisions visible", body: "Understand the decision recorded alongside an investigation." },
      { icon: "lock", title: "Keep sensitive values redacted", body: "Review outcomes without exposing secrets in the evidence trail." },
    ],
  },
} satisfies Record<
  string,
  {
    name: string;
    href: string;
    title: string;
    summary: string;
    challenge: string;
    value: string;
    points: { icon: IconName; title: string; body: string }[];
  }
>;

type SurfaceSlug = keyof typeof SURFACES;

export function generateStaticParams() {
  return Object.keys(SURFACES).map((surface) => ({ surface }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surface: string }>;
}): Promise<Metadata> {
  const { surface } = await params;
  if (!Object.hasOwn(SURFACES, surface)) return {};
  const content = SURFACES[surface as SurfaceSlug];
  return {
    alternates: { canonical: `/product/${surface}` },
    title: `${content.name} — Tarn`,
    description: content.summary,
  };
}

export default async function ProductSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;
  if (!Object.hasOwn(SURFACES, surface)) notFound();
  const content = SURFACES[surface as SurfaceSlug];

  return (
    <div className="shell py-16 sm:py-20">
      <div className="mb-8 flex items-center gap-2 text-sm text-[var(--text-subtle)]">
        <Link href="/product" className="transition-colors hover:text-[var(--text)]">
          Product
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--text-muted)]">{content.name}</span>
      </div>

      <div className="product-surface-hero grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-16">
        <header className="max-w-3xl">
          <h1 className="heading-display text-4xl text-[var(--text)] sm:text-5xl lg:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg sm:leading-8">
            {content.summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={content.href} className="btn-accent">
              Explore {content.name}
            </Link>
            <Link href="/product" className="btn-ghost">
              All product surfaces
            </Link>
          </div>
        </header>

        <aside className="surface-margin-note">
          <span className="label-caps">Why Tarn</span>
          <h2 className="mt-4 text-2xl text-[var(--text)]">
            {content.challenge}
          </h2>
          <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm leading-6 text-[var(--text-muted)]">
            {content.value}
          </p>
        </aside>
      </div>

      <section className="surface-detail mt-16 border-t border-[var(--border)] pt-10 sm:mt-20 sm:pt-12">
        <div className="mb-7 max-w-2xl">
          <h2 className="heading-display mt-3 text-2xl text-[var(--text)] sm:text-3xl">
            Evidence to inspect, decisions left to your team.
          </h2>
        </div>
        <ul className="surface-points-list">
          {content.points.map((point) => (
            <li key={point.title}>
              <span className="surface-point-icon"><Icon name={point.icon} className="size-4" /></span>
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
