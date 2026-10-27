import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms — Tarn",
  description:
    "Terms for using this Tarn deployment: no warranty, no paid plan, and operator responsibilities.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Terms"
        title="Provided as-is, with no warranty."
        lead="This release does not sell a plan or process payments. Use is subject to the repository owner's permission, and the deployment operator is responsible for its operation. It is not a substitute for your own operational judgment."
        meta={<StatusText state="neutral">No paid plan</StatusText>}
        actions={
          <Link href="/privacy" className="btn-primary">
            Read the privacy page
          </Link>
        }
      />

      <LegalLayout scope="Repository use and deployment" lastReviewed="2026-10-26">
        <h2>Use</h2>
        <p>
          No open-source license is included. Do not copy, deploy, or
          redistribute this implementation outside the permissions granted by
          the repository owner. You are responsible for the infrastructure you
          connect, the credentials you provide, access control, backups,
          retention, and any infrastructure changes you make outside the
          product.
        </p>

        <h2>No warranty</h2>
        <p>
          There is no warranty of fitness, availability, or correctness. A
          diagnosis is evidence to review, not an instruction to apply. The
          product does not execute infrastructure changes, re-run pipelines, or
          run Terraform.
        </p>

        <h2>Plans and payment</h2>
        <p>
          Every implemented surface is available on the Free plan during launch.
          Pro and Team are planned tiers, are not for sale, and have no price.
          No billing provider is wired up and no payment is collected.
        </p>

        <h2>Third-party services</h2>
        <p>
          If the operator configures an AI provider, source-control connection,
          or observability integration, that service&rsquo;s terms and data policy
          also apply. Tarn does not control those services and does not make
          availability or compliance claims on their behalf.
        </p>

        <h2>Operator responsibility</h2>
        <p>
          If you operate this for an organization or the public, replace these
          notes with terms reviewed for your jurisdiction, risk model, support
          commitments, and data-processing obligations. Do not present this
          sample text as legal advice.
        </p>

        <div className="surface-detail-actions">
          <Link href="/privacy" className="link-editorial">
            Read the privacy page
          </Link>
          <Link href="/support">Ask a question</Link>
          <Link href="/security">Read the security page</Link>
        </div>
      </LegalLayout>
    </article>
  );
}
