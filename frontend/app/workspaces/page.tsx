"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  workspaceApi,
  type Workspace,
} from "@/lib/workspace-client";
import { useAuth } from "@/lib/auth-client";

export default function WorkspacesPage() {
  const { user, loading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    workspaceApi
      .list()
      .then((response) => {
        if (active) setWorkspaces(response.workspaces);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load workspaces.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!loading && !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]">
        <Link href="/login" className="text-sm text-[var(--accent)]">
          Sign in to see your workspaces
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your workspaces</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Each workspace is an isolated boundary: members of one can never
            reach another&apos;s data.
          </p>
        </div>
        <Link
          href="/workspaces/new"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
        >
          New workspace
        </Link>
      </header>

      {error && (
        <p className="mt-6 rounded-lg border border-[var(--border)] p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <ul className="mt-8 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
        {!workspaces && <li className="p-4 text-sm text-[var(--text-muted)]">Loading…</li>}
        {workspaces?.length === 0 && (
          <li className="p-4 text-sm text-[var(--text-muted)]">
            No workspaces yet — create one to get started.
          </li>
        )}
        {workspaces?.map((workspace) => (
          <li key={workspace.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{workspace.name}</p>
              <p className="font-mono text-[11px] text-[var(--text-subtle)]">
                /w/{workspace.slug}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase text-[var(--text-subtle)]">
                {workspace.role}
              </span>
              <Link
                href={`/w/${workspace.slug}/dashboard`}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg-elevated)]"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
