import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy — SRE Copilot",
  description:
    "What this deployment stores, where investigation data goes, and how to exercise retention controls.",
};

export default function Page() {
  return (
    <div className="shell py-24">
      <span className="label-caps">Privacy</span>
      <h1 className="heading-display mt-6 text-[var(--text)] text-5xl md:text-6xl">
        No ad analytics. Keys stay server-side.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        This page describes the data handled by a self-hosted deployment. The
        operator of this instance is responsible for its retention settings,
        AI-provider configuration, and any legal notices required in their
        jurisdiction.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <span className="label-caps">Analytics</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            None
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            The app does not ship an analytics SDK, advertising pixel, or
            third-party tracking script. Account and operational data are not
            sold.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Keys</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Backend only
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Integration and AI credentials are read on the backend and are never
            returned to the browser bundle. Queued email tokens are encrypted at
            rest with the operator-managed job key.
          </p>
        </div>
        <div className="card p-6">
          <span className="label-caps">Investigation data</span>
          <h2 className="mt-4 font-serif text-2xl text-[var(--text)]">
            Local by default
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Account details, saved investigations, evidence, and audit events are
            stored in the deployment database. Raw log-analysis pastes are not
            persisted by the analysis endpoint. Audit retention is configurable.
          </p>
        </div>
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        Authentication uses an HttpOnly session cookie and a readable CSRF
        cookie. OAuth, when enabled, uses a short-lived state cookie. External AI
        providers are contacted only when configured; redacted evidence summaries
        and the operator's question are sent, and AI privacy mode blocks that
        transmission. Accounts can be deleted from settings. Audit retention and
        database backups are controlled by the deployment operator. Optional
        error/trace exporters are configured by the operator and carry
        operational metadata, not advertising identifiers.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/security" className="btn-accent">
          Read the security page
        </Link>
        <Link href="/support" className="btn-ghost">
          Ask a privacy question
        </Link>
      </div>
    </div>
  );
}
