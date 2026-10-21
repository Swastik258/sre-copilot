import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui";

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "lock",
    title: "Read-only by construction",
    body: "The Kubernetes client cannot issue mutations — diagnosis never changes your cluster.",
  },
  {
    icon: "graph",
    title: "Evidence before conclusions",
    body: "Every hypothesis links to the raw signals behind it, so you can check the reasoning.",
  },
  {
    icon: "bolt",
    title: "Runs locally, offline",
    body: "Demo mode needs no keys and no paid AI service. Bring your own provider when ready.",
  },
];

/** Two-column auth chrome: an editorial brand panel beside the form card. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="grid-overlay" />
      <div aria-hidden className="glow glow-amber -left-24 -top-32 h-80 w-80" />

      <div className="shell relative py-16 sm:py-20">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* Brand panel */}
          <div className="order-2 lg:order-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-base font-semibold text-primary"
            >
              <span className="grid size-8 place-items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-accent">
                SC
              </span>
              <span className="tracking-[-0.02em]">SRE Copilot</span>
            </Link>

            <h2 className="mt-8 font-serif text-display tracking-tight text-primary">
              Diagnose with evidence,
              <br />
              not guesswork.
            </h2>
            <p className="mt-5 max-w-prose text-dense-lg text-secondary">
              An AI SRE copilot for Kubernetes, logs, CI/CD, and Terraform. It reads,
              correlates, and explains — and it tells you exactly which evidence each
              conclusion rests on.
            </p>

            <ul className="mt-10 space-y-5">
              {POINTS.map((point) => (
                <li key={point.title} className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-accent">
                    <Icon name={point.icon} className="size-5" />
                  </span>
                  <div>
                    <div className="text-dense-lg font-medium text-primary">
                      {point.title}
                    </div>
                    <p className="mt-1 max-w-prose text-dense text-tertiary">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="order-1 lg:order-2">
            <div className="card auth-card-lift p-7 sm:p-9">
              {children}
            </div>
            <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
              Passwords are hashed · sessions use an HttpOnly cookie
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
