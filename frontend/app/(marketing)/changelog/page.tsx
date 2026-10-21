import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog — SRE Copilot",
  description:
    "What shipped in SRE Copilot, including the paper and ink design system migration.",
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
              The root layout loads Geist, Geist Mono, and Instrument Serif and
              wraps the local auth provider.
            </li>
            <li>
              Clerk imports were removed; the package remains installed but
              unused.
            </li>
            <li>
              Marketing and auth pages were rewritten; product page bodies are
              still on legacy classes.
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
