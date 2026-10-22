"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiRequestError, api, type AccountSnapshot } from "@/lib/api";
import { useAuth } from "@/lib/auth-client";

type Notice = { kind: "success" | "error"; text: string } | null;

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section id={title.toLowerCase().replaceAll(" ", "-")} className="console-panel scroll-mt-24 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-[var(--text-muted)]">{label}</span>
      <input {...props} className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)] ${props.className ?? ""}`} />
    </label>
  );
}

function Message({ value }: { value: Notice }) {
  if (!value) return null;
  return <p role="status" className={`mt-3 text-sm ${value.kind === "error" ? "text-rose-300" : "text-[var(--signal-good)]"}`}>{value.text}</p>;
}

export default function AccountSettingsPage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, Notice>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [keyName, setKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    api.account.get().then((result) => {
      if (!active) return;
      setAccount(result);
      setName(result.profile.display_name ?? "");
      setEmail(result.profile.email ?? "");
    }).catch((error: unknown) => {
      if (active) setNotice({ page: { kind: "error", text: error instanceof Error ? error.message : "Unable to load settings." } });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function show(section: string, value: Notice) {
    setNotice((current) => ({ ...current, [section]: value }));
  }

  async function run(section: string, operation: () => Promise<void>) {
    setBusy(section);
    show(section, null);
    try {
      await operation();
    } catch (error) {
      show(section, { kind: "error", text: error instanceof ApiRequestError ? error.message : error instanceof Error ? error.message : "Request failed." });
    } finally {
      setBusy(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("profile", async () => {
      const emailChanged = email.trim().toLowerCase() !== (account?.profile.email ?? "").toLowerCase();
      const result = await api.account.updateProfile({
        display_name: name.trim() || null,
        ...(emailChanged ? { email: email.trim(), current_password: profilePassword } : {}),
      });
      setAccount((current) => current ? { ...current, profile: result } : current);
      setProfilePassword("");
      await refresh();
      show("profile", { kind: "success", text: "Profile saved." });
    });
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("security", async () => {
      await api.account.updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      show("security", { kind: "success", text: "Password changed." });
    });
  }

  async function savePreferences(patch: Partial<AccountSnapshot["preferences"]>) {
    await run("preferences", async () => {
      const preferences = await api.account.updatePreferences(patch);
      setAccount((current) => current ? { ...current, preferences } : current);
      show("preferences", { kind: "success", text: "Preferences saved." });
    });
  }

  async function setIntegration(kind: keyof AccountSnapshot["integrations"], connected: boolean) {
    await run(`integration-${kind}`, async () => {
      const integrations = await api.account.updateIntegration(kind, connected);
      setAccount((current) => current ? { ...current, integrations } : current);
      show(`integration-${kind}`, { kind: "success", text: `${kind} setting updated.` });
    });
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("keys", async () => {
      const created = await api.account.createApiKey(keyName);
      setKeyName("");
      setCreatedKey(created.key);
      setAccount((current) => current ? {
        ...current,
        api_keys: [{ id: created.id, name: created.name, prefix: created.prefix, created_at: created.created_at }, ...current.api_keys],
      } : current);
      show("keys", { kind: "success", text: "API key created. Copy it now; it will not be shown again." });
    });
  }

  async function revokeKey(id: string) {
    await run("keys", async () => {
      await api.account.revokeApiKey(id);
      setAccount((current) => current ? { ...current, api_keys: current.api_keys.filter((key) => key.id !== id) } : current);
      show("keys", { kind: "success", text: "API key revoked." });
    });
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteConfirmed) {
      show("danger", { kind: "error", text: "Confirm that you understand this action is permanent." });
      return;
    }
    await run("danger", async () => {
      await api.account.delete(deletePassword);
      await logout();
      router.replace("/");
    });
  }

  if (loading) return <p className="py-12 text-sm text-[var(--text-muted)]">Loading account settings…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="mb-7">
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--accent)]">Account</p>
        <h1 className="mt-2 text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Manage your personal profile and workspace connections.</p>
      </header>
      {notice.page && <Message value={notice.page} />}

      <Panel title="Profile" description="Update your name and sign-in email. Changing email requires your current password.">
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320} />
          {email.trim().toLowerCase() !== (account?.profile.email ?? "").toLowerCase() && <div className="sm:col-span-2"><Field label="Current password (required to change email)" type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} required /></div>}
          <div className="sm:col-span-2"><button disabled={busy === "profile"} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--text)] disabled:opacity-50">{busy === "profile" ? "Saving…" : "Save profile"}</button><Message value={notice.profile ?? null} /></div>
        </form>
      </Panel>

      <Panel title="Security" description="Use a unique password with at least 8 characters.">
        <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          <Field label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={128} required />
          <div className="sm:col-span-2"><button disabled={busy === "security"} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--border-strong)] disabled:opacity-50">{busy === "security" ? "Updating…" : "Change password"}</button><Message value={notice.security ?? null} /></div>
        </form>
      </Panel>

      <Panel title="Preferences">
        {account && <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm"><span className="mb-2 block text-xs text-[var(--text-muted)]">Theme preference</span><select value={account.preferences.theme} disabled={busy === "preferences"} onChange={(event) => void savePreferences({ theme: event.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-[var(--text)]"><option value="dark">Dark</option><option value="system">System</option></select></label>
          <label className="flex items-center gap-3 self-end text-sm text-[var(--text-muted)]"><input type="checkbox" checked={account.preferences.notifications} disabled={busy === "preferences"} onChange={(event) => void savePreferences({ notifications: event.target.checked })} className="accent-[var(--accent)]" />Email notifications</label>
        </div>}
        <Message value={notice.preferences ?? null} />
      </Panel>

      <Panel title="Integrations" description="Connection preferences are saved per account. Credentials and live connectivity are managed by your backend operator.">
        <div className="divide-y divide-[var(--border)]">
          {(["kubernetes", "github", "prometheus"] as const).map((kind) => (
            <div key={kind} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div><p className="text-sm font-medium capitalize">{kind === "github" ? "GitHub" : kind}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{account?.integrations[kind] ? "Enabled for this account" : "Not enabled"}</p></div>
              <button type="button" disabled={Boolean(busy)} onClick={() => void setIntegration(kind, !account?.integrations[kind])} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] disabled:opacity-50">{busy === `integration-${kind}` ? "Saving…" : account?.integrations[kind] ? "Disconnect" : "Connect"}</button>
              <Message value={notice[`integration-${kind}`] ?? null} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="API keys" description="Keys are stored hashed. A newly-created key is shown only once.">
        {createdKey && <div className="mb-4 break-all rounded-lg border border-[var(--signal-good)]/20 bg-[var(--signal-good)]/[.06] p-3"><p className="mb-2 text-xs text-[var(--signal-good)]">Copy your key now. You will not be able to view it again.</p><code className="text-sm text-[var(--text)]">{createdKey}</code><button type="button" onClick={() => setCreatedKey(null)} className="ml-3 text-xs text-[var(--text-muted)]">Dismiss</button></div>}
        <form onSubmit={createKey} className="flex flex-wrap gap-3">
          <Field label="Key name" value={keyName} onChange={(event) => setKeyName(event.target.value)} maxLength={80} required className="max-w-sm" />
          <button disabled={busy === "keys"} className="self-end rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm text-[var(--text)] disabled:opacity-50">{busy === "keys" ? "Working…" : "Create API key"}</button>
        </form>
        <Message value={notice.keys ?? null} />
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {account?.api_keys.map((key) => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{key.name} <code className="ml-2 text-xs text-[var(--text-muted)]">{key.prefix}…</code></span><button type="button" disabled={busy === "keys"} onClick={() => void revokeKey(key.id)} className="text-xs text-rose-300 hover:text-rose-200">Revoke</button></li>)}
          {!account?.api_keys.length && <li className="py-3 text-sm text-[var(--text-muted)]">No active API keys.</li>}
        </ul>
      </Panel>

      <Panel title="Plan" description="No billing is enabled.">
        <p className="text-sm font-medium capitalize">{account?.plan ?? "free"} plan · full feature access</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">All product features are included for now.</p>
      </Panel>

      <Panel title="Danger zone" description="Deleting your account permanently removes your profile, API keys, sessions, and saved investigations.">
        <form onSubmit={deleteAccount} className="space-y-4">
          <Field label="Confirm with your password" type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
          <label className="flex items-start gap-2 text-sm text-[var(--text-muted)]"><input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} className="mt-1 accent-rose-400" />I understand that deleting my account is permanent.</label>
          <button disabled={busy === "danger"} className="rounded-lg border border-rose-400/30 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/10 disabled:opacity-50">{busy === "danger" ? "Deleting…" : "Delete account"}</button>
          <Message value={notice.danger ?? null} />
        </form>
      </Panel>
      <Link href="/dashboard" className="inline-flex text-sm text-[var(--text-muted)] hover:text-[var(--text)]">← Back to overview</Link>
      <p className="sr-only">Signed in as {user?.email}</p>
    </div>
  );
}
