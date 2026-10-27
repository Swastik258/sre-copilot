import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog — Tarn",
  description:
    "Engineering notes on evidence-backed infrastructure diagnosis. No posts yet.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Blog"
        title="Engineering notes, when there are notes."
        lead="No posts yet. When there is something worth explaining — a read-only adapter, an evidence contract, a diagnosis that failed — it will live here."
        meta={<StatusText state="disabled">No published posts</StatusText>}
        actions={
          <>
            <Link href="/docs" className="btn-primary">
              Read the docs
            </Link>
            <Link href="/changelog" className="btn-ghost">
              View the changelog
            </Link>
          </>
        }
      />

      <EmptyState
        title="We are not padding the index with SEO filler."
        body="In the meantime, the docs describe the architecture and the changelog records what actually shipped. A post will be published when it can show a real decision, a real failure, or a real implementation detail worth checking."
        note="No invented thought leadership."
        actions={
          <>
            <Link href="/docs" className="btn-ghost">
              Architecture and setup
            </Link>
            <Link href="/changelog" className="btn-ghost">
              What shipped
            </Link>
          </>
        }
      />
    </article>
  );
}
