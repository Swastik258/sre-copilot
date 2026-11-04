"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/app/w/[slug]/layout";
import {
  workspaceApi,
  type WorkspaceMembersResponse,
  type InvitesResponse,
} from "@/lib/workspace-client";

export default function WorkspaceDashboardPage() {
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMembersResponse | null>(null);
  const [invites, setInvites] = useState<InvitesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      workspaceApi.members(workspace.slug),
      workspaceApi.invites(workspace.slug).catch(() => null),
    ])
      .then(([memberResponse, inviteResponse]) => {
        if (!active) return;
        setMembers(memberResponse);
        setInvites(inviteResponse);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load workspace.");
      });
    return () => {
      active = false;
    };
  }, [workspace.slug]);

  return (
    <section className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--accent)]">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{workspace.name}</h1>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
          /w/{workspace.slug} · your role: {workspace.role}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-[var(--border)] p-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--text-subtle)]">
            Members
          </p>
          <p className="mt-2 text-2xl font-semibold">{members?.total ?? "—"}</p>
          <Link
            href={`/w/${workspace.slug}/members`}
            className="mt-3 inline-block text-sm text-[var(--accent)]"
          >
            Manage members
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--text-subtle)]">
            Pending invites
          </p>
          <p className="mt-2 text-2xl font-semibold">{invites?.total ?? "—"}</p>
          <Link
            href={`/w/${workspace.slug}/settings`}
            className="mt-3 inline-block text-sm text-[var(--accent)]"
          >
            Invite people
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--text-subtle)]">
            Product surfaces
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <Link href="/dashboard" className="block hover:text-[var(--accent)]">
              Overview (legacy route)
            </Link>
            <Link href="/kubernetes" className="block hover:text-[var(--accent)]">
              Kubernetes
            </Link>
            <Link href="/audit" className="block hover:text-[var(--accent)]">
              Audit log
            </Link>
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        Every query in this workspace is scoped to it. Data belonging to other
        workspaces is unreachable from here by any path.
      </p>
    </section>
  );
}
