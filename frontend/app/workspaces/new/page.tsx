"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { workspaceApi } from "@/lib/workspace-client";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const workspace = await workspaceApi.create(name.trim());
      // The URL is the only source of truth for the active workspace.
      router.replace(`/w/${workspace.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the workspace.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Create a workspace</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        A workspace is an isolated boundary: its members, integrations,
        investigations, and audit trail are reachable only by its members.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium" htmlFor="workspace-name">
          Workspace name
        </label>
        <input
          id="workspace-name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="Platform Reliability"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create workspace"}
          </button>
          <Link href="/workspaces" className="text-sm text-[var(--text-muted)]">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
