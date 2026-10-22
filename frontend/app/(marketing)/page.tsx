import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { HomepageSections } from "@/components/HomepageSections";
import { IncidentReplay } from "@/components/IncidentReplay";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "SRE Copilot — Evidence-backed infrastructure diagnosis",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
};

const SURFACES = [
  {
    index: "01",
    title: "Kubernetes diagnostics",
    body: "Read pod status, events, and previous logs through a client with no mutating methods. Every observation is cited.",
    status: "Live",
    live: true,
  },
  {
    index: "02",
    title: "Log analysis",
    body: "Group noisy streams, surface the first occurrence, and keep secrets out of the evidence trail.",
    status: "Live",
    live: true,
  },
  {
    index: "03",
    title: "Terraform plan explainer",
    body: "Translate a plan into creates, replacements, and deletions, with destructive changes called out before apply.",
    status: "Live",
    live: true,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Choose a surface",
    body: "Start with a live Kubernetes cluster or a labelled demo fixture. No write credentials are required.",
  },
  {
    number: "02",
    title: "Collect evidence",
    body: "The read-only client gathers observed facts and links each one to the resource and payload behind it.",
  },
  {
    number: "03",
    title: "Review the diagnosis",
    body: "Review cited next steps and ranked hypotheses. Generated infrastructure changes are proposals only and are never applied.",
  },
];

const INCIDENT_EVENTS = [
  { time: "09:41:08", label: "Pod restart count increased", source: "evidence: pod/status#1" },
  { time: "09:41:12", label: "Previous container log collected", source: "evidence: pod/logs#2" },
  { time: "09:41:16", label: "Missing configuration key observed", source: "evidence: pod/logs#3" },
  { time: "09:41:21", label: "Diagnosis ready for operator review", source: "sample hypothesis" },
];

const showWalkthrough = existsSync(
  path.join(process.cwd(), "public", "media", "sre-copilot-walkthrough.mp4"),
);

export default function Page() {
  return (
    <div className="shell py-10 sm:py-14">
      <section className="home-hero relative isolate overflow-hidden rounded-[1.75rem] border border-[var(--border)] px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div aria-hidden className="home-hero-grid" />
        <div aria-hidden className="home-hero-glow" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="home-hero-copy flex w-full flex-col items-start text-left">
            <span className="eyebrow">
              <span className="status-beacon" />
              Mission control for incidents
            </span>
            <h1 className="heading-display mt-7 max-w-4xl text-[var(--text)] text-5xl sm:text-6xl lg:text-7xl">
              Investigate with evidence.{" "}
              <span>Not guesses.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-muted)] sm:text-lg sm:leading-8">
              Turn a failing state into a structured diagnosis. Keep observed
              facts separate from ranked hypotheses, with every claim tied to
              its evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/assistant" className="btn-accent">
                Start an investigation
                <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                  <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/docs" className="btn-ghost">
                Explore the docs
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <span className="dot dot-good" />
                Read-only by construction
              </span>
              <span className="flex items-center gap-2">
                <span className="dot dot-good" />
                Local accounts
              </span>
              <span className="flex items-center gap-2">
                <span className="dot dot-good" />
                Demo fixtures available
              </span>
            </div>
          </div>

          <div className="home-console-wrap" aria-label="Illustrative diagnosis preview">
            <div className="home-console-orbit" aria-hidden />
            <div className="home-console">
              <div className="home-console-top">
                <div className="flex items-center gap-2">
                  <span className="home-window-dot" />
                  <span className="home-window-dot" />
                  <span className="home-window-dot" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">
                  Animated product preview
                </span>
                <span className="home-console-lock" aria-label="Read only">
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
              <div className="home-console-body">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">
                      Investigation
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">
                      Pod status review
                    </div>
                  </div>
                  <span className="home-demo-tag">Demo fixture</span>
                </div>
                <div className="home-console-rule" />
                <div className="home-evidence-row">
                  <span className="home-evidence-icon">01</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white/90">Observed fact</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-white/65">
                      container status · restart count
                    </div>
                    <span className="home-evidence-chip mt-2">evidence: pod/status#1</span>
                  </div>
                  <span className="home-evidence-check">✓</span>
                </div>
                <div className="home-evidence-row home-evidence-row-delay">
                  <span className="home-evidence-icon">02</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white/90">Cited evidence</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-white/65">
                      pod events · previous logs
                    </div>
                    <span className="home-evidence-chip mt-2">evidence: pod/logs#2</span>
                  </div>
                  <span className="home-evidence-check">✓</span>
                </div>
                <div className="home-diagnosis">
                  <div className="flex items-center gap-2 text-[var(--accent-soft-text)]">
                    <span className="home-diagnosis-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                      H1 / leading hypothesis · sample
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm leading-6 text-white/80">
                      Required configuration may be unavailable. Evidence first; next steps stay review-only.
                    </div>
                    <span className="home-status-ring shrink-0" aria-label="Illustrative status: verified">OK</span>
                  </div>
                </div>
              </div>
              <div className="home-console-foot">
                <span>OBSERVED FACTS</span>
                <span>HYPOTHESES</span>
                <span>NEXT STEPS</span>
              </div>
            </div>
            <div className="home-float-note">
              <span className="home-float-note-mark">↗</span>
              <span>
                <span className="block text-[10px] text-white/65">Every claim</span>
                <span className="mt-0.5 block text-xs font-medium text-white">backed by evidence</span>
              </span>
            </div>
          </div>
        </div>
        <div className="home-hero-index" aria-hidden="true">SC / 01</div>
      </section>

      <div className="signal-divider shell" aria-hidden="true">
        <svg viewBox="0 0 1200 48" preserveAspectRatio="none">
          <path d="M0 24h350l18-10 17 20 18-30 20 40 18-20h240l14-8 15 16 16-24 16 32 15-16h443" />
        </svg>
      </div>

      <Reveal>
        <section aria-labelledby="incident-timeline-title" className="py-8 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label-caps">Signal trace / sample</span>
              <h2 id="incident-timeline-title" className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                One incident. A traceable sequence.
              </h2>
            </div>
            <span className="sample-data-label">Illustrative timeline · not live telemetry</span>
          </div>
          <div className="incident-timeline" tabIndex={0} aria-label="Sample incident timeline. Scroll horizontally to inspect events.">
            {INCIDENT_EVENTS.map((event) => (
              <article className="card p-5" key={event.time}>
                <p className="font-mono text-[10px] text-[var(--accent)]">{event.time}</p>
                <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{event.label}</h3>
                <span className="home-evidence-chip mt-4">{event.source}</span>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-20 sm:mt-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label-caps">Built for real-world operations</span>
              <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                One clear view of the problem.
              </h2>
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-subtle)] sm:block">
              01 — 03 / Surfaces
            </span>
          </div>
          <div className="home-feature-grid grid gap-4 md:grid-cols-3">
            {SURFACES.map((surface, index) => (
              <Reveal key={surface.title} delay={index * 0.08} className="h-full">
                <article className="home-feature-card card flex h-full flex-col p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-[var(--text-subtle)]">
                      {surface.index}
                    </span>
                    <span className={`badge ${surface.live ? "tag-live" : "tag-planned"}`}>
                      <span className={`dot ${surface.live ? "dot-good" : "dot-idle"}`} />
                      {surface.status}
                    </span>
                  </div>
                  <div className="home-feature-mark mt-8" aria-hidden="true">
                    {surface.index === "01" ? "⌘" : surface.index === "02" ? "≋" : "⌁"}
                  </div>
                  <h3 className="mt-5 font-serif text-2xl text-[var(--text)]">
                    {surface.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    {surface.body}
                  </p>
                  <span className="home-feature-line mt-6" aria-hidden="true" />
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      <IncidentReplay />

      <Reveal>
        <section className="home-steps mt-24 border-t border-[var(--border)] pt-12 sm:mt-28 sm:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <span className="label-caps">How it works</span>
              <h2 className="heading-display mt-4 max-w-md text-[var(--text)] text-4xl sm:text-5xl">
                Three steps. No guesswork.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                A calm, repeatable workflow for getting from a noisy incident to
                a next step you can trust.
              </p>
            </div>
            <div className="home-steps-list">
              {STEPS.map((step) => (
                <article key={step.number} className="home-step-row">
                  <span className="home-step-number">{step.number}</span>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                      {step.body}
                    </p>
                  </div>
                  <svg
                    viewBox="0 0 20 20"
                    className="home-step-arrow size-4"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10h12m-5-5 5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-cta card mt-20 overflow-hidden p-7 sm:mt-24 sm:p-12">
          <div aria-hidden className="home-cta-glow" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-end">
            <div>
              <span className="label-caps">Start here</span>
              <h2 className="heading-display mt-4 max-w-2xl text-[var(--text)] text-4xl sm:text-5xl">
                Bring a failing pod. Leave with evidence.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                Kubernetes diagnostics, log analysis, CI/CD investigation, Terraform
                explanations, Prometheus metrics, runbooks, the assistant, audit, and
                proposal-only infrastructure code are available now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/kubernetes" className="btn-accent">
                Diagnose a pod
                <svg
                  viewBox="0 0 20 20"
                  className="size-4"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10h12m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/product" className="btn-ghost">
                See the product
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <HomepageSections showWalkthrough={showWalkthrough} />
    </div>
  );
}
