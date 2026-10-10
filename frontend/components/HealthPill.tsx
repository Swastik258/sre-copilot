"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Health = { status: string; database: string };

export function HealthPill() {
  const [state, setState] = useState<"loading" | "ok" | "degraded" | "error">("loading");
  const [data, setData] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as Health;
        if (!cancelled) {
          setData(body);
          setState(body.status === "ok" ? "ok" : "degraded");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }
    load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const color =
    state === "ok"
      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
      : state === "degraded"
        ? "border-amber-400/20 bg-amber-400/[0.07] text-amber-200"
        : state === "error"
          ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-200"
          : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${color}`}
      role="status"
      aria-live="polite"
    >
      <span className={`size-1.5 rounded-full ${state === "ok" ? "bg-emerald-300" : state === "degraded" ? "bg-amber-300" : state === "error" ? "bg-rose-300" : "bg-slate-400"}`} />
      <span className="font-medium">API</span>
      <span className="text-current/75">
        {state === "loading"
          ? "checking…"
          : state === "ok"
            ? `ok · db ${data?.database ?? "?"}`
            : state === "degraded"
              ? `degraded · db ${data?.database ?? "?"}`
              : "unreachable"}
      </span>
    </div>
  );
}