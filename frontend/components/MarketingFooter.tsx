import Link from "next/link";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "AI Assistant", href: "/assistant" },
      { label: "Kubernetes", href: "/kubernetes" },
      { label: "Logs", href: "/logs" },
      { label: "CI/CD", href: "/cicd" },
      { label: "Terraform", href: "/terraform" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Platform teams", href: "/solutions/platform" },
      { label: "SRE on-call", href: "/solutions/sre" },
      { label: "DevOps", href: "/solutions/devops" },
      { label: "Customers", href: "/customers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="shell py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 text-base font-semibold text-[var(--text)]"
            >
              <span className="grid size-8 place-items-center border border-[var(--border-strong)] bg-[var(--bg)] font-mono text-xs font-semibold text-[var(--accent)]">
                SC
              </span>
              SRE Copilot
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
              Read-only investigation for Kubernetes, logs, CI/CD, and
              Terraform. Evidence-backed diagnoses you can act on — never
              guesses.
            </p>
            <div className="mt-6 flex items-center gap-2 label-caps">
              <span className="dot dot-good" />
              Read-only by default
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <div className="label-caps">{column.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center">
          <div className="label-caps">SRE Copilot · v0.2.0</div>
          <div className="label-caps">Self-hosted by design</div>
        </div>
      </div>
    </footer>
  );
}
