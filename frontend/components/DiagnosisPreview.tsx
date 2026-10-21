"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/* Evidence typed in character by character, with per-segment styling kept. */
const EVIDENCE: { text: string; className?: string }[] = [
  { text: "CrashLoopBackOff", className: "text-bad" },
  { text: " — 14 restarts in 6m\n" },
  { text: "Last state: ", className: "text-tertiary" },
  { text: "exit code 1 · OOMKilled=false\n" },
  { text: "Event: ", className: "text-tertiary" },
  { text: "Back-off restarting failed container" },
];

const EVIDENCE_LEN = EVIDENCE.reduce((n, s) => n + s.text.length, 0);

export function DiagnosisPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "-80px" });
  const reduce = usePrefersReducedMotion();

  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(EVIDENCE_LEN);
      return;
    }
    let n = 0;
    const id = window.setInterval(() => {
      n += 2;
      setShown(Math.min(n, EVIDENCE_LEN));
      if (n >= EVIDENCE_LEN) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  const typing = shown < EVIDENCE_LEN;

  function renderEvidence(limit: number) {
    let remaining = limit;
    return EVIDENCE.map((seg, i) => {
      const take = Math.max(0, Math.min(seg.text.length, remaining));
      remaining -= take;
      return (
        <span key={i} className={seg.className}>
          {seg.text.slice(0, take)}
        </span>
      );
    });
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div aria-hidden className="glow glow-amber -inset-x-10 -top-8 h-40 opacity-70" />

      <div className="card preview-lift relative overflow-hidden rounded-[4px]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-hairline bg-[var(--bg-subtle)] px-4 py-3.5">
          <span className="size-2 rounded-full bg-bad" />
          <span className="size-2 rounded-full bg-warn" />
          <span className="size-2 rounded-full bg-good" />
          <span className="ml-2 truncate font-mono text-[10px] text-tertiary sm:text-[11px]">
            diagnosis · namespace=prod · pod=api-7d9f8b6c4-x2k9p
          </span>
          <span className="ml-auto hidden rounded-full border border-warn bg-accent-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent sm:inline">
            demo
          </span>
        </div>

        {/* body */}
        <div className="grid gap-5 p-5 text-left sm:grid-cols-[1.2fr_1fr] sm:p-6">
          <div className="space-y-4">
            <Section label="Observed evidence">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-primary">
                {renderEvidence(shown)}
                {typing && (
                  <span className="ml-0.5 inline-block h-3 w-[6px] translate-y-[1px] animate-pulse bg-accent align-middle" />
                )}
              </pre>
            </Section>

            <Section label="Hypothesis">
              <p className="text-[12.5px] leading-relaxed text-secondary">
                Container exits before the readiness probe passes. Likely missing
                <code className="mx-1 rounded bg-[var(--bg-subtle)] px-1 py-0.5 font-mono text-[11px] text-accent">
                  DATABASE_URL
                </code>
                — process fails on first DB connect.
              </p>
            </Section>

            <Section label="Confidence">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--border-strong)]">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: reduce || inView ? "78%" : 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 1.1, ease: "easeOut", delay: 0.35 }
                    }
                  />
                </div>
                <span className="text-[11px] text-tertiary">
                  78% — based on 3 signals
                </span>
              </div>
            </Section>
          </div>

          <div className="space-y-4 border-t border-hairline pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <Section label="Next steps">
              <ul className="space-y-2 font-mono text-[11.5px] text-primary">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  kubectl describe pod api-7d9f8b6c4-x2k9p -n prod
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  kubectl logs --previous -n prod api-7d9f8b6c4-x2k9p
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
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

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary">
        {label}
      </div>
      {children}
    </div>
  );
}
