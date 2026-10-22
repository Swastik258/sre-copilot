import { PLAN_CATALOG } from "@/lib/plans";

const TIERS = PLAN_CATALOG;

export function Pricing({ showHeader = true }: { showHeader?: boolean } = {}) {
  return (
    <section id="pricing" className="border-b border-hairline bg-[var(--bg-subtle)]">
      <div className="shell py-24">
        {/* Header */}
        {showHeader && (
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">Pricing</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-primary">
              Every live capability
              <br />
              is free today.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-secondary">
            No automated changes, no outbound writes, and a full audit trail.
            Pro and Team are planned and not for sale; every live feature is
            included in Free while we finish production readiness.
          </p>
          </div>
        )}

        {/* Tiers */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-strong)] lg:grid-cols-3">
          {TIERS.map((t) => (
            <article
              key={t.name}
              className={`tick relative flex flex-col gap-6 p-6 ${
                t.accent ? "bg-[var(--bg-subtle)]" : "bg-[var(--bg-elevated)]"
              }`}
            >
              {t.accent && (
                <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                  free today
                </span>
              )}

              <header>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-secondary">
                  {t.name}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-serif text-[2.75rem] leading-none tracking-tight text-primary">
                    {t.price}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
                    {t.period}
                  </span>
                </div>
                <p className="mt-4 text-dense text-secondary">{t.blurb}</p>
              </header>

              <div className="rule" />

              <ul className="space-y-2.5 text-dense text-primary">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-1 w-1 shrink-0 rounded-full ${
                        t.accent ? "bg-accent" : "bg-[var(--text-subtle)]"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4">
                <a
                  href={t.cta.href}
                  className={t.accent ? "btn-accent w-full justify-center" : "btn-ghost w-full justify-center"}
                >
                  {t.cta.label}
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Fine print */}
        <p className="mt-8 font-mono text-[10.5px] leading-relaxed text-tertiary">
          No card is required. No payment flow is enabled. Pro and Team are
          published as planned tiers only, and their future limits are not
          active entitlements today.
        </p>
      </div>
    </section>
  );
}
