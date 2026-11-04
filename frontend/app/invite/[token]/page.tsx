"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { workspaceApi, type Workspace } from "@/lib/workspace-client";
import { useAuth } from "@/lib/auth-client";

type Status = "idle" | "pending" | "accepted" | "error";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setStatus("pending");
    setError(null);
    try {
      const response = await workspaceApi.acceptInvite(token);
      setWorkspace(response.workspace);
      setStatus("accepted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "This invite cannot be accepted.");
      setStatus("error");
    }
  }

  if (status === "accepted" && workspace) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Welcome to {workspace.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You are now a member with the <strong>{workspace.role}</strong> role.
        </p>
        <Link
          href={`/w/${workspace.slug}/dashboard`}
          className="mt-6 inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
        >
          Go to the workspace
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Workspace invitation</h1>
      {!loading && !user && (
        <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          <p>Sign in with the invited email address to accept this invite.</p>
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--accent)]"
          >
            Sign in
          </Link>
        </div>
      )}
      {user && status !== "pending" && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => void accept()}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
          >
            Accept invitation
          </button>
        </div>
      )}
      {status === "pending" && <p className="mt-6 text-sm text-[var(--text-muted)]">Accepting…</p>}
      {error && (
        <p className="mt-6 rounded-lg border border-[var(--border)] p-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </main>
  );
}
