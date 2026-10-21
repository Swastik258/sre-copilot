"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiRequestError,
  type AuditEvent,
  type AuthUser,
} from "@/lib/api";

type Phase = "loading" | "signed_out" | "ready" | "error";

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function summarizeResource(resource?: Record<string, unknown> | null): string {
  if (!resource || Object.keys(resource).length === 0) return "—";
  return Object.entries(resource)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
}

export default function AuditPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [decision, setDecision] = useState("");
  const [retentionDays, setRetentionDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await api.audit.list({
        limit: 100,
        action: action.trim() || undefined,
        decision: decision || undefined,
      });
      setEvents(response.events);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not load audit events",
      );
    } finally {
      setBusy(false);
    }
  }, [action, decision]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const current = await api.auth.me();
        if (cancelled) return;
        setUser(current);
        if (!current) {
          setPhase("signed_out");
          return;
        }
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Audit trail unavailable");
        setPhase("error");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase === "ready") void load();
  }, [phase, load]);

  async function applyRetention() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.audit.applyRetention(retentionDays);
      setMessage(
        `Deleted ${result.deleted} event(s) older than ${result.older_than_days} day(s).`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Retention cleanup failed",
      );
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return <Centered>Loading audit trail…</Centered>;
  }

  if (phase === "signed_out") {
    return (
      <Centered>
        <div className="mx-auto max-w-md">
          <span className="label-caps">Audit</span>
          <h1 className="mt-3 font-serif text-display-sm text-primary">
            Sign in to review the trail
          </h1>
          <p className="mt-3 text-sm text-tertiary">
            Members see their tenant's audit trail; administrators can review
            across tenants. Retention actions are recorded too.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-accent">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-ghost">
              Create account
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  if (phase === "error") {
    return (
      <Centered>
        <div className="mx-auto max-w-md">
          <h1 className="font-serif text-2xl text-primary">Audit unavailable</h1>
          <p className="mt-3 font-mono text-sm text-bad">{error}</p>
        </div>
      </Centered>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Audit trail</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Audit</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Every recorded decision, who made it, and the redacted resource it
              touched. Export the trail or apply your retention policy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <span className="font-mono text-[10.5px] text-tertiary">
                {user.display_name || user.email}
              </span>
            )}
            <a
              className="btn-ghost text-[12px]"
              href={api.audit.exportUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Export CSV
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] animate-fade-in">
          <section className="min-w-0">
            <div className="card p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-48 flex-1">
                  <span className="label-caps">Action contains</span>
                  <input
                    value={action}
                    onChange={(event) => setAction(event.target.value)}
                    placeholder="investigation"
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary placeholder:text-tertiary"
                  />
                </label>
                <label>
                  <span className="label-caps">Decision</span>
                  <select
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    className="mt-1 block rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  >
                    <option value="">all</option>
                    <option value="allow">allow</option>
                    <option value="deny">deny</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-ghost text-[12px]"
                  onClick={() => void load()}
                  disabled={busy}
                >
                  {busy ? "Loading…" : "Apply filters"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10.5px] text-tertiary">
                <span>{total.toLocaleString()} event(s)</span>
                <span>· showing up to {events.length}</span>
                {action && <span>· action contains “{action}”</span>}
                {decision && <span>· decision {decision}</span>}
              </div>
            </div>

            {error && (
              <p className="mt-3 font-mono text-[11.5px] text-bad" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 overflow-hidden rounded-[4px] border border-hairline">
              <div className="hidden grid-cols-[9rem_10rem_1fr_4.5rem] gap-3 border-b border-hairline bg-[var(--bg-subtle)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary md:grid">
                <span>When</span>
                <span>Action</span>
                <span>Resource / reason</span>
                <span>Decision</span>
              </div>
              {events.length === 0 && (
                <p className="p-6 text-center font-mono text-[11.5px] text-tertiary">
                  No audit events match these filters.
                </p>
              )}
              <div className="divide-y divide-hairline">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-1 px-4 py-3 font-mono text-[11px] md:grid-cols-[9rem_10rem_1fr_4.5rem] md:gap-3"
                  >
                    <span className="text-tertiary">{formatTime(event.created_at)}</span>
                    <span className="truncate text-primary">{event.action}</span>
                    <span className="min-w-0 text-secondary">
                      <span className="block truncate">
                        {summarizeResource(event.resource)}
                      </span>
                      {event.reason && (
                        <span className="mt-0.5 block truncate text-tertiary">
                          {event.reason}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[10px] text-tertiary">
                        {event.actor}
                        {event.request_id ? ` · ${event.request_id}` : ""}
                      </span>
                    </span>
                    <span
                      className={
                        event.decision === "allow"
                          ? "text-good"
                          : event.decision === "deny"
                            ? "text-bad"
                            : "text-tertiary"
                      }
                    >
                      {event.decision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card p-4">
              <div className="label-caps">Retention</div>
              <p className="mt-2 text-[11.5px] text-tertiary">
                Delete events older than the selected window. The cleanup itself
                is recorded as a new audit event.
              </p>
              <label className="mt-3 block">
                <span className="label-caps">Older than (days)</span>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={retentionDays}
                  disabled={!isAdmin || busy}
                  onChange={(event) => setRetentionDays(Number(event.target.value))}
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                className="btn-ghost mt-3 w-full text-[12px] text-bad disabled:opacity-50"
                onClick={() => void applyRetention()}
                disabled={busy || !isAdmin}
              >
                Apply retention
              </button>
              {!isAdmin && (
                <p className="mt-2 font-mono text-[10px] text-tertiary">
                  Admin role required. You can still export your trail.
                </p>
              )}
              {message && (
                <p className="mt-3 font-mono text-[10.5px] text-good">{message}</p>
              )}
            </div>

            <div className="rounded-[4px] border border-hairline p-4">
              <div className="label-caps">What is recorded</div>
              <ul className="mt-2 space-y-2 text-[11.5px] text-tertiary">
                <li>· Investigation create, message, and close</li>
                <li>· Settings changes and audit cleanup</li>
                <li>· Auth sessions and approvals</li>
              </ul>
              <p className="mt-3 font-mono text-[10px] text-tertiary">
                Resource and outcome payloads pass through redaction before
                persistence.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative grid min-h-[60vh] place-items-center py-12">
        <div className="w-full text-center">{children}</div>
      </div>
    </div>
  );
}
