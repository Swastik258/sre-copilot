import Link from "next/link";
import { DESIGN_PARTNER_QUESTIONS, INTEGRATION_SURFACES } from "@/data/homepage";
import { FAQ } from "@/components/FAQ";
import { Reveal } from "@/components/Reveal";

export function IntegrationSurfaces() {
  return (
    <section className="trusted-teams" aria-label="Integration surfaces">
      <div className="shell py-9 sm:py-11">
        <p className="label-caps text-center">Integration surfaces</p>
        <div className="placeholder-client-grid mt-7">
          {INTEGRATION_SURFACES.map((surface) => (
            <div key={surface.name} className="trusted-logo">
              <span className="trusted-logo-mark">{surface.mark}</span>
              <span>{surface.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
          Adapter availability depends on deployment configuration
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
                <span className="label-caps">Design-partner program</span>
                <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
                  Built for calmer on-call.
                </h2>
              </div>
              <span className="sample-data-label">No published customer stories yet</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {DESIGN_PARTNER_QUESTIONS.map((question, index) => (
                <Reveal key={question.title} delay={index * 0.09} className="h-full">
                  <article className="testimonial-card card h-full">
                    <p className="relative text-sm font-semibold leading-7 text-[var(--text)]">
                      {question.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                      {question.body}
                    </p>
                    <div className="mt-7 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                      <span className="testimonial-avatar" aria-hidden="true">
                        0{index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">
                          Evaluation question
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          Design partner · not a testimonial
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
                    <h3>Proposal-only changes</h3>
                    <p>Generated infrastructure changes are never written or applied by the product.</p>
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

      <IntegrationSurfaces />

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
              <span className="sample-data-label">Supported adapters · configured per deployment</span>
            </div>
            <div className="integrations-grid">
              {INTEGRATION_SURFACES.map((integration, index) => (
                <Reveal key={integration.name} delay={index * 0.045}>
                  <div className="integration-tile">
                    <span className="integration-mark" aria-hidden="true">
                      {integration.mark}
                    </span>
                    <span>{integration.name}</span>
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
                  Start with a labelled demo. Deploy when you’re ready.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                  Explore local demo mode first, then choose the deployment setup that fits your team.
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
