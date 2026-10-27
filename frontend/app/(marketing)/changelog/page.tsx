import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/changelog" },
  title: "Changelog — Tarn",
  description:
    "What changed in Tarn, including the clear-water design system and public diagnosis demo.",
};

const ENTRIES = [
  {
    date: "2026-10-26",
    iso: "2026-10-26",
    state: "working" as const,
    title: "Clear-water redesign",
    items: [
      "Adds one token source for ink, bone, glacial, amber, and brick, plus shared editorial primitives.",
      "Rebuilds the homepage around an interactive five-scenario diagnosis artifact and removes the legacy customer, trust, integration, pricing, and FAQ appendix.",
      "Replaces the green status pills with plain status text, fixes the navigation dropdown backdrop, and removes the blank scroll-reveal gap.",
      "Adds saved rules-engine snapshots for Pending and failing-probe scenarios. The demo remains no-signup and read-only.",
    ],
  },
  {
    date: "2026-10-22",
    iso: "2026-10-22",
    state: "shipped" as const,
    title: "Production-readiness release",
    items: [
      "Argon2id passwords, tenant-aware roles, CSRF, lockout, recovery, and email verification.",
      "Durable retrying jobs, encrypted job payloads, audit retention, and account deletion.",
      "Request IDs, structured logs, health/readiness, Prometheus metrics, and optional tracing.",
      "Non-root images, local and production Compose, Helm, optional Terraform, and protected deploy/rollback workflows.",
      "Live-status marketing copy, SEO metadata, sitemap/robots, and accessible error states.",
    ],
  },
  {
    date: "2026-10-21",
    iso: "2026-10-21",
    state: "shipped" as const,
    title: "Paper + ink theme",
    items: [
      "Marketing, docs, and auth render on the paper theme.",
      "Product consoles render on the ink theme.",
      "The root layout loads Newsreader, Inter Tight, and JetBrains Mono and wraps the local auth provider.",
      "Clerk imports and the unused package were removed. Authentication is entirely self-hosted.",
    ],
  },
];

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Changelog"
        title="Recent changes, recorded as they land."
        lead="No roadmap fiction. Each entry describes something in the repository, with planned work kept separate."
        meta={<StatusText state="warn">Working copy · not deployed</StatusText>}
      />

      <div className="changelog-list">
        {ENTRIES.map((entry) => (
          <article key={entry.iso} className="changelog-entry">
            <div className="changelog-entry__meta">
              <time dateTime={entry.iso}>{entry.date}</time>
              <StatusText state={entry.state === "working" ? "warn" : "live"}>
                {entry.state === "working" ? "Working copy" : "Shipped"}
              </StatusText>
            </div>
            <div className="changelog-entry__body">
              <h2>{entry.title}</h2>
              <ul>
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-xs leading-5 text-[var(--text-subtle)]">
        Older changes are available in the repository history. Planned work is
        labelled as planned and is not presented as shipped. This changelog does
        not imply a production deployment.
      </p>

      <div className="surface-detail-actions mt-6 border-t border-[var(--border)] pt-5">
        <Link href="/blog" className="link-editorial">
          Read engineering notes
        </Link>
        <Link href="/docs">Read the docs</Link>
      </div>
    </article>
  );
}
