"use client";

/**
 * Workspace switcher for the top navigation.
 *
 * The URL is the only source of truth for the active workspace: switching
 * simply navigates to `/w/[slug]/...`. A `workspace_slug` cookie is never
 * used for authorization, only (potentially) to choose a post-login redirect.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { workspaceApi, type Workspace } from "@/lib/workspace-client";

export function WorkspaceSwitcher({ activeSlug }: { activeSlug?: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    workspaceApi
      .list()
      .then((response) => {
        if (active) setWorkspaces(response.workspaces);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  const current =
    workspaces?.find((workspace) => workspace.slug === activeSlug) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
      >
        <span className="font-medium">{current?.name ?? "Workspaces"}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-40 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 shadow-lg"
        >
          {(workspaces ?? []).map((workspace) => (
            <Link
              key={workspace.id}
              href={`/w/${workspace.slug}/dashboard`}
              role="menuitem"
              onClick={() => setOpen(false)}
              aria-current={workspace.slug === activeSlug ? "true" : undefined}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg)]"
            >
              <span className="truncate">{workspace.name}</span>
              <span className="font-mono text-[10px] uppercase text-[var(--text-subtle)]">
                {workspace.role}
              </span>
            </Link>
          ))}
          <Link
            href="/workspaces"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg)]"
          >
            All workspaces…
          </Link>
        </div>
      )}
    </div>
  );
}
