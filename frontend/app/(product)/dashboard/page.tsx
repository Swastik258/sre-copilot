"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Investigation } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

export default function DashboardPage() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.investigations.list({ page_size: 5 })
      .then((result) => {
        if (active) setRecent(result.investigations);
      })
      .catch((error: unknown) => {
        if (active) setHistoryError(error instanceof Error ? error.message : "Investigation history is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayName = user?.display_name?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F14] p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[.16em] text-sky-300">Workspace overview</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {displayName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9AA4B2]">Start an evidence-backed investigation or pick up where you left off. Diagnostics are read-only by default.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/kubernetes" className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-500/15 transition hover:bg-sky-400">Diagnose Kubernetes</Link>
            <Link href="/cicd" className="rounded-lg border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm text-white transition hover:border-sky-300/30 hover:bg-white/[.06]">Inspect a pipeline</Link>
          </div>
        </div>
      </section>

      <section aria-label="Workspace status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Plan", value: "Free access", detail: "All features enabled" },
          { title: "Kubernetes", value: "Live", detail: "Read-only diagnostics" },
          { title: "Integrations", value: "Configure", detail: "Connect in settings" },
          { title: "Write actions", value: "0", detail: "No changes made" },
        ].map((item) => (
          <article key={item.title} className="rounded-xl border border-white/10 bg-[#0B0F14] p-5 transition hover:-translate-y-0.5 hover:border-sky-300/25 hover:shadow-[0_0_28px_rgba(56,189,248,.06)]">
            <p className="text-xs text-[#9AA4B2]">{item.title}</p>
            <p className="mt-3 text-xl font-semibold">{item.value}</p>
            <p className="mt-1 text-xs text-[#788391]">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0B0F14]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold">Recent investigations</h2>
            <p className="mt-1 text-xs text-[#9AA4B2]">Your saved investigation history</p>
          </div>
          <Link href="/history" className="text-sm text-sky-300 hover:text-sky-200">View history →</Link>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-[#9AA4B2]">Loading investigations…</p>
        ) : historyError ? (
          <p role="status" className="px-6 py-8 text-sm text-rose-300">{historyError}</p>
        ) : recent.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium">No investigations yet</p>
            <p className="mt-2 text-sm text-[#9AA4B2]">Your saved runs will appear here after your first investigation.</p>
            <Link href="/kubernetes" className="mt-4 inline-flex text-sm text-sky-300 hover:text-sky-200">Start with Kubernetes →</Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/[.07]">
            {recent.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[#9AA4B2]">{item.kind} · {new Date(item.updated_at).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#9AA4B2]">{item.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
