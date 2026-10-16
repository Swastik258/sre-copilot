import { PageShell } from "@/components/PageShell";
import { Badge, CTASection, Card, Section } from "@/components/ui";

const RELEASES = [
  {
    version: "v0.2.0",
    label: "Current",
    date: "Milestone 2",
    title: "Read-only Kubernetes diagnosis",
    points: [
      "Normalized Kubernetes models and a structurally read-only client (no mutating methods; enforced by a test).",
      "Deterministic rules for CrashLoopBackOff, OOMKilled, image-pull failures, Pending/Unschedulable, probe failures, and non-zero exits.",
      "Evidence-backed diagnoses: confirmed observations vs. ranked hypotheses, each citing stable evidence ids.",
      "REST endpoints under /api/v1/kubernetes plus a functional diagnosis console at /kubernetes.",
      "Labelled demo fixtures — crash loop, OOM kill, image-pull failure, pending, and a healthy pod.",
    ],
  },
  {
    version: "v0.1.0",
    label: "",
    date: "Milestone 1",
    title: "Foundation & evidence model",
    points: [
      "Fixed two latent bugs that meant the database was never touched: an empty initial migration and a broken ORM relationship.",
      "Validated configuration, structured logging with request ids, and a uniform JSON error envelope.",
      "Server-side redaction of secrets, request-size limits, and optional rate limiting.",
      "Typed schemas for evidence, investigations, health, and integrations; a live integration-status API.",
      "Hardened Dockerfiles, CI, and a full documentation set.",
    ],
  },
  {
    version: "v0.0.1",
    label: "",
    date: "Initial",
    title: "Scaffold",
    points: [
      "FastAPI health shell and a Next.js marketing site.",
      "No investigation engine, adapters, evidence model, or tests of substance.",
    ],
  },
];

const NEXT = [
  { milestone: "M3", title: "Assistant & investigation engine", body: "Investigation persistence, a messages API, and mock/OpenAI/Anthropic behind one schema-validated interface." },
  { milestone: "M4", title: "Saved, citable investigations", body: "Resume, export, and cross-reference investigations." },
  { milestone: "M5", title: "Logs & CI/CD", body: "Log grouping and GitHub Actions failure analysis." },
];

export default function ChangelogPage() {
  return (
    <>
      <PageShell
        eyebrow="Changelog"
        title="What actually shipped"
        subtitle="Milestones, in order, each tied to tested code. If a feature is listed as planned elsewhere, it is not here until it is merged and passing."
      >
        <Section eyebrow="Releases" title="Shipped milestones">
          <div className="space-y-4">
            {RELEASES.map((r) => (
              <Card key={r.version} className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-paper-50">{r.version}</span>
                  {r.label && <Badge tone="good">{r.label}</Badge>}
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
                    {r.date}
                  </span>
                </div>
                <h2 className="mt-3 font-serif text-xl text-paper-50">{r.title}</h2>
                <ul className="mt-4 space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-3 text-dense text-paper-300">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Section>

        <Section eyebrow="Next" title="On the roadmap" lead="Planned work, stated plainly so it is not mistaken for shipped functionality.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {NEXT.map((n) => (
              <Card key={n.milestone} className="p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-500">
                  {n.milestone}
                </div>
                <h3 className="mt-2 font-serif text-lg text-paper-50">{n.title}</h3>
                <p className="mt-1.5 text-dense text-paper-300">{n.body}</p>
              </Card>
            ))}
          </div>
        </Section>
      </PageShell>

      <CTASection
        title={
          <>
            Try what is
            <br />
            already live.
          </>
        }
        body="Kubernetes diagnosis is shipped and runs on labelled demo fixtures. Everything else is clearly marked planned."
        primary={{ label: "Diagnose a pod", href: "/kubernetes" }}
        secondary={{ label: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
