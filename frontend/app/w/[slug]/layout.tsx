"use client";

/**
 * Workspace-scoped shell.
 *
 * The URL is the only source of truth: the `[slug]` segment is resolved
 * against the API, which returns an identical 404 for nonexistent workspaces
 * and workspaces the user is not a member of. Either way the user sees the
 * app's not-found page — the response never reveals which case happened.
 */

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { workspaceApi, type Workspace } from "@/lib/workspace-client";
import { useAuth } from "@/lib/auth-client";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

type WorkspaceScope = { workspace: Workspace };

const WorkspaceContext = createContext<WorkspaceScope | null>(null);

export function useWorkspace(): WorkspaceScope {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a /w/[slug] layout");
  }
  return ctx;
}

type Status = "loading" | "ready" | "missing";

export default function WorkspaceScopeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { loading: authLoading, user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    workspaceApi
      .get(slug)
      .then((resolved) => {
        if (!active) return;
        setWorkspace(resolved);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("missing");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (status === "missing") {
    // Identical outcome for "workspace does not exist" and "not a member".
    notFound();
  }

  if (status === "loading" || authLoading || !workspace) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-[var(--text-muted)]">
          {authLoading && !user ? "Checking session…" : "Loading workspace…"}
        </p>
      </main>
    );
  }

  return (
    <WorkspaceContext.Provider value={{ workspace }}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-semibold tracking-tight">
                Tarn
              </Link>
              <span className="text-[var(--text-subtle)]">/</span>
              <WorkspaceSwitcher activeSlug={workspace.slug} />
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href={`/w/${workspace.slug}/dashboard`}
                className="hover:text-[var(--accent)]"
              >
                Dashboard
              </Link>
              <Link
                href={`/w/${workspace.slug}/kubernetes`}
                className="hover:text-[var(--accent)]"
              >
                Kubernetes
              </Link>
              <Link
                href={`/w/${workspace.slug}/members`}
                className="hover:text-[var(--accent)]"
              >
                Members
              </Link>
              <Link
                href={`/w/${workspace.slug}/settings`}
                className="hover:text-[var(--accent)]"
              >
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
}
