import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/customers/case-studies" },
  title: "Case studies — Tarn",
  description:
    "Case studies will be published only when a real team has a measured result.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Customers / Case studies"
        title="Case studies, once they are real."
        lead="We will publish a case study only when a design partner has used Tarn on real incidents and agrees to share the result — including the number."
        meta={<StatusText state="disabled">No published studies</StatusText>}
        actions={
          <Link href="/support" className="btn-primary">
            Discuss a design partnership
          </Link>
        }
      />

      <EmptyState
        title="No published studies yet."
        body="Each future study will cover the environment, the failure, the approach, and a measured outcome. Until then, this page stays empty rather than borrowing credibility from a team that has not agreed to be named."
        note="No invented company names, logos, metrics, or quotes."
        actions={
          <>
            <Link href="/customers" className="btn-ghost">
              Back to customers
            </Link>
            <Link href="/product" className="btn-ghost">
              See the product
            </Link>
          </>
        }
      />
    </article>
  );
}
