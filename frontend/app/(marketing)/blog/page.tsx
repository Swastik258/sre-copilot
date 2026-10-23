import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog — Tarn",
  description:
    "Engineering notes on evidence-backed infrastructure diagnosis. No posts yet.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Blog</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        Engineering notes, when there are notes.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        No posts yet. When there is something worth explaining — a read-only
        adapter, an evidence contract, a diagnosis that failed — it will live
        here.
      </p>

      <div className="card mt-12 p-8 md:p-10">
        <span className="label-caps">Empty state</span>
        <p className="mt-4 max-w-2xl font-serif text-2xl leading-snug text-[var(--text)]">
          We are not padding the index with SEO filler.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          In the meantime, the docs describe the architecture and the changelog
          records what actually shipped.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/docs" className="btn-accent">
            Read the docs
          </Link>
          <Link href="/changelog" className="btn-ghost">
            View the changelog
          </Link>
        </div>
      </div>
    </div>
  );
}
