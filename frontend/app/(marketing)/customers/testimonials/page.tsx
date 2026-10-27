import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/customers/testimonials" },
  title: "Testimonials — Tarn",
  description:
    "No invented testimonials. Named feedback will appear only with permission.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Customers / Testimonials"
        title="Quotes we can attribute, or none at all."
        lead="We do not invent testimonials. When partners are willing to be quoted — by name and role — their words will appear here. For now, this page is an honest empty state."
        meta={<StatusText state="disabled">No published testimonials</StatusText>}
        actions={
          <Link href="/support" className="btn-primary">
            Share feedback
          </Link>
        }
      />

      <EmptyState
        title="No published testimonials yet."
        body="Feedback is collected against specific questions: did the evidence match reality, what was missing, and would you page with it? A quote will only be published with the person's name and role."
        note="No anonymous praise, invented names, or implied endorsements."
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
