export function DiagnosisPreview() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-4xl">
      {/* glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 h-48 rounded-full bg-gradient-to-r from-accent/30 via-accent-2/20 to-sky-400/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
          <span className="ml-3 text-[11px] font-mono text-white/40">
            diagnosis · namespace=prod · pod=api-7d9f8b6c4-x2k9p
          </span>
        </div>

        {/* body */}
        <div className="grid gap-4 p-6 text-left sm:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Section label="Observed evidence">
              <ul className="space-y-1.5 font-mono text-[12px] leading-relaxed text-white/85">
                <li>
                  <span className="text-red-300">CrashLoopBackOff</span> — 14 restarts in 6m
                </li>
                <li>
                  <span className="text-white/60">Last state:</span> exit code 1 · OOMKilled=false
                </li>
                <li>
                  <span className="text-white/60">Event:</span> Back-off restarting failed container
                </li>
              </ul>
            </Section>

            <Section label="Hypothesis">
              <p className="text-[12.5px] leading-relaxed text-white/80">
                Container exits before the readiness probe passes. Likely missing
                <code className="mx-1 rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-white/90">
                  DATABASE_URL
                </code>
                — process fails on first DB connect.
              </p>
            </Section>

            <Section label="Confidence">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-accent to-accent-2" />
                </div>
                <span className="text-[11px] text-white/60">78% — based on 3 signals</span>
              </div>
            </Section>
          </div>

          <div className="space-y-4 sm:border-l sm:border-white/5 sm:pl-6">
            <Section label="Next steps">
              <ul className="space-y-2 text-[12px] text-white/80">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  kubectl describe pod api-7d9f8b6c4-x2k9p -n prod
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  kubectl logs --previous -n prod api-7d9f8b6c4-x2k9p
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Verify Secret refs in Deployment spec
                </li>
              </ul>
            </Section>

            <Section label="Risk">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">
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
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </div>
      {children}
    </div>
  );
}