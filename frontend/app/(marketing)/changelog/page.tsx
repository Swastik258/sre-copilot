import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/changelog" },
  title: "Changelog — Tarn",
  description:
    "What shipped in Tarn, including the paper and ink design system migration.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Changelog</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Recent changes ship here as they land.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        No roadmap fiction. Each entry describes something that is in the
        repository, with planned work kept separate.
      </p>

      <div className="mt-12 space-y-4">
        <article className="card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="label-caps">2026-10-22</span>
            <span className="badge tag-live">Shipped</span>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Production-readiness release
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>Argon2id passwords, tenant-aware roles, CSRF, lockout, recovery, and email verification.</li>
            <li>Durable retrying jobs, encrypted job payloads, audit retention, and account deletion.</li>
            <li>Request IDs, structured logs, health/readiness, Prometheus metrics, and optional tracing.</li>
            <li>Non-root images, local and production Compose, Helm, optional Terraform, and protected deploy/rollback workflows.</li>
            <li>Live-status marketing copy, SEO metadata, sitemap/robots, and accessible error states.</li>
          </ul>
        </article>

        <article className="card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="label-caps">2026-10-21</span>
            <span className="badge tag-live">Shipped</span>
          </div>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Paper + ink design system
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>Marketing, docs, and auth now render on the paper theme.</li>
            <li>Product consoles now render on the ink theme.</li>
            <li>
              The root layout loads Space Grotesk, Inter, and JetBrains Mono and
              wraps the local auth provider.
            </li>
            <li>
              Clerk imports and the unused package were removed. Authentication
              is entirely self-hosted.
            </li>
          </ul>
        </article>
      </div>

      <p className="mt-8 text-xs leading-5 text-[var(--text-subtle)]">
        Older changes are available in the repository history. Planned work is
        labelled as planned and is not presented as shipped.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/blog" className="btn-accent">
          Read engineering notes
        </Link>
        <Link href="/docs" className="btn-ghost">
          Read the docs
        </Link>
      </div>
    </div>
  );
}
