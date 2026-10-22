"use client";

import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <section className="console-panel mx-auto max-w-2xl p-8">
      <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--text-muted)]">Feature availability</span>
      <h1 className="mt-3 text-3xl font-semibold">Logs and Terraform are live</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Log analysis is available at <span className="font-mono">/logs</span> and
        Terraform plan review is available at <span className="font-mono">/terraform</span>.
        Use the workspace navigation for all current surfaces.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/logs" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)]">Open logs</Link>
        <Link href="/terraform" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)]">Open Terraform</Link>
        <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)]">Back to overview</Link>
      </div>
    </section>
  );
}
