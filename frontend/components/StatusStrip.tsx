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
  connected: { dot: "dot-good", text: "text-paper-100", label: "Connected" },
  enabled: { dot: "dot-good", text: "text-paper-100", label: "Enabled" },
  demo: { dot: "dot-warn", text: "text-paper-200", label: "Demo data" },
  unconfigured: { dot: "dot-warn", text: "text-paper-200", label: "Not configured" },
  disabled: { dot: "dot-idle", text: "text-paper-400", label: "Disabled" },
};

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

  return (
    <section className="border-y border-hairline bg-ink-950/40">
      <div className="mx-auto max-w-wide px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="label-caps">Configured integrations</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper-400">
            {data?.demo_mode === false ? "read-only · live" : "read-only · demo mode"}
          </span>
        </div>

        {error && (
          <p className="font-mono text-[11px] text-rose-300">
            Integration status unavailable: {error}
          </p>
        )}

        {!error && !data && (
          <p className="font-mono text-[11px] text-paper-400">Loading status…</p>
        )}

        {data && (
          <div className="grid grid-cols-2 gap-px bg-hairline-strong sm:grid-cols-3 lg:grid-cols-4">
            {data.integrations.map((integration) => {
              const style = STATE_STYLES[integration.state];
              return (
                <div key={integration.kind} className="tick bg-ink-900 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`dot ${style.dot}`} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper-300">
                      {integration.kind}
                    </span>
                  </div>
                  <div className={`mt-2 text-[12.5px] ${style.text}`}>
                    {style.label}
                  </div>
                  {integration.detail && (
                    <div className="mt-0.5 font-mono text-[10.5px] text-paper-400">
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
