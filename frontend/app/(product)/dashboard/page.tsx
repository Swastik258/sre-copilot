"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContourField } from "@/components/ContourField";
import { api, type IntegrationsResponse, type Investigation } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

export default function DashboardPage() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(null);
  const [integrationError, setIntegrationError] = useState(false);

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

  useEffect(() => {
    let active = true;
    api.integrations()
      .then((result) => {
        if (active) setIntegrations(result);
      })
      .catch(() => {
        if (active) setIntegrationError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayName = user?.display_name?.trim() || user?.email?.split("@")[0] || "there";
  const kubernetes = integrations?.integrations.find((item) => item.kind === "kubernetes");
  const kubernetesValue = integrationError
    ? "Unavailable"
    : !integrations
      ? "Checking"
      : kubernetes?.state === "connected" || kubernetes?.state === "enabled"
        ? "Live"
        : kubernetes?.state === "demo"
          ? "Demo"
          : kubernetes?.state === "disabled"
            ? "Disabled"
            : "Not configured";
  const kubernetesDetail = integrationError
    ? "Status endpoint unreachable"
    : kubernetes?.state === "demo"
      ? "Labelled fixtures · read-only"
      : kubernetes?.state === "connected" || kubernetes?.state === "enabled"
        ? "Read-only diagnostics"
        : "Set by the operator";
  const connected = integrations?.integrations.filter(
    (item) => item.state === "connected" || item.state === "enabled",
  ).length;
  const integrationValue = integrationError
    ? "Unavailable"
    : !integrations
      ? "Checking"
      : `${connected ?? 0}/${integrations.integrations.length}`;
  const integrationDetail = integrationError
    ? "Status endpoint unreachable"
    : !integrations
      ? "Loading backend status"
      : `${connected ?? 0} read-only · operator-configured`;

  return (
    <div className="dashboard-content space-y-8">
      <section className="dashboard-hero">
        <ContourField rings={8} />
        <div>
          <p className="section-label">Workspace overview</p>
          <h1 className="mt-4 text-4xl sm:text-5xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Start with evidence from a read-only source, or pick up a saved
            investigation. Tarn never applies infrastructure changes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/kubernetes" className="btn-primary">Diagnose Kubernetes</Link>
            <Link href="/cicd" className="btn-ghost">Inspect a pipeline</Link>
          </div>
        </div>
      </section>

      <section aria-label="Workspace status" aria-live="polite" className="dashboard-status">
        {[
          { title: "Plan", value: "Free", detail: "All implemented surfaces; Pro and Team are planned" },
          { title: "Kubernetes", value: kubernetesValue, detail: kubernetesDetail },
          { title: "Integrations", value: integrationValue, detail: integrationDetail },
          { title: "Execution", value: "Disabled", detail: "No apply, mutation, or re-run path" },
        ].map((item) => (
          <div key={item.title} className="dashboard-status-row">
            <h2>{item.title}</h2>
            <p>{item.value}</p>
            <span>{item.detail}</span>
          </div>
        ))}
      </section>

      <section className="dashboard-history">
        <div className="dashboard-history-heading">
          <div>
            <h2 className="font-semibold">Recent investigations</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Your saved investigation history</p>
          </div>
          <Link href="/history" className="text-sm text-[var(--accent)] hover:text-[var(--text)]">View history →</Link>
        </div>
        {loading ? (
          <p className="py-8 text-sm text-[var(--text-muted)]">Loading investigations…</p>
        ) : historyError ? (
          <p role="status" className="py-8 text-sm text-[var(--signal-bad)]">{historyError}</p>
        ) : recent.length === 0 ? (
          <div className="py-10">
            <p className="text-sm font-medium">No investigations yet</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Your saved runs will appear here after your first investigation.</p>
            <Link href="/kubernetes" className="mt-4 inline-flex text-sm text-[var(--accent)] hover:text-[var(--text)]">Start with Kubernetes →</Link>
          </div>
        ) : (
          <ul className="dashboard-history-list">
            {recent.map((item) => (
              <li key={item.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{item.kind} · {new Date(item.updated_at).toLocaleString()}</p>
                  <p className="mt-2 font-mono text-[10px] text-[var(--text-subtle)]">trace: {item.id.slice(0, 12)}</p>
                </div>
                <span className="text-sm text-[var(--text-muted)]">{item.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
