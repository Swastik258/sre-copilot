import { ToolCard } from "@/components/ToolCard";

export function ToolsGrid() {
  return (
    <section className="border-b border-hairline bg-[var(--bg-subtle)]">
      <div className="shell py-24">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">Tools</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-primary">
              Six surfaces,
              <br />
              one console.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-secondary">
            Each card is a real view of one integration. No mock dashboards —
            the same panel ships inside the app. Everything below is demo data,
            clearly labeled.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ToolCard
            title="Kubernetes"
            subtitle="Read-only · namespace scoped"
            footer="cites pod status, events, previous logs"
          >
            <KubernetesPreview />
          </ToolCard>

          <ToolCard
            title="Logs"
            subtitle="Grouped and deduplicated"
            footer="first occurrence, timestamps, stack traces"
          >
            <LogsPreview />
          </ToolCard>

          <ToolCard
            title="CI/CD"
            subtitle="GitHub Actions"
            footer="failing step, correlated commit"
          >
            <CicdPreview />
          </ToolCard>

          <ToolCard
            title="Terraform"
            subtitle="Plan explainer"
            footer="destructive changes, blast radius, review checklist"
          >
            <TerraformPreview />
          </ToolCard>

          <ToolCard
            title="AI Assistant"
            subtitle="Evidence-first answers"
            footer="facts vs hypotheses, confidence, next steps"
          >
            <AssistantPreview />
          </ToolCard>

          <ToolCard
            title="Audit"
            subtitle="Every action, quietly recorded"
            footer="actor, resource, decision, sanitized outcome"
          >
            <AuditPreview />
          </ToolCard>
        </div>
      </div>
    </section>
  );
}

/* ---------- Preview: Kubernetes ---------- */

function KubernetesPreview() {
  const rows = [
    { name: "api-7d9f8b6c4-x2k9p", status: "CrashLoopBackOff", tone: "bad" },
    { name: "web-5c6b7d8e9-4jq2m", status: "Running", tone: "good" },
    { name: "worker-0", status: "Running", tone: "good" },
    { name: "cron-prune-28471920", status: "Completed", tone: "idle" },
  ];
  return (
    <div className="divide-y divide-hairline">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
          <span className="truncate font-mono text-[11.5px] text-primary">
            {r.name}
          </span>
          <span
            className={`dot ${
              r.tone === "bad"
                ? "dot-bad"
                : r.tone === "good"
                  ? "dot-good"
                  : "dot-idle"
            }`}
          />
          <span
            className={`w-[9rem] shrink-0 text-right font-mono text-[11px] ${
              r.tone === "bad"
                ? "text-bad"
                : r.tone === "good"
                  ? "text-good"
                  : "text-tertiary"
            }`}
          >
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Preview: Logs ---------- */

function LogsPreview() {
  return (
    <div className="space-y-1 px-4 py-3 font-mono text-[11px] leading-relaxed">
      <div className="text-tertiary">2026-10-10T22:41:09Z INFO  server boot</div>
      <div className="text-bad">
        2026-10-10T22:41:11Z ERROR connect db: getaddrinfo ENOTFOUND db
      </div>
      <div className="text-tertiary">    at Pool.connect (pg/pool.js:198)</div>
      <div className="text-bad">
        2026-10-10T22:41:11Z ERROR process exited code=1
      </div>
      <div className="pt-1 text-[10.5px] text-tertiary">
        grouped · 14 occurrences · first seen 22:41:11Z
      </div>
    </div>
  );
}

/* ---------- Preview: CI/CD ---------- */

function CicdPreview() {
  return (
    <div className="divide-y divide-hairline">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-primary">build</span>
        <span className="dot dot-good" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-good">
          passed · 42s
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-primary">test</span>
        <span className="dot dot-good" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-good">
          passed · 1m 12s
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-primary">deploy</span>
        <span className="dot dot-bad" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-bad">
          failed · 8s
        </span>
      </div>
      <div className="px-4 py-3 font-mono text-[11px] text-tertiary">
        <span className="text-bad">error</span> Link to #install has no
        matching heading
      </div>
    </div>
  );
}

/* ---------- Preview: Terraform ---------- */

function TerraformPreview() {
  return (
    <div className="space-y-1 px-4 py-3 font-mono text-[11px] leading-relaxed">
      <div className="text-warn">
        <span className="opacity-70">-/+</span> aws_db_instance.primary
      </div>
      <div className="pl-4 text-tertiary">~ engine_version: "15.4" → "15.6"</div>
      <div className="pl-4 text-tertiary">~ storage_gb:     100   → 200</div>
      <div className="pt-1 text-bad">
        <span className="opacity-70">-</span>   aws_db_snapshot.legacy
      </div>
      <div className="pt-2 text-[10.5px] text-warn">
        1 replacement · 1 deletion · 0 additions
      </div>
    </div>
  );
}

/* ---------- Preview: Assistant ---------- */

function AssistantPreview() {
  return (
    <div className="space-y-3 px-4 py-3 text-[11.5px] leading-relaxed">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-tertiary">
        question
      </div>
      <div className="text-primary">Why is api-7d9f8b6c4-x2k9p failing?</div>
      <div className="pt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-tertiary">
        observed
      </div>
      <div className="text-primary">
        CrashLoopBackOff · 14 restarts in 6m · last exit code 1
      </div>
      <div className="pt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-tertiary">
        hypothesis
      </div>
      <div className="text-primary">
        Missing <code className="text-accent">DATABASE_URL</code> — process
        exits before readiness probe.
      </div>
    </div>
  );
}

/* ---------- Preview: Audit ---------- */

function AuditPreview() {
  const rows = [
    { time: "22:41:02", actor: "you", action: "k8s.pods.list", decision: "allow" },
    { time: "22:41:05", actor: "you", action: "k8s.events.get", decision: "allow" },
    { time: "22:41:08", actor: "you", action: "k8s.logs.previous", decision: "allow" },
    { time: "22:41:11", actor: "ai", action: "tool:redact", decision: "allow" },
    { time: "22:41:11", actor: "ai", action: "tool:propose", decision: "deny" },
  ];
  return (
    <div className="divide-y divide-hairline font-mono text-[11px]">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[3.5rem_2.5rem_1fr_3.5rem] gap-3 px-4 py-2">
          <span className="text-tertiary">{r.time}</span>
          <span className="text-tertiary">{r.actor}</span>
          <span className="truncate text-primary">{r.action}</span>
          <span
            className={
              r.decision === "allow" ? "text-good" : "text-bad"
            }
          >
            {r.decision}
          </span>
        </div>
      ))}
    </div>
  );
}
