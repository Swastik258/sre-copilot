"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { api, type IntegrationsResponse, type Investigation } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

type WorkspaceStatus = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "good" | "neutral" | "warning";
};

function integrationState(state: string): { label: string; tone: WorkspaceStatus["tone"] } {
  switch (state) {
    case "connected":
    case "enabled":
      return { label: state === "enabled" ? "Enabled" : "Connected", tone: "good" };
    case "demo":
      return { label: "Demo", tone: "warning" };
    case "disabled":
      return { label: "Disabled", tone: "neutral" };
    default:
      return { label: "Not configured", tone: "neutral" };
  }
}

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
  const prometheus = integrations?.integrations.find((item) => item.kind === "prometheus");
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

  const prometheusValue = integrationError
    ? "Unavailable"
    : !integrations
      ? "Checking"
      : prometheus?.state === "connected" || prometheus?.state === "enabled"
        ? "Connected"
        : prometheus?.state === "demo"
          ? "Demo"
          : prometheus?.state === "disabled"
            ? "Disabled"
            : "Not configured";
  const prometheusDetail = integrationError
    ? "Integration status unavailable"
    : !integrations
      ? "Checking integration status"
      : prometheus?.detail || "Prometheus integration status";

  const statuses: WorkspaceStatus[] = [
    {
      title: "Kubernetes connectivity",
      value: kubernetesValue,
      detail: kubernetesDetail,
      icon: Activity,
      tone: kubernetesValue === "Live" ? "good" : kubernetesValue === "Demo" ? "warning" : "neutral",
    },
    {
      title: "Connected integrations",
      value: integrationValue,
      detail: integrationDetail,
      icon: CircleCheck,
      tone: integrationError ? "warning" : connected ? "good" : "neutral",
    },
    {
      title: "Infrastructure writes",
      value: "Never",
      detail: "Changes remain under operator control",
      icon: ShieldCheck,
      tone: "good",
    },
    {
      title: "Prometheus metrics",
      value: prometheusValue,
      detail: prometheusDetail,
      icon: prometheusValue === "Connected" ? Activity : CircleDashed,
      tone: prometheusValue === "Connected" ? "good" : prometheusValue === "Demo" ? "warning" : "neutral",
    },
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
        {statuses.map((item) => {
          const StatusIcon = item.icon;
          return (
          <article key={item.title} className="dashboard-status-card">
            <div className="dashboard-status-card-heading">
              <StatusIcon aria-hidden="true" />
              <h2>{item.title}</h2>
            </div>
            <p className={`dashboard-status-value is-${item.tone}`}>{item.value}</p>
            <span>{item.detail}</span>
          </article>
          );
        })}
      </section>

      <div className="dashboard-activity-grid">
        <section className="dashboard-history dashboard-history-panel">
          <div className="dashboard-history-heading">
            <div>
              <p className="dashboard-eyebrow">Incident activity</p>
              <h2>Recent investigations</h2>
              <p className="dashboard-history-description">
                Latest saved diagnosis runs and their current review state.
              </p>
            </div>
            <Link href="/history" className="dashboard-history-link">
              All investigations <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          {loading ? (
            <div className="dashboard-loading-list" aria-label="Loading investigations">
              {Array.from({ length: 3 }, (_, index) => <span key={index} />)}
            </div>
          ) : historyError ? (
            <p role="status" className="dashboard-history-state is-error">{historyError}</p>
          ) : recent.length === 0 ? (
            <div className="dashboard-empty-state">
              <div>
                <h3>No saved investigations yet</h3>
                <p>Your completed runs will appear here.</p>
              </div>
              <Link href="/kubernetes" className="dashboard-history-link">
                Start a diagnosis <ArrowUpRight aria-hidden="true" />
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

        <section className="dashboard-integrations-panel" aria-labelledby="dashboard-integrations-title">
          <div className="dashboard-integrations-heading">
            <div>
              <p className="dashboard-eyebrow">Sources</p>
              <h2 id="dashboard-integrations-title">Integrations</h2>
            </div>
            <Link href="/settings#integrations" aria-label="Manage integrations">
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          {integrationError ? (
            <p role="status" className="dashboard-history-state is-error">Integration status unavailable.</p>
          ) : !integrations ? (
            <div className="dashboard-loading-list" aria-label="Loading integrations">
              {Array.from({ length: 3 }, (_, index) => <span key={index} />)}
            </div>
          ) : integrations.integrations.length === 0 ? (
            <p className="dashboard-history-state">No integrations are configured.</p>
          ) : (
            <ul className="dashboard-integrations-list">
              {integrations.integrations.map((item) => {
                const state = integrationState(item.state);
                return (
                  <li key={item.kind}>
                    <span className="dashboard-integration-icon">
                      {state.tone === "good"
                        ? <CircleCheck aria-hidden="true" />
                        : state.tone === "warning"
                          ? <Activity aria-hidden="true" />
                          : <CircleX aria-hidden="true" />}
                    </span>
                    <span className="dashboard-integration-name">
                      <strong>{item.name}</strong>
                      <small>{item.read_only ? "Read-only" : item.detail || "Operator configured"}</small>
                    </span>
                    <span className={`dashboard-integration-state is-${state.tone}`}>{state.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/metrics" className="dashboard-metrics-link">
            Open metrics <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
