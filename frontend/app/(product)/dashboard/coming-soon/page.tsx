"use client";

import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <section className="console-panel mx-auto max-w-2xl">
      <p className="section-label">Feature availability</p>
      <h1 className="mt-3 text-3xl">There is no half-built feature hidden here.</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Every surface currently linked in the workspace is implemented. Log
        analysis is available at <span className="font-mono">/logs</span>,
        Terraform review is available at{" "}
        <span className="font-mono">/terraform</span>, and the overview shows the
        current source state.
      </p>
      <div className="page-actions">
        <Link href="/dashboard" className="btn-primary">
          Back to overview
        </Link>
        <Link href="/logs" className="btn-ghost">
          Open logs
        </Link>
        <Link href="/terraform" className="btn-ghost">
          Open Terraform
        </Link>
      </div>
    </section>
  );
}
