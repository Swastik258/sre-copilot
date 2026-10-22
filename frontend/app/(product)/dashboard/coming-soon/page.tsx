"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ComingSoonPage() {
  return <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading feature…</p>}><ComingSoonContent /></Suspense>;
}

function ComingSoonContent() {
  const params = useSearchParams();
  const feature = params.get("feature") === "terraform" ? "Terraform plan explainer" : "Log analysis";

  return (
    <section className="console-panel mx-auto max-w-2xl p-8">
      <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--text-muted)]">Planned feature</span>
      <h1 className="mt-3 text-3xl font-semibold">{feature}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">This workspace area is not available yet. Your existing product pages remain available while this feature is being prepared.</p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)]">Back to overview</Link>
    </section>
  );
}
