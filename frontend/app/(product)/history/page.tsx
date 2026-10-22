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
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-sky-300">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold">Investigation history</h1>
        <p className="mt-2 text-sm text-[#9AA4B2]">Saved runs associated with your account.</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0F14]">
        {loading ? <p className="p-6 text-sm text-[#9AA4B2]">Loading history…</p> :
          error ? <p role="status" className="p-6 text-sm text-rose-300">{error}</p> :
            items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium">Nothing saved yet</p>
                <p className="mt-2 text-sm text-[#9AA4B2]">Your completed investigations will be listed here.</p>
                <Link href="/kubernetes" className="mt-4 inline-flex text-sm text-sky-300">Start an investigation →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[.07]">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-[#9AA4B2]">{item.kind} · {new Date(item.updated_at).toLocaleString()}</p></div>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#9AA4B2]">{item.status.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
      </div>
    </section>
  );
}
