"use client";

import { useEffect, useState } from "react";
import { api, type IntegrationInfo, type IntegrationsResponse } from "@/lib/api";

/**
 * Live integration status, fetched from the backend. This replaces the previous
 * hardcoded "watched surfaces" strip, which presented fabricated production
 * numbers as if they were real.
 */

const STATE_STYLES: Record<
  IntegrationInfo["state"],
  { dot: string; text: string; label: string }
> = {
  connected: { dot: "dot-good", text: "text-primary", label: "Connected" },
  enabled: { dot: "dot-good", text: "text-primary", label: "Enabled" },
  demo: { dot: "dot-warn", text: "text-secondary", label: "Demo data" },
  unconfigured: { dot: "dot-warn", text: "text-secondary", label: "Not configured" },
  disabled: { dot: "dot-idle", text: "text-tertiary", label: "Disabled" },
};

/** AI surfaces read as amber even when their state would otherwise be green. */
function dotClass(integration: IntegrationInfo): string {
  if (integration.state === "disabled") return "dot-idle";
  if (/ai|assistant|llm|model/i.test(integration.kind)) return "dot-warn";
  return STATE_STYLES[integration.state].dot;
}

function SkeletonCells() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[var(--border-strong)] bg-[var(--border-strong)] sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="space-y-2 bg-[var(--bg-elevated)] px-4 py-3.5"
        >
          <span className="loading-line block h-2.5 w-24 rounded-[2px]" />
          <span className="loading-line block h-2 w-16 rounded-[2px]" />
        </div>
      ))}
    </div>
  );
}

export function StatusStrip() {
  const [data, setData] = useState<IntegrationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .integrations()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unable to load integrations");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = data?.demo_mode === false;

  return (
    <section className="border-y border-hairline bg-[var(--bg-subtle)]">
      <div className="shell py-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <span className="label-caps">Configured integrations</span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
            <span className={`dot ${data ? (live ? "dot-good" : "dot-warn") : "dot-idle"}`} />
            {data?.demo_mode === false
              ? "read-only · live"
              : data
                ? "read-only · demo mode"
                : "checking status"}
          </span>
        </div>

        {error && (
          <p className="font-mono text-[11px] text-bad" role="alert">
            Integration status unavailable: {error}
          </p>
        )}

        {!error && !data && <SkeletonCells />}

        {data && (
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[var(--border-strong)] bg-[var(--border-strong)] sm:grid-cols-3 lg:grid-cols-4"
            aria-live="polite"
          >
            {data.integrations.map((integration, index) => {
              const style = STATE_STYLES[integration.state];
              return (
                <div
                  key={integration.kind}
                  className="animate-fade-in bg-[var(--bg-elevated)] px-4 py-3.5 transition-colors hover:bg-[var(--bg)]"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`dot ${dotClass(integration)}`} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
                      {integration.kind}
                    </span>
                  </div>
                  <div className={`mt-2 text-[12.5px] ${style.text}`}>
                    {style.label}
                  </div>
                  {integration.detail && (
                    <div className="mt-0.5 font-mono text-[10.5px] text-tertiary">
                      {integration.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
