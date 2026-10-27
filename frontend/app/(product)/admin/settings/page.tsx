"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  api,
  ApiRequestError,
  type AdminUserUpdate,
  type AuthUser,
  type SettingsResponse,
} from "@/lib/api";

type Phase = "loading" | "signed_out" | "ready" | "error";

const STATE_STYLES: Record<string, string> = {
  connected: "text-good",
  enabled: "text-info",
  demo: "text-warn",
  unconfigured: "text-warn",
  disabled: "text-tertiary",
};

export default function SettingsPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [environment, setEnvironment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [adminBusy, setAdminBusy] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const isAdmin = user?.role === "owner" || user?.role === "admin";

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
        const response = await api.settings.get();
        if (cancelled) return;
        setSettings(response);
        setRetentionDays(response.audit_retention_days);
        setPrivacyMode(response.ai_privacy_mode);
        setEnvironment(response.default_environment ?? "");
        if (current.role === "owner" || current.role === "admin") {
          const userList = await api.admin.users();
          if (cancelled) return;
          setUsers(userList.users);
        }
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Settings unavailable");
        setPhase("error");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.settings.update({
        audit_retention_days: retentionDays,
        ai_privacy_mode: privacyMode,
        default_environment: environment.trim() || null,
      });
      setSettings(updated);
      setRetentionDays(updated.audit_retention_days);
      setPrivacyMode(updated.ai_privacy_mode);
      setEnvironment(updated.default_environment ?? "");
      setMessage("Settings saved. AI privacy changes apply on the next request.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save settings",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateMember(userId: string, patch: AdminUserUpdate) {
    setAdminBusy(userId);
    setAdminMessage(null);
    setError(null);
    try {
      await api.admin.updateUser(userId, patch);
      if (user?.id === userId) {
        const current = await api.auth.me();
        setUser(current);
        if (!current) {
          setPhase("signed_out");
          return;
        }
        if (current.role !== "owner" && current.role !== "admin") {
          setAdminMessage("Your administrator role was removed.");
          return;
        }
      }
      const userList = await api.admin.users();
      setUsers(userList.users);
      setAdminMessage("Member updated.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not update member",
      );
    } finally {
      setAdminBusy(null);
    }
  }

  if (phase === "loading") {
    return <Centered>Loading settings…</Centered>;
  }

  if (phase === "signed_out") {
    return (
      <Centered>
        <div className="mx-auto max-w-md">
          <span className="label-caps">Settings</span>
          <h1 className="mt-3 font-serif text-display-sm text-primary">
            Sign in to edit workspace settings
          </h1>
          <p className="mt-3 text-sm text-tertiary">
            Secrets stay in the server environment. This editor only changes
            non-secret operational preferences.
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
          <h1 className="font-serif text-2xl text-primary">Settings unavailable</h1>
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
            <span className="label-caps">Workspace configuration</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Settings</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Change non-secret policy values here. Provider keys and tokens are
              read only by the backend and are never returned to this page.
            </p>
          </div>
          {user && (
            <span className="font-mono text-[10.5px] text-tertiary">
              {user.display_name || user.email} · {user.role} · {user.tenant_id}
            </span>
          )}
        </div>

        {settings && (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] animate-fade-in">
            <section className="space-y-5">
              {!isAdmin && (
                <div className="rounded-[4px] border border-warn bg-accent-soft p-4">
                  <p className="text-[12px] text-secondary">
                    You are signed in with a read-only workspace role. Ask an
                    owner or administrator to change workspace policy.
                  </p>
                </div>
              )}
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="label-caps">AI privacy</div>
                    <p className="mt-1 text-[11.5px] text-tertiary">
                      When enabled, external providers are rejected at call time.
                      Deterministic diagnosis and the mock provider still work.
                    </p>
                  </div>
                  <span className="tag-quiet">
                    {settings.ai_privacy_source === "override" ? "policy" : "env"}
                  </span>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-3">
                  <input
                    type="checkbox"
                    checked={privacyMode}
                    disabled={!isAdmin || busy}
                    onChange={(event) => setPrivacyMode(event.target.checked)}
                    className="mt-0.5 size-4 accent-[var(--warn)] disabled:opacity-50"
                  />
                  <span>
                    <span className="block text-[12.5px] text-primary">
                      Block external AI providers
                    </span>
                    <span className="mt-0.5 block text-[11px] text-tertiary">
                      No evidence or question text leaves the machine.
                    </span>
                  </span>
                </label>
                <div className="mt-3 grid gap-2 font-mono text-[10.5px] text-tertiary sm:grid-cols-2">
                  <span>provider · {settings.ai_provider}</span>
                  <span>model · {settings.ai_model}</span>
                </div>
              </div>

              <div className="card p-5">
                <div className="label-caps">Audit retention</div>
                <p className="mt-1 text-[11.5px] text-tertiary">
                  The audit page can delete events older than this policy. The
                  cleanup is itself recorded.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="label-caps">Retention (days)</span>
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
                  <label>
                    <span className="label-caps">Default environment label</span>
                    <input
                      value={environment}
                      disabled={!isAdmin || busy}
                      onChange={(event) => setEnvironment(event.target.value)}
                      placeholder="production"
                      className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary placeholder:text-tertiary disabled:opacity-50"
                    />
                  </label>
                </div>
              </div>

              <div className="card p-5">
                <div className="label-caps">Integration status</div>
                <p className="mt-1 text-[11.5px] text-tertiary">
                  Status describes configuration, not reachability. Keys remain
                  in the environment.
                </p>
                <div className="mt-3 divide-y divide-hairline">
                  {settings.integrations.map((integration) => (
                    <div
                      key={integration.kind}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div>
                        <div className="text-[12.5px] text-primary">{integration.name}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-tertiary">
                          {integration.detail || "No detail reported."}
                        </div>
                      </div>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                          STATE_STYLES[integration.state] ?? "text-tertiary"
                        }`}
                      >
                        {integration.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="label-caps">Access &amp; workspace</div>
                      <p className="mt-1 text-[11.5px] text-tertiary">
                        Only workspace owners and admins can change roles.
                        Cross-workspace membership changes use the organizations
                        API; this page manages the active workspace only.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 divide-y divide-hairline">
                    {users.map((member) => (
                      <AdminUserRow
                        key={member.id}
                        member={member}
                        busy={adminBusy === member.id}
                        onSave={updateMember}
                      />
                    ))}
                  </div>
                  {adminMessage && (
                    <p className="mt-2 font-mono text-[10.5px] text-good">
                      {adminMessage}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-accent disabled:opacity-50"
                  onClick={() => void save()}
                  disabled={busy || !isAdmin}
                >
                  {busy ? "Saving…" : "Save settings"}
                </button>
                {message && <span className="font-mono text-[10.5px] text-good">{message}</span>}
                {error && <span className="font-mono text-[10.5px] text-bad">{error}</span>}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[4px] border border-hairline p-4">
                <div className="label-caps">Runtime policy</div>
                <dl className="mt-2 space-y-2 font-mono text-[10.5px] text-tertiary">
                  <div className="flex justify-between gap-3">
                    <dt>auth required</dt>
                    <dd className="text-secondary">{String(settings.auth_required)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>rate limit</dt>
                    <dd className="text-secondary">
                      {settings.rate_limit_per_minute || "off"}/min
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>redaction</dt>
                    <dd className="text-secondary">{String(settings.redaction_enabled)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>demo mode</dt>
                    <dd className="text-secondary">{String(settings.demo_mode)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[4px] border border-hairline p-4">
                <div className="label-caps">Secrets are env-only</div>
                <p className="mt-2 text-[11.5px] text-tertiary">
                  Set provider keys, GitHub tokens, kubeconfig paths, and
                  Prometheus URLs in the backend environment. They are never
                  accepted or returned by this API.
                </p>
                <Link href="/docs" className="btn-ghost mt-3 text-[12px]">
                  Read setup docs
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminUserRow({
  member,
  busy,
  onSave,
}: {
  member: AuthUser;
  busy: boolean;
  onSave: (userId: string, patch: AdminUserUpdate) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] text-primary">
          {member.display_name || member.email || member.id}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-tertiary">
          {member.email || member.id}
        </div>
      </div>
      <select
        value={member.role}
        disabled={busy}
        onChange={(event) =>
          void onSave(member.id, {
            role: event.target.value as "owner" | "admin" | "member" | "viewer",
          })
        }
        className="rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2 py-1.5 font-mono text-[10.5px] text-primary disabled:opacity-50"
      >
        <option value="viewer">viewer</option>
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="owner">owner</option>
      </select>
      <button
        type="button"
        className={`rounded-[4px] border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
          member.is_active
            ? "border-hairline text-tertiary hover:text-bad"
            : "border-good text-good"
        }`}
        disabled={busy}
        onClick={() => void onSave(member.id, { is_active: !member.is_active })}
      >
        {member.is_active ? "disable" : "enable"}
      </button>
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
