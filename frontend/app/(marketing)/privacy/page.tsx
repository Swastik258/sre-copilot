import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, PageHeader, StatusText } from "@/components/editorial";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy — Tarn",
  description:
    "What this deployment stores, where investigation data goes, and how to exercise retention controls.",
};

export default function Page() {
  return (
    <article className="shell">
      <PageHeader
        label="Privacy"
        title="No ad analytics. Keys stay server-side."
        lead="This page describes the data handled by a self-hosted deployment. The operator of this instance is responsible for its retention settings, AI-provider configuration, and any legal notices required in their jurisdiction."
        meta={<StatusText state="live">No tracking SDK</StatusText>}
        actions={
          <Link href="/security" className="btn-primary">
            Read the security controls
          </Link>
        }
      />

      <LegalLayout scope="Self-hosted deployment" lastReviewed="2026-10-26">
        <h2>What the application stores</h2>
        <p>
          Account details, workspace membership, saved investigations, evidence,
          audit events, and API-key metadata are stored in the deployment
          database. A raw log-analysis paste is size-validated, redacted, and
          processed without being persisted by the analysis endpoint. Saved
          investigations persist the evidence they contain until the operator&rsquo;s
          retention policy removes them or the account is deleted.
        </p>

        <h2>Cookies and sessions</h2>
        <p>
          Authentication uses an HttpOnly session cookie and a readable CSRF
          cookie. OAuth, when enabled, uses a short-lived state cookie. Session
          tokens are stored hashed, and sessions have idle and absolute expiry.
          The application does not ship an advertising pixel, analytics SDK, or
          third-party tracking script.
        </p>

        <h2>Optional AI providers</h2>
        <p>
          External AI providers are contacted only when configured. Tarn sends
          redacted evidence summaries and the operator&rsquo;s question; AI privacy
          mode blocks that transmission. Integration and AI credentials are read
          on the backend and are never returned to the browser bundle. Review the
          configured provider&rsquo;s data policy before enabling it.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Audit retention is configurable by the operator. Database backups and
          any optional error or trace exporters are also controlled by the
          operator; exporters carry operational metadata, not advertising
          identifiers. Accounts can be deleted from settings, subject to the
          deployment&rsquo;s documented retention and backup behavior.
        </p>

        <h2>What this page cannot promise</h2>
        <p>
          This application is not a certified data processor and does not
          provide a jurisdiction-specific privacy notice. If you operate it for
          an organization or the public, replace these notes with terms reviewed
          for your legal, security, and support obligations.
        </p>

        <div className="surface-detail-actions">
          <Link href="/security" className="link-editorial">
            Read the security page
          </Link>
          <Link href="/support">Ask a privacy question</Link>
          <Link href="/terms">Read the terms</Link>
        </div>
      </LegalLayout>
    </article>
  );
}
