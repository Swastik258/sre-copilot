"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/app/w/[slug]/layout";
import {
  workspaceApi,
  type InviteCreated,
  type WorkspaceInvite,
  type WorkspaceRole,
} from "@/lib/workspace-client";

export default function WorkspaceSettingsPage() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [issuedInvite, setIssuedInvite] = useState<InviteCreated | null>(null);
  const [confirm, setConfirm] = useState("");

  const canManage = workspace.role === "owner" || workspace.role === "admin";

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    workspaceApi
      .invites(workspace.slug)
      .then((response) => {
        if (active) setInvites(response.invites);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [workspace.slug, canManage]);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await workspaceApi.update(workspace.slug, { name: name.trim() });
      setSaved(true);
      router.refresh();
      setName(updated.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    }
  }

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIssuedInvite(null);
    try {
      const created = await workspaceApi.createInvite(
        workspace.slug,
        inviteEmail.trim(),
        inviteRole,
      );
      setIssuedInvite(created);
      setInviteEmail("");
      setInvites((current) => [created, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the invite.");
    }
  }

  async function cancelInvite(inviteId: string) {
    setError(null);
    try {
      await workspaceApi.cancelInvite(workspace.slug, inviteId);
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel that invite.");
    }
  }

  async function deleteWorkspace() {
    setError(null);
    try {
      await workspaceApi.delete(workspace.slug, confirm);
      router.replace("/workspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the workspace.");
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Settings · {workspace.name}</h1>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          /w/{workspace.slug}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-[var(--border)] p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={saveName} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="workspace-name">
          Workspace name
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={!canManage}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
          {canManage && (
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
            >
              Save
            </button>
          )}
          {saved && <span className="self-center text-sm text-emerald-400">Saved.</span>}
        </div>
      </form>

      {canManage && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Invites</h2>
          <form onSubmit={createInvite} className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.currentTarget.value)}
              placeholder="teammate@example.com"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.currentTarget.value as WorkspaceRole)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            >
              {(["admin", "member", "viewer"] as WorkspaceRole[]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
            >
              Create invite
            </button>
          </form>

          {issuedInvite && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm">
              <p className="font-medium">Invite created — share this link once:</p>
              <code className="mt-2 block break-all font-mono text-xs text-[var(--accent)]">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/invite/${issuedInvite.token}`
                  : `/invite/${issuedInvite.token}`}
              </code>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                The token is single-use, expires, and only works for {issuedInvite.email}.
              </p>
            </div>
          )}

          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {invites.length === 0 && (
              <li className="p-4 text-sm text-[var(--text-muted)]">No pending invites.</li>
            )}
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between p-4 text-sm">
                <span className="truncate">
                  {invite.email}
                  <span className="ml-2 font-mono text-[11px] uppercase text-[var(--text-subtle)]">
                    {invite.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void cancelInvite(invite.id)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--bg-elevated)]"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {workspace.role === "owner" && (
        <div className="space-y-3 rounded-xl border border-red-500/40 p-5">
          <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Deleting the workspace permanently removes it and every row it owns.
            Type the slug <code className="font-mono">{workspace.slug}</code> to confirm.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.currentTarget.value)}
              placeholder={workspace.slug}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={confirm !== workspace.slug}
              onClick={() => void deleteWorkspace()}
              className="rounded-lg border border-red-500/60 px-4 py-2 text-sm text-red-400 disabled:opacity-40"
            >
              Delete workspace
            </button>
          </div>
        </div>
      )}

      <p className="text-sm">
        <Link href={`/w/${workspace.slug}/dashboard`} className="text-[var(--accent)]">
          ← Back to dashboard
        </Link>
      </p>
    </section>
  );
}
