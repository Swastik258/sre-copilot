"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  const displayName = user?.display_name?.trim() || user?.email?.split("@")[0];
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
    ? "Integration status unavailable"
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
    ? "Integration status unavailable"
    : !integrations
      ? "Checking integration status"
      : `${connected ?? 0} connected · operator-configured`;

  const statuses = [
    { title: "Kubernetes", value: kubernetesValue, detail: kubernetesDetail },
    { title: "Connected sources", value: integrationValue, detail: integrationDetail },
    { title: "Infrastructure writes", value: "Never", detail: "Changes remain under operator control" },
  ];

  return (
    <div className="dashboard-content dashboard-overview">
      <section className="dashboard-hero dashboard-overview-hero">
        <div className="dashboard-welcome">
          <p className="dashboard-eyebrow">Workspace / Overview</p>
          <h1>
            {displayName ? `Your workspace, ${displayName}.` : "Workspace overview"}
          </h1>
          <p>
            Investigate a failure, then verify every finding against its source.
          </p>
          <div className="dashboard-actions">
            <Link href="/kubernetes" className="dashboard-action-primary">
              <span>Start a Kubernetes diagnosis</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/cicd" className="dashboard-action-secondary">
              Inspect a workflow
            </Link>
          </div>
        </div>
        <div className="dashboard-hero-aside" aria-label="Investigation approach">
          <span className="dashboard-live-mark" aria-hidden="true" />
          <p className="dashboard-eyebrow">Every finding has a source</p>
          <p>Observed facts</p>
          <span>→</span>
          <p>Evidence references</p>
          <span>→</span>
          <p>Ranked hypotheses</p>
        </div>
      </section>

      <section
        aria-label="Workspace status"
        aria-live="polite"
        className="dashboard-status dashboard-status-grid"
      >
        {statuses.map((item) => (
          <article key={item.title} className="dashboard-status-card">
            <div className="dashboard-status-card-heading">
              <h2>{item.title}</h2>
            </div>
            <p>{item.value}</p>
            <span>{item.detail}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-history dashboard-history-panel">
        <div className="dashboard-history-heading">
          <div>
            <p className="dashboard-eyebrow">Workspace activity</p>
            <h2>Recent investigations</h2>
            <p className="dashboard-history-description">
              Your latest saved diagnosis runs.
            </p>
          </div>
          <Link href="/history" className="dashboard-history-link">
            All investigations <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {loading ? (
          <p className="dashboard-history-state">Loading your investigations…</p>
        ) : historyError ? (
          <p role="status" className="dashboard-history-state is-error">{historyError}</p>
        ) : recent.length === 0 ? (
          <div className="dashboard-empty-state">
            <div>
              <h3>No saved investigations yet</h3>
              <p>Your completed runs will appear here.</p>
            </div>
            <Link href="/kubernetes" className="dashboard-history-link">
              Start a diagnosis <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <ul className="dashboard-history-list">
            {recent.map((item) => (
              <li key={item.id}>
                <div className="dashboard-investigation-type" aria-hidden="true">
                  {item.kind.slice(0, 1).toUpperCase()}
                </div>
                <div className="dashboard-investigation-main">
                  <p className="dashboard-investigation-title">{item.title}</p>
                  <p className="dashboard-investigation-meta">
                    {item.kind} · {new Date(item.updated_at).toLocaleString()}
                  </p>
                </div>
                <span className="dashboard-investigation-id">
                  {item.id.slice(0, 12)}
                </span>
                <span className="dashboard-investigation-status">
                  {item.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
