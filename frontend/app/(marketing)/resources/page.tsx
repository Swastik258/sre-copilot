import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources — SRE Copilot",
  description:
    "Documentation, engineering notes, changelog, and support for SRE Copilot.",
};

const RESOURCES = [
  {
    title: "Docs",
    body: "Local setup, API reference, architecture, security, Kubernetes, and the investigation engine.",
    href: "/docs",
    action: "Read the docs",
  },
  {
    title: "Blog",
    body: "Engineering notes about evidence models, read-only adapters, and diagnosis that can be checked.",
    href: "/blog",
    action: "Read the blog",
  },
  {
    title: "Changelog",
    body: "What shipped, what changed, and what is still labelled planned.",
    href: "/changelog",
    action: "View changes",
  },
  {
    title: "Support",
    body: "Questions, bug reports, design-partner requests, and security disclosures.",
    href: "/support",
    action: "Get support",
  },
];

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Resources</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Notes for people who verify.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        The documentation describes the implementation as it exists. The blog
        and changelog will grow as the evidence model and adapters land.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {RESOURCES.map((resource) => (
          <Link
            key={resource.title}
            href={resource.href}
            className="card card-hover flex flex-col p-6"
          >
            <h2 className="font-serif text-2xl text-[var(--text)]">
              {resource.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {resource.body}
            </p>
            <span className="mt-6 text-sm text-[var(--accent)]">
              {resource.action}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
