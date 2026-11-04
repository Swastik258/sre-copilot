"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/app/w/[slug]/layout";
import {
  workspaceApi,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/lib/workspace-client";

const ROLES: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];

export default function WorkspaceMembersPage() {
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");

  async function reload() {
    try {
      const response = await workspaceApi.members(workspace.slug);
      setMembers(response.members);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.slug]);

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await workspaceApi.addMember(workspace.slug, email.trim(), role);
      setEmail("");
      setNotice(`Added ${email.trim()} as ${role}.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that member.");
    }
  }

  async function changeRole(userId: string, nextRole: WorkspaceRole) {
    setError(null);
    try {
      await workspaceApi.updateMemberRole(workspace.slug, userId, nextRole);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change that role.");
    }
  }

  async function removeMember(userId: string) {
    setError(null);
    try {
      await workspaceApi.removeMember(workspace.slug, userId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that member.");
    }
  }

  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Members · {workspace.name}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Owners and admins manage the roster. The last owner can never be
          removed or demoted.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-[var(--border)] p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-[var(--border)] p-3 text-sm text-emerald-400">
          {notice}
        </p>
      )}

      {canManage && (
        <form onSubmit={addMember} className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="teammate@example.com"
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.currentTarget.value as WorkspaceRole)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          >
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
          >
            Add member
          </button>
        </form>
      )}

      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
        {loading && <li className="p-4 text-sm text-[var(--text-muted)]">Loading…</li>}
        {members.map((member) => (
          <li key={member.user_id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.display_name || member.email || member.user_id}
              </p>
              <p className="truncate font-mono text-[11px] text-[var(--text-subtle)]">
                {member.email ?? member.user_id}
              </p>
            </div>
            {canManage ? (
              <>
                <select
                  value={member.role}
                  onChange={(event) =>
                    void changeRole(member.user_id, event.currentTarget.value as WorkspaceRole)
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
                >
                  {ROLES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void removeMember(member.user_id)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--bg-elevated)]"
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="font-mono text-[11px] uppercase text-[var(--text-subtle)]">
                {member.role}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
