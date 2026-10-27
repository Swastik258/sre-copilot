"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function UpgradePage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-muted)]">Loading…</p>}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
  const feature = useSearchParams().get("feature") ?? "this surface";
  return (
    <section className="console-panel mx-auto max-w-xl">
      <p className="section-label">Plan boundary</p>
      <h1 className="mt-3 text-3xl">No plan gate applies in this build.</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
        Every implemented surface is included in Free. The link for{" "}
        <span className="font-mono text-[var(--text)]">{feature}</span> should not
        require a purchase. Pro and Team are planned, unpriced, and not for sale;
        there is no checkout flow to send you to.
      </p>
      <Link href="/dashboard" className="btn-ghost mt-6">
        Back to overview
      </Link>
    </section>
  );
}
