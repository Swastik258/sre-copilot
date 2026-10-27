"use client";

import { useState } from "react";
import {
  api,
  ApiRequestError,
  type GeneratedFile,
  type InfraGenerateResponse,
  type InfraKind,
} from "@/lib/api";

const KINDS: { value: InfraKind; label: string }[] = [
  { value: "kubernetes_deployment", label: "Kubernetes Deployment" },
  { value: "kubernetes_service", label: "Kubernetes Service" },
  { value: "terraform_module", label: "Terraform module" },
];

const FINDING_STYLES: Record<string, string> = {
  info: "text-secondary",
  low: "text-info",
  medium: "text-warn",
  high: "text-bad",
  critical: "text-bad",
};

export default function InfraCodePage() {
  const [kind, setKind] = useState<InfraKind>("kubernetes_deployment");
  const [name, setName] = useState("checkout");
  const [namespace, setNamespace] = useState("shop");
  const [image, setImage] = useState("ghcr.io/acme/checkout:1.4.2");
  const [replicas, setReplicas] = useState(2);
  const [port, setPort] = useState(8080);
  const [environment, setEnvironment] = useState("production");
  const [cpuRequest, setCpuRequest] = useState("100m");
  const [memoryRequest, setMemoryRequest] = useState("128Mi");
  const [cpuLimit, setCpuLimit] = useState("500m");
  const [memoryLimit, setMemoryLimit] = useState("512Mi");
  const [intent, setIntent] = useState("");
  const [result, setResult] = useState<InfraGenerateResponse | null>(null);
  const [activePath, setActivePath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeFile: GeneratedFile | undefined =
    result?.files.find((file) => file.path === activePath) ?? result?.files[0];

  async function generate() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const response = await api.infra.generate({
        kind,
        name,
        namespace,
        image,
        replicas,
        port,
        environment,
        cpu_request: cpuRequest,
        memory_request: memoryRequest,
        cpu_limit: cpuLimit,
        memory_limit: memoryLimit,
        intent: intent.trim() || null,
      });
      setResult(response);
      setActivePath(response.files[0]?.path ?? "");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Generation failed",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyActive() {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="animate-fade-up">
          <span className="label-caps">Proposal only</span>
          <h1 className="mt-3 font-serif text-display-sm text-primary">
            Infrastructure code
          </h1>
          <p className="mt-2 max-w-prose text-dense text-tertiary">
            Generate a baseline Deployment, Service, or Terraform module with
            reliability and security defaults. Review the policy notes before
            anything reaches a repository.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] animate-fade-in">
          <aside className="card p-5">
            <div className="label-caps">Inputs</div>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="label-caps">Kind</span>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as InfraKind)}
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                >
                  {KINDS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="label-caps">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Namespace</span>
                  <input
                    value={namespace}
                    onChange={(event) => setNamespace(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
              </div>
              <label className="block">
                <span className="label-caps">Image</span>
                <input
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label>
                  <span className="label-caps">Replicas</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={replicas}
                    onChange={(event) => setReplicas(Number(event.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Port</span>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={port}
                    onChange={(event) => setPort(Number(event.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Env</span>
                  <input
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="label-caps">CPU request</span>
                  <input
                    value={cpuRequest}
                    onChange={(event) => setCpuRequest(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Memory request</span>
                  <input
                    value={memoryRequest}
                    onChange={(event) => setMemoryRequest(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">CPU limit</span>
                  <input
                    value={cpuLimit}
                    onChange={(event) => setCpuLimit(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Memory limit</span>
                  <input
                    value={memoryLimit}
                    onChange={(event) => setMemoryLimit(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
              </div>
              <label className="block">
                <span className="label-caps">Intent (optional)</span>
                <textarea
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  rows={2}
                  placeholder="Serve checkout traffic with a reversible rollout."
                  className="mt-1 w-full resize-y rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 text-[12px] text-primary placeholder:text-tertiary"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn-accent mt-4 w-full disabled:opacity-50"
              onClick={() => void generate()}
              disabled={busy || !name.trim()}
            >
              {busy ? "Generating…" : "Generate proposal"}
            </button>
            {error && (
              <p className="mt-3 font-mono text-[11px] text-bad" role="alert">
                {error}
              </p>
            )}
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-tertiary">
              No repository write, kubectl apply, or terraform apply. Output is
              returned in memory only.
            </p>
          </aside>

          <section className="min-w-0">
            {!result ? (
              <div className="card grid min-h-96 place-items-center p-6 text-center">
                <div>
                  <div className="label-caps">Waiting for inputs</div>
                  <p className="mt-3 max-w-sm text-sm text-tertiary">
                    Generate a proposal to inspect files, baseline guardrails, and
                    policy findings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="label-caps">Generated summary</div>
                    <p className="mt-1 text-[13px] text-primary">{result.summary}</p>
                  </div>
                  <span className="tag-quiet">proposal</span>
                </div>

                <div className="overflow-hidden rounded-[4px] border border-hairline">
                  <div className="flex flex-wrap gap-1 border-b border-hairline bg-[var(--bg-subtle)] p-2">
                    {result.files.map((file) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setActivePath(file.path)}
                        className={`rounded-[4px] px-2.5 py-1.5 font-mono text-[10.5px] transition-colors ${
                          activeFile?.path === file.path
                            ? "bg-[var(--bg)] text-primary"
                            : "text-tertiary hover:text-primary"
                        }`}
                      >
                        {file.path}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ml-auto rounded-[4px] px-2.5 py-1.5 font-mono text-[10.5px] text-tertiary transition-colors hover:text-primary"
                      onClick={() => void copyActive()}
                    >
                      {copied ? "copied" : "copy"}
                    </button>
                  </div>
                  <pre className="max-h-[34rem] overflow-auto bg-[var(--bg)] p-4 font-mono text-[11px] leading-relaxed text-secondary">
                    {activeFile?.content ?? ""}
                  </pre>
                </div>

                <div className="card p-5">
                  <div className="label-caps">Policy findings</div>
                  {result.findings.length === 0 ? (
                    <p className="mt-2 font-mono text-[11px] text-good">
                      No baseline policy findings. Human review is still required.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-hairline">
                      {result.findings.map((finding) => (
                        <div key={`${finding.rule}-${finding.path ?? ""}`} className="py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-[10.5px] text-primary">
                              {finding.rule}
                            </span>
                            <span
                              className={`font-mono text-[9.5px] uppercase tracking-[0.1em] ${
                                FINDING_STYLES[finding.severity] ?? "text-tertiary"
                              }`}
                            >
                              {finding.severity}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-tertiary">
                            {finding.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
