import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import {
  CTASection,
  Card,
  CheckList,
  FeatureGrid,
  Icon,
  Section,
  StepList,
} from "@/components/ui";

const SURFACES = [
  {
    icon: "k8s" as const,
    title: "Kubernetes",
    body: "Read-only cluster diagnostics. CrashLoopBackOff, OOMKilled, image-pull failures, scheduling, and probe errors — each tied to the exact pod status, event, and log line behind it.",
    meta: "cites pod status · events · previous logs",
    status: "live" as const,
    milestone: "M2",
    href: "/kubernetes",
  },
  {
    icon: "logs" as const,
    title: "Logs",
    body: "Group and deduplicate noisy log streams, surface the first occurrence and the stack trace, and correlate a spike with the deploy that caused it.",
    meta: "first occurrence · timestamps · stack traces",
    status: "planned" as const,
    milestone: "M5",
    href: "/logs",
  },
  {
    icon: "cicd" as const,
    title: "CI/CD",
    body: "Explain why a GitHub Actions run failed: the failing step, the correlated commit, and whether the failure is new or chronic.",
    meta: "failing step · correlated commit",
    status: "planned" as const,
    milestone: "M5",
    href: "/cicd",
  },
  {
    icon: "terraform" as const,
    title: "Terraform",
    body: "Turn a plan into plain language: what is created, changed, replaced, or destroyed, the blast radius, and a review checklist before you apply.",
    meta: "replacements · deletions · blast radius",
    status: "planned" as const,
    milestone: "M6",
    href: "/terraform",
  },
  {
    icon: "code" as const,
    title: "Infrastructure code",
    body: "Generate and validate manifests and modules against policy, with diffs and reasons — always reviewable, never applied automatically.",
    meta: "generate · validate · review",
    status: "planned" as const,
    milestone: "M6",
    href: "/infra-code",
  },
  {
    icon: "assistant" as const,
    title: "AI Assistant",
    body: "Ask in plain language. The model may only call a fixed set of read operations with validated arguments, and every answer separates facts from hypotheses.",
    meta: "facts vs hypotheses · confidence · next steps",
    status: "planned" as const,
    milestone: "M3",
    href: "/assistant",
  },
];

const PRINCIPLES = [
  {
    icon: "eye" as const,
    title: "Evidence before conclusions",
    body: "Every diagnosis lists the observed facts it is built from, and each fact links to the exact resource and payload that produced it.",
  },
  {
    icon: "lock" as const,
    title: "Read-only by default",
    body: "Connectors can list, get, and read. They cannot exec, delete, patch, or apply. The Kubernetes client has no mutating methods at all — enforced in tests.",
  },
  {
    icon: "shield" as const,
    title: "Redact secrets",
    body: "Credentials, bearer tokens, and private keys are stripped server-side before anything is stored, logged, or sent to a model.",
  },
  {
    icon: "flag" as const,
    title: "Approve every change",
    body: "Remediation is proposed as a described, reversible action with a rollback and a verification step. Nothing is applied without explicit human approval.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect a surface",
    body: "Point SRE Copilot at a Kubernetes context, a GitHub repository, a Terraform plan, or a log file. Each connector is read-only by default.",
    meta: "kubeconfig · GitHub token · plan.json · local file",
  },
  {
    n: "02",
    title: "Ask, or let it notice",
    body: "Ask a question in plain language, or let the status ring pull your attention when a watched surface changes.",
    meta: "k8s.pods.get · k8s.events.list · gh.workflow.runs · tf.plan.parse",
  },
  {
    n: "03",
    title: "Read the evidence, approve a change",
    body: "Answers split into observed facts, hypotheses, and next steps. Proposed changes arrive as a described action — you approve each one, and the decision is recorded.",
    meta: "observed · hypothesis · confidence · next steps · audit event",
  },
];

export default function ProductPage() {
  return (
    <>
      <PageShell
        eyebrow="Product"
        title="One console for infrastructure diagnosis"
        subtitle="SRE Copilot watches the surfaces where reliability breaks — clusters, logs, pipelines, and infrastructure code — and explains what it finds with cited evidence rather than confident guesses."
        actions={
          <>
            <Link href="/assistant" className="btn-accent">
              Open the console
              <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/docs" className="btn-ghost">
              Read the docs
            </Link>
          </>
        }
      >
        <Section
          eyebrow="Surfaces"
          title={
            <>
              Six surfaces,
              <br />
              one evidence model.
            </>
          }
          lead="Each surface is a real integration with the same contract: read-only calls, structured evidence, and diagnoses that separate what is known from what is suspected. Kubernetes is live today; the rest ship against the roadmap."
        >
          <FeatureGrid items={SURFACES} />
        </Section>

        <Section
          eyebrow="Principles"
          title="What never changes"
          lead="These are enforced in code and covered by tests, not marketing promises. If the implementation ever disagrees with this page, the implementation wins."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <Card key={p.title} hover className="flex gap-4 p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-hairline-strong bg-ink-800 text-amber-400">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h3 className="font-serif text-lg text-paper-50">{p.title}</h3>
                  <p className="mt-1.5 text-dense text-paper-300">{p.body}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="How it works"
          title="From signal to a decision you can defend"
          lead="The model never has shell access. It can only request specific, allowlisted operations through validated schemas, and a separate policy layer checks each request before any tool runs."
        >
          <StepList steps={STEPS} />

          <div className="mt-10 grid grid-cols-1 gap-8 border-t border-hairline pt-8 lg:grid-cols-2">
            <div>
              <div className="label-caps">What you get on every run</div>
              <div className="mt-5">
                <CheckList
                  items={[
                    "Observed facts, each with a stable evidence id",
                    "Ranked hypotheses with confidence and reasoning",
                    "Read-only next steps and any missing evidence",
                    "Approval-gated remediation with rollback notes",
                  ]}
                />
              </div>
            </div>
            <div>
              <div className="label-caps">What it will not do</div>
              <div className="mt-5">
                <CheckList
                  items={[
                    "Run arbitrary shell commands or model-written code",
                    "Change cluster, pipeline, or cloud state on its own",
                    "Send unredacted secrets to a model or the audit log",
                    "Present fixture data without a clear demo label",
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            See it on a real
            <br />
            failing pod.
          </>
        }
        body="The demo ships with a labelled fixture cluster — a crash-looping API pod, an OOMKilled worker, an image-pull failure, and a pending deployment. Diagnose them without a cluster or a key."
        primary={{ label: "Open Kubernetes diagnostics", href: "/kubernetes" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
        note="KUBERNETES_ENABLED=true KUBERNETES_DEMO_MODE=true"
      />
    </>
  );
}
