import Link from "next/link";
import { CLIENTS, TESTIMONIALS } from "@/data/clients";
import { DemoVideo } from "@/components/DemoVideo";
import { FAQ } from "@/components/FAQ";
import { Reveal } from "@/components/Reveal";
import { SampleMetrics } from "@/components/SampleMetrics";
import { TerminalDiagnosis } from "@/components/TerminalDiagnosis";

const INTEGRATIONS = [
  "Kubernetes",
  "GitHub Actions",
  "Prometheus",
  "Grafana",
  "Loki",
  "ArgoCD",
  "Terraform",
  "AWS",
  "Azure",
];

export function TrustedTeams() {
  return (
    <section className="trusted-teams" aria-label="Placeholder engineering teams">
      <div className="shell py-9 sm:py-11">
        <p className="label-caps text-center">Placeholder engineering teams</p>
        <div className="placeholder-client-grid mt-7">
          {CLIENTS.map((client) => (
            <div key={client.name} className="trusted-logo">
              <span className="trusted-logo-mark">{client.mark}</span>
              <span>{client.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
          Fictional placeholder names
        </p>
      </div>
    </section>
  );
}

export function HomepageSections() {
  return (
    <>
      <Reveal>
        <section id="customers" className="home-testimonials home-section-glow">
          <div className="shell py-20 sm:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div>
                <span className="label-caps">Customer stories</span>
                <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                  Built for calmer on-call.
                </h2>
              </div>
              <span className="sample-data-label">Fictional placeholder testimonials</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial, index) => (
                <Reveal key={testimonial.name} delay={index * 0.09} className="h-full">
                  <article className="testimonial-card card h-full">
                    <span className="testimonial-quote-mark" aria-hidden="true">“</span>
                    <blockquote className="relative text-sm leading-7 text-[var(--text-muted)]">
                      {testimonial.quote}
                    </blockquote>
                    <div className="mt-7 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                      <span className="testimonial-avatar" aria-hidden="true">
                        {testimonial.initial}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">
                          {testimonial.name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {testimonial.role} · {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-video-section">
          <div className="shell py-20 sm:py-24">
            <div className="mx-auto mb-9 max-w-2xl text-center">
              <span className="label-caps">Product walkthrough</span>
              <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                See the investigation come together.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                A short walkthrough of evidence collection, diagnosis, and next steps.
              </p>
            </div>
            <DemoVideo />
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
              Video source is a placeholder and can be replaced at /public/media/sre-copilot-walkthrough.mp4
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-terminal-section home-section-glow">
          <div className="shell grid gap-10 py-20 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
            <div>
              <span className="label-caps">Live incident terminal</span>
              <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                From crash loop to cited cause.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
                A sample diagnosis shows how raw signals become evidence-backed next steps.
              </p>
            </div>
            <TerminalDiagnosis />
          </div>
        </section>
      </Reveal>

      <SampleMetrics />

      <Reveal>
        <section className="home-trust-section">
          <div className="shell py-20 sm:py-24">
            <div className="mb-10 max-w-2xl">
              <span className="label-caps">Security &amp; trust</span>
              <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                Helpful by design. In control by default.
              </h2>
            </div>
            <div className="security-checklist divide-y divide-[var(--border)] p-3 sm:p-5">
              <Reveal delay={0} className="h-full">
                <article className="trust-card flex h-full items-start gap-4 border-0 bg-transparent p-4 shadow-none">
                  <span className="trust-icon" aria-hidden="true">✓</span>
                  <div>
                    <h3>Read-only by default</h3>
                    <p>Investigations gather evidence without writing back to connected infrastructure.</p>
                  </div>
                </article>
              </Reveal>
              <Reveal delay={0.08} className="h-full">
                <article className="trust-card flex h-full items-start gap-4 border-0 bg-transparent p-4 shadow-none">
                  <span className="trust-icon" aria-hidden="true">✓</span>
                  <div>
                    <h3>Approval-gated remediation</h3>
                    <p>Review proposed changes first, with an explicit approval step and rollback path.</p>
                  </div>
                </article>
              </Reveal>
              <Reveal delay={0.16} className="h-full">
                <article className="trust-card flex h-full items-start gap-4 border-0 bg-transparent p-4 shadow-none">
                  <span className="trust-icon" aria-hidden="true">✓</span>
                  <div>
                    <h3>Auditable decisions</h3>
                    <p>Keep a record of investigation decisions and the evidence behind them.</p>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>
      </Reveal>

      <TrustedTeams />

      <Reveal>
        <section className="home-integrations-section">
          <div className="shell py-20 sm:py-24">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
              <div>
                <span className="label-caps">Integrations</span>
                <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                  Meet your infrastructure where it is.
                </h2>
              </div>
              <span className="sample-data-label">Ecosystem overview · availability varies</span>
            </div>
            <div className="integrations-grid">
              {INTEGRATIONS.map((integration, index) => (
                <Reveal key={integration} delay={index * 0.045}>
                  <div className="integration-tile">
                    <span className="integration-mark" aria-hidden="true">
                      {integration.slice(0, 1)}
                    </span>
                    <span>{integration}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="home-pricing-teaser">
          <div className="shell py-16 sm:py-20">
            <div className="pricing-teaser-card">
              <div>
                <span className="label-caps">Simple to get started</span>
                <h2 className="heading-display mt-3 text-3xl text-[var(--text)]">
                  Start with a labelled demo. Scale when you’re ready.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                  Explore local demo mode first, then choose the workspace setup that fits your team.
                </p>
              </div>
              <Link href="/pricing" className="btn-ghost">
                Explore pricing
                <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                  <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <FAQ />
      </Reveal>

      <Reveal>
        <section className="home-final-cta">
          <div className="shell py-16 sm:py-20">
            <div className="final-cta-card">
              <span className="label-caps">Your next investigation</span>
              <h2 className="heading-display mt-4 max-w-3xl text-3xl text-white sm:text-5xl">
                Bring a failing state. Leave with evidence.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
                Start with read-only Kubernetes diagnostics or explore the product surfaces.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/kubernetes" className="btn-accent">Diagnose a pod</Link>
                <Link href="/product" className="btn-glass">Explore the product</Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
