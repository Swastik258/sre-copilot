import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/resources" },
  title: "Resources — Tarn",
  description:
    "Documentation, engineering notes, changelog, and support for Tarn.",
};

const RESOURCES = [
  {
    title: "Docs",
    body: "Local setup, API reference, architecture, security, Kubernetes, and the investigation engine.",
    href: "/docs",
    kind: "Reference",
  },
  {
    title: "Blog",
    body: "Engineering notes about evidence models, read-only adapters, and diagnosis that can be checked. No filler posts.",
    href: "/blog",
    kind: "Notes",
  },
  {
    title: "Changelog",
    body: "What shipped, what changed, and what is still labelled planned.",
    href: "/changelog",
    kind: "History",
  },
  {
    title: "Support",
    body: "Questions, bug reports, design-partner requests, and security disclosures.",
    href: "/support",
    kind: "Contact",
  },
];

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Resources"
        title="Notes for people who verify."
        lead="The documentation describes the implementation as it exists. The changelog records what changed. The blog stays empty until there is something worth explaining."
        meta={<span>No SEO filler index</span>}
      />

      <section className="rail-section" aria-labelledby="resources-list-title">
        <div className="shell rail-section__grid">
          <aside className="rail-section__margin">
            <p className="section-label">Reference shelf</p>
            <p>
              Start with the implementation notes, then check the history. Claims
              in marketing copy can be traced back to one of these surfaces.
            </p>
          </aside>
          <div className="rail-section__body">
            <h2 id="resources-list-title">Read, verify, then decide.</h2>
            <ul className="resource-ledger mt-8">
              {RESOURCES.map((resource) => (
                <li key={resource.title}>
                  <span className="resource-ledger__kind">{resource.kind}</span>
                  <Link href={resource.href}>{resource.title}</Link>
                  <span className="resource-ledger__arrow" aria-hidden="true">↗</span>
                  <p>{resource.body}</p>
                </li>
              ))}
            </ul>
            <div className="surface-detail-actions">
              <Link href="/security" className="link-editorial">
                Read the security controls and gaps
              </Link>
              <Link href="/support">Ask support</Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
