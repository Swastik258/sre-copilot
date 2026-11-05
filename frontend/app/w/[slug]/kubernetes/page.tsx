"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/app/w/[slug]/layout";
import {
  workspaceApi,
  type ClusterVerifyResult,
  type WorkspaceCluster,
} from "@/lib/workspace-client";

/**
 * Connect the workspace's own Kubernetes clusters.
 *
 * The kubeconfig is encrypted at rest and is never returned by the API;
 * this page only ever shows metadata (name, context, API server URL).
 * Until a cluster is connected here, the workspace falls back to the
 * deployment's shared, operator-configured clusters.
 */

export default function WorkspaceKubernetesPage() {
  const { workspace } = useWorkspace();
  const [clusters, setClusters] = useState<WorkspaceCluster[] | null>(null);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [kubeconfig, setKubeconfig] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verify, setVerify] = useState<Record<string, ClusterVerifyResult>>({});
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  async function reload() {
    try {
      const response = await workspaceApi.registeredClusters(workspace.slug);
      setClusters(response.clusters);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clusters.");
    }
  }

  useEffect(() => {
    void reload();
  }, [workspace.slug]);

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const created = await workspaceApi.registerCluster(workspace.slug, {
        name: name.trim(),
        kubeconfig,
        context: context.trim() || undefined,
      });
      setClusters((current) => [...(current ?? []), created]);
      setNotice(`Connected “${created.name}”.`);
      setName("");
      setContext("");
      setKubeconfig("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect that cluster.");
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await workspaceApi.deleteCluster(workspace.slug, id);
      setClusters((current) => (current ?? []).filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect that cluster.");
    }
  }

  async function test(id: string) {
    setError(null);
    setVerify((current) => ({ ...current, [id]: { ok: false, cluster: "…" } }));
    try {
      const result = await workspaceApi.verifyCluster(workspace.slug, id);
      setVerify((current) => ({ ...current, [id]: result }));
    } catch (err) {
      setVerify((current) => ({
        ...current,
        [id]: {
          ok: false,
          cluster: "",
          error: err instanceof Error ? err.message : "Verification failed.",
        },
      }));
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Kubernetes · {workspace.name}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Connect your own cluster by pasting a read-only kubeconfig. It is
          encrypted at rest and never shown again. Without one, this workspace
          uses the deployment&apos;s shared clusters.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-[var(--border)] p-3 text-sm text-red-400">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg border border-[var(--border)] p-3 text-sm text-emerald-400">{notice}</p>
      )}

      <ul className="space-y-3">
        {clusters === null && (
          <li className="rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
            Loading…
          </li>
        )}
        {clusters?.length === 0 && (
          <li className="rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
            No workspace clusters connected yet.
          </li>
        )}
        {clusters?.map((cluster) => {
          const result = verify[cluster.id];
          return (
            <li
              key={cluster.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{cluster.name}</p>
                  <p className="font-mono text-[11px] text-[var(--text-subtle)]">
                    {cluster.context ?? "default context"} · {cluster.server ?? "server hidden"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void test(cluster.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--bg)]"
                  >
                    Test connection
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void remove(cluster.id)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--bg)]"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
              {result && (
                <p
                  className={`mt-2 font-mono text-[11px] ${
                    result.ok ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {result.ok
                    ? `Reachable — ${result.namespaces ?? 0} namespaces visible.`
                    : `Not reachable: ${result.error ?? "unknown error"}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {canManage && (
        <form onSubmit={connect} className="space-y-3">
          <h2 className="text-lg font-semibold">Connect a cluster</h2>
          <div className="flex flex-wrap gap-3">
            <input
              required
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Cluster name (e.g. tws-cluster)"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <input
              value={context}
              onChange={(event) => setContext(event.currentTarget.value)}
              placeholder="Context (optional)"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </div>
          <textarea
            required
            value={kubeconfig}
            onChange={(event) => setKubeconfig(event.currentTarget.value)}
            placeholder="Paste a read-only kubeconfig YAML…"
            rows={10}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-elevated)]"
          >
            Connect cluster
          </button>
        </form>
      )}

      <p className="text-sm">
        <Link href={`/w/${workspace.slug}/dashboard`} className="text-[var(--accent)]">
          ← Back to dashboard
        </Link>
      </p>
    </section>
  );
}
