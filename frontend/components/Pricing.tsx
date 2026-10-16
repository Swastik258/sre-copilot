const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Local mode. No signup, no API keys, no cluster needed.",
    cta: { label: "Run it locally", href: "/docs" },
    features: [
      "Demo mode with fixtures",
      "Log analysis on uploaded files",
      "Terraform plan explanation",
      "Single-user, local database",
      "Bring your own AI key (optional)",
    ],
    accent: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    blurb: "Connect real clusters, repos, and pipelines. One workspace.",
    cta: { label: "Start 14-day trial", href: "/assistant" },
    features: [
      "Everything in Free",
      "Kubernetes read-only access",
      "GitHub Actions failure analysis",
      "Conversation history and saved investigations",
      "Audit log with export",
      "Priority email support",
    ],
    accent: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "per month",
    blurb: "Shared workspace, policies, and SSO for platform teams.",
    cta: { label: "Talk to us", href: "/support" },
    features: [
      "Everything in Pro",
      "Up to 10 seats",
      "Shared saved investigations",
      "Policy engine with custom allowlists",
      "SSO (SAML, OIDC)",
      "Roadmap input",
    ],
    accent: false,
  },
];

export function Pricing({ showHeader = true }: { showHeader?: boolean } = {}) {
  return (
    <section id="pricing" className="border-b border-hairline bg-ink-950/30">
      <div className="shell py-24">
        {/* Header */}
        {showHeader && (
          <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">Pricing</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-paper-50">
              Read-only is free.
              <br />
              You pay for reach.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-paper-300">
            Every tier keeps the same promise: no automated changes, no
            outbound writes, and a full audit trail. Paid tiers add
            connectors, seats, and shared workspace.
          </p>
          </div>
        )}

        {/* Tiers */}
        <div className="grid grid-cols-1 gap-px bg-hairline-strong lg:grid-cols-3">
          {TIERS.map((t) => (
            <article
              key={t.name}
              className={`tick relative flex flex-col gap-6 p-6 ${
                t.accent ? "bg-ink-850" : "bg-ink-900"
              }`}
            >
              {t.accent && (
                <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-500">
                  most useful
                </span>
              )}

              <header>
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-300">
                  {t.name}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-serif text-[2.75rem] leading-none tracking-tight text-paper-50">
                    {t.price}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-400">
                    {t.period}
                  </span>
                </div>
                <p className="mt-4 text-dense text-paper-300">{t.blurb}</p>
              </header>

              <div className="rule" />

              <ul className="space-y-2.5 text-dense text-paper-200">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-1 w-1 shrink-0 rounded-full ${
                        t.accent ? "bg-amber-500" : "bg-paper-400"
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
        <p className="mt-8 font-mono text-[10.5px] leading-relaxed text-paper-400">
          Prices in USD. No card required for Free. Pro and Team can be
          cancelled any time — the audit log and saved investigations stay
          readable after cancellation.
        </p>
      </div>
    </section>
  );
}