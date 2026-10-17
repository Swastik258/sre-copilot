"use client";

import { useEffect, useState } from "react";
import { api, type Health } from "@/lib/api";

type State = "loading" | "ok" | "degraded" | "error";

export function HealthPill() {
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const body = await api.health();
        if (cancelled) return;
        setData(body);
        setError(null);
        setState(body.status === "ok" ? "ok" : "degraded");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "API unreachable");
        setState("error");
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
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : state === "degraded"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : state === "error"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
          : "border-hairline-strong bg-ink-800 text-paper-300";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${color}`}
      role="status"
      aria-live="polite"
      title={error ?? undefined}
    >
      <span
        className={`size-1.5 rounded-full ${
          state === "ok"
            ? "bg-emerald-500"
            : state === "degraded"
              ? "bg-amber-500"
              : state === "error"
                ? "bg-rose-500"
                : "bg-paper-400"
        }`}
      />
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
