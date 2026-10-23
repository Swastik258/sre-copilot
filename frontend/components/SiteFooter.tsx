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
      { label: "Audit & governance", href: "/audit" },
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
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-[var(--bg-elevated)]">
      <div className="shell py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div>
            <Link href="/" className="flex items-center gap-3 text-base font-semibold text-primary">
              <span className="grid size-8 place-items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] font-mono text-xs font-semibold text-accent">
                T
              </span>
              Tarn
            </Link>
            <p className="mt-4 max-w-sm text-dense text-tertiary">
              Read-only investigation for Kubernetes, logs, CI/CD, and Terraform.
              Evidence-backed diagnoses you can act on — never guesses.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
              <span className="dot dot-idle" />
              Read-only · demo environment
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="label-caps">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-dense text-secondary transition hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
            Tarn · v0.2 · diagnose infrastructure with evidence, not guesses
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
            No API key required to run locally
          </div>
        </div>
      </div>
    </footer>
  );
}
