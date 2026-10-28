"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Investigation } from "@/lib/api";

export default function InvestigationHistoryPage() {
  const [items, setItems] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.investigations.list({ page_size: 50 }).then((response) => {
      if (active) setItems(response.investigations);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "History is unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--accent)]">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold">Investigation history</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Saved runs associated with your account.</p>
      </header>
      <div className="console-panel overflow-hidden">
        {loading ? <p className="p-6 text-sm text-[var(--text-muted)]">Loading history…</p> :
          error ? <p role="status" className="p-6 text-sm text-[var(--danger)]">{error}</p> :
            items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium">Nothing saved yet</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Your completed investigations will be listed here.</p>
                <Link href="/kubernetes" className="mt-4 inline-flex text-sm text-[var(--accent)]">Start an investigation →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{item.kind} · {new Date(item.updated_at).toLocaleString()}</p><span className="workspace-trace-chip mt-2">trace: {item.id.slice(0, 12)}</span></div>
                    <span className="rounded-md border border-[var(--border)] px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{item.status.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
      </div>
    </section>
  );
}
