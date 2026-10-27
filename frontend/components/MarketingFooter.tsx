import Link from "next/link";
import Image from "next/image";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "All surfaces", href: "/product" },
      { label: "Kubernetes", href: "/kubernetes" },
      { label: "Logs", href: "/logs" },
      { label: "CI/CD", href: "/cicd" },
      { label: "Terraform", href: "/terraform" },
      { label: "Try the demo", href: "/demo" },
    ],
  },
  {
    title: "Practice",
    links: [
      { label: "Platform teams", href: "/solutions/platform" },
      { label: "SRE on-call", href: "/solutions/sre" },
      { label: "DevOps", href: "/solutions/devops" },
      { label: "Security", href: "/security" },
      { label: "Customers", href: "/customers" },
    ],
  },
  {
    title: "Reference",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Resources", href: "/resources" },
      { label: "Changelog", href: "/changelog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Deployment",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="site-footer" data-theme="ink">
      <div className="shell footer-top">
        <div className="footer-brand">
          <Link href="/" aria-label="Tarn home">
            <Image
              src="/tarn-wordmark-ink.svg"
              alt="Tarn"
              width={138}
              height={41}
            />
          </Link>
          <p>
            Read-only investigation for Kubernetes, logs, CI/CD, and Terraform.
            Facts stay attached to their source; hypotheses stay visible as
            hypotheses.
          </p>
          <p className="footer-brand__note">
            Self-hosted. Operator-configured. No customer claims on this page.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.title} className="footer-nav__group">
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="shell footer-bottom">
        <span>Tarn v0.2.0</span>
        <span>Read-only by construction</span>
        <span>No analytics SDK</span>
      </div>
    </footer>
  );
}
