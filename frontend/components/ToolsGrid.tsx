export function ToolsGrid() {
  return (
    <section className="border-b border-hairline bg-ink-950/30">
      <div className="mx-auto max-w-wide px-6 py-24">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">Tools</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-paper-50">
              Six surfaces,
              <br />
              one console.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-paper-300">
            Each card is a real view of one integration. No mock dashboards —
            the same panel ships inside the app. Everything below is demo data,
            clearly labeled.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-px bg-hairline-strong lg:grid-cols-2">
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

function ToolCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: string;
  children: React.ReactNode;
}) {
  return (
    <article className="tick flex flex-col gap-4 bg-ink-900 p-6">
      <header className="flex items-baseline justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-100">
          {title}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper-400">
          {subtitle}
        </span>
      </header>

      <div className="overflow-hidden rounded border border-hairline bg-ink-950">
        {children}
      </div>

      <footer className="font-mono text-[10.5px] leading-relaxed text-paper-400">
        {footer}
      </footer>
    </article>
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
          <span className="truncate font-mono text-[11.5px] text-paper-200">
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
              r.tone === "bad" ? "text-signal-bad" : "text-paper-300"
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
      <div className="text-paper-400">2026-10-10T22:41:09Z INFO  server boot</div>
      <div className="text-signal-bad">
        2026-10-10T22:41:11Z ERROR connect db: getaddrinfo ENOTFOUND db
      </div>
      <div className="text-paper-400">    at Pool.connect (pg/pool.js:198)</div>
      <div className="text-signal-bad">
        2026-10-10T22:41:11Z ERROR process exited code=1
      </div>
      <div className="pt-1 text-[10.5px] text-paper-400">
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
        <span className="font-mono text-[11.5px] text-paper-200">build</span>
        <span className="dot dot-good" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-paper-300">
          passed · 42s
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-paper-200">test</span>
        <span className="dot dot-good" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-paper-300">
          passed · 1m 12s
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-paper-200">deploy</span>
        <span className="dot dot-bad" />
        <span className="w-[8rem] text-right font-mono text-[11px] text-signal-bad">
          failed · 8s
        </span>
      </div>
      <div className="px-4 py-3 font-mono text-[11px] text-paper-400">
        <span className="text-signal-bad">error</span> Link to #install has no
        matching heading
      </div>
    </div>
  );
}

/* ---------- Preview: Terraform ---------- */

function TerraformPreview() {
  return (
    <div className="space-y-1 px-4 py-3 font-mono text-[11px] leading-relaxed">
      <div className="text-signal-bad">
        <span className="opacity-70">-/+</span> aws_db_instance.primary
      </div>
      <div className="pl-4 text-paper-400">~ engine_version: "15.4" → "15.6"</div>
      <div className="pl-4 text-paper-400">~ storage_gb:     100   → 200</div>
      <div className="pt-1 text-signal-bad">
        <span className="opacity-70">-</span>   aws_db_snapshot.legacy
      </div>
      <div className="pt-2 text-[10.5px] text-paper-400">
        1 replacement · 1 deletion · 0 additions
      </div>
    </div>
  );
}

/* ---------- Preview: Assistant ---------- */

function AssistantPreview() {
  return (
    <div className="space-y-3 px-4 py-3 text-[11.5px] leading-relaxed">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper-400">
        question
      </div>
      <div className="text-paper-200">Why is api-7d9f8b6c4-x2k9p failing?</div>
      <div className="pt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper-400">
        observed
      </div>
      <div className="text-paper-200">
        CrashLoopBackOff · 14 restarts in 6m · last exit code 1
      </div>
      <div className="pt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper-400">
        hypothesis
      </div>
      <div className="text-paper-200">
        Missing <code className="text-amber-500">DATABASE_URL</code> — process
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
          <span className="text-paper-400">{r.time}</span>
          <span className="text-paper-400">{r.actor}</span>
          <span className="truncate text-paper-200">{r.action}</span>
          <span
            className={
              r.decision === "allow" ? "text-signal-good" : "text-signal-bad"
            }
          >
            {r.decision}
          </span>
        </div>
      ))}
    </div>
  );
}