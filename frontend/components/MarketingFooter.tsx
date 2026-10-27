import Link from "next/link";
import Image from "next/image";

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
    <footer className="marketing-footer border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="shell py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div>
            <Link
              href="/"
              className="site-brand flex items-center text-base font-semibold text-[var(--text)]"
            >
              <Image className="wordmark-paper" src="/tarn-wordmark.svg" alt="Tarn" width={118} height={36} />
              <Image className="wordmark-ink" src="/tarn-wordmark-ink.svg" alt="" width={118} height={36} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
              Evidence-backed diagnosis for infrastructure failures.
            </p>
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
          <div className="label-caps">Tarn</div>
          <div className="label-caps">Built for infrastructure teams</div>
        </div>
        <div className="footer-wordmark" aria-hidden="true">Tarn</div>
      </div>
    </footer>
  );
}
