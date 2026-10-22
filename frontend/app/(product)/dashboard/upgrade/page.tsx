"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function UpgradePage() {
  return <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading plan options…</p>}><UpgradeContent /></Suspense>;
}

function UpgradeContent() {
  const feature = useSearchParams().get("feature") ?? "this feature";
  return (
    <section className="console-panel mx-auto max-w-xl p-8">
      <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--accent)]">Feature access</span>
      <h1 className="mt-3 text-3xl font-semibold">Unlock {feature}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">This feature is not included in your current plan. Upgrade options will be available here when billing is introduced.</p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)]">Back to overview</Link>
    </section>
  );
}
