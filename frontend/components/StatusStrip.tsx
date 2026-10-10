const SURFACES = [
  {
    label: "Kubernetes",
    detail: "prod · 42 workloads",
    status: "good" as const,
    stat: "All healthy",
  },
  {
    label: "Logs",
    detail: "3 sources · 24h window",
    status: "warn" as const,
    stat: "2 patterns",
  },
  {
    label: "CI/CD",
    detail: "GitHub Actions · main",
    status: "bad" as const,
    stat: "1 failed",
  },
  {
    label: "Terraform",
    detail: "last plan 12m ago",
    status: "warn" as const,
    stat: "1 destroy",
  },
  {
    label: "AI provider",
    detail: "mock · local",
    status: "good" as const,
    stat: "Ready",
  },
  {
    label: "Audit",
    detail: "session · today",
    status: "idle" as const,
    stat: "0 writes",
  },
];

const DOT_CLASS: Record<string, string> = {
  good: "dot-good",
  warn: "dot-warn",
  bad: "dot-bad",
  idle: "dot-idle",
};

export function StatusStrip() {
  return (
    <section className="border-y border-hairline bg-ink-950/40">
      <div className="mx-auto max-w-wide px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="label-caps">Watched surfaces</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper-400">
            read-only · demo mode
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-hairline-strong sm:grid-cols-3 lg:grid-cols-6">
          {SURFACES.map((s) => (
            <div
              key={s.label}
              className="tick bg-ink-900 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className={`dot ${DOT_CLASS[s.status]} animate-pulse-soft`} />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper-300">
                  {s.label}
                </span>
              </div>
              <div className="mt-2 text-[12.5px] text-paper-100">{s.stat}</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-paper-400">
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}