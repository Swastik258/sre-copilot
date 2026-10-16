import { Icon } from "@/components/ui";

export function DiagnosisPreview() {
  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="glow glow-amber -inset-x-10 -top-8 h-40 opacity-60"
      />

      <div className="card relative overflow-hidden rounded-2xl shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-hairline bg-white/[0.02] px-4 py-3.5">
          <span className="size-2 rounded-full bg-signal-bad/80" />
          <span className="size-2 rounded-full bg-signal-warn/80" />
          <span className="size-2 rounded-full bg-signal-good/80" />
          <span className="ml-2 truncate font-mono text-[10px] text-paper-400 sm:text-[11px]">
            diagnosis · namespace=prod · pod=api-7d9f8b6c4-x2k9p
          </span>
          <span className="ml-auto hidden rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300 sm:inline">
            demo
          </span>
        </div>

        {/* body */}
        <div className="grid gap-5 p-5 text-left sm:grid-cols-[1.2fr_1fr] sm:p-6">
          <div className="space-y-4">
            <Section label="Observed evidence">
              <ul className="space-y-1.5 font-mono text-[12px] leading-relaxed text-paper-100">
                <li>
                  <span className="text-signal-bad">CrashLoopBackOff</span> — 14 restarts in 6m
                </li>
                <li>
                  <span className="text-paper-400">Last state:</span> exit code 1 · OOMKilled=false
                </li>
                <li>
                  <span className="text-paper-400">Event:</span> Back-off restarting failed container
                </li>
              </ul>
            </Section>

            <Section label="Hypothesis">
              <p className="text-[12.5px] leading-relaxed text-paper-200">
                Container exits before the readiness probe passes. Likely missing
                <code className="mx-1 rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-amber-300">
                  DATABASE_URL
                </code>
                — process fails on first DB connect.
              </p>
            </Section>

            <Section label="Confidence">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
                </div>
                <span className="text-[11px] text-paper-400">78% — based on 3 signals</span>
              </div>
            </Section>
          </div>

          <div className="space-y-4 border-t border-hairline pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <Section label="Next steps">
              <ul className="space-y-2 font-mono text-[11.5px] text-paper-200">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                  kubectl describe pod api-7d9f8b6c4-x2k9p -n prod
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                  kubectl logs --previous -n prod api-7d9f8b6c4-x2k9p
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                  Verify Secret refs in Deployment spec
                </li>
              </ul>
            </Section>

            <Section label="Risk">
              <span className="badge badge-good">
                <Icon name="lock" className="size-3" />
                Read-only · no changes proposed
              </span>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-400">
        {label}
      </div>
      {children}
    </div>
  );
}
