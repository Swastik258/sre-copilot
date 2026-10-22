"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type Runbook } from "@/lib/api";

const SEVERITY_STYLES: Record<string, string> = {
  info: "text-secondary",
  low: "text-info",
  medium: "text-warn",
  high: "text-bad",
  critical: "text-bad",
};

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "application", label: "Application" },
  { value: "ci", label: "CI/CD" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "observability", label: "Observability" },
  { value: "general", label: "General" },
];

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selected, setSelected] = useState<Runbook | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.runbooks.list(
        query.trim() || undefined,
        category || undefined,
      );
      setRunbooks(response.runbooks);
      setSelected((current) => {
        if (current && response.runbooks.some((item) => item.id === current.id)) {
          return current;
        }
        return response.runbooks[0] ?? null;
      });
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not load runbooks",
      );
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="animate-fade-up">
          <span className="label-caps">Operator library</span>
          <h1 className="mt-3 font-serif text-display-sm text-primary">Runbooks</h1>
          <p className="mt-2 max-w-prose text-dense text-tertiary">
            Read-only triage sequences for evidence-backed findings. Every step is
            safe to inspect; any state-changing remediation is outside this
            product and remains an operator decision.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] animate-fade-in">
          <aside className="min-w-0 space-y-4">
            <div className="card p-4">
              <label className="block">
                <span className="label-caps">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="oom, redis, replace…"
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary placeholder:text-tertiary"
                />
              </label>
              <label className="mt-3 block">
                <span className="label-caps">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-ghost mt-3 w-full text-[12px]"
                onClick={() => void load()}
                disabled={loading}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>

            {error && (
              <p className="font-mono text-[11.5px] text-bad" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-2">
              {runbooks.map((runbook) => {
                const active = selected?.id === runbook.id;
                return (
                  <button
                    key={runbook.id}
                    type="button"
                    onClick={() => setSelected(runbook)}
                    className={`w-full rounded-[4px] border p-3 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-hairline hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] leading-snug text-primary">
                        {runbook.title}
                      </span>
                      <span
                        className={`font-mono text-[9.5px] uppercase tracking-[0.1em] ${
                          SEVERITY_STYLES[runbook.severity] ?? "text-tertiary"
                        }`}
                      >
                        {runbook.severity}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-tertiary">
                      {runbook.category} · {runbook.steps.length} steps
                    </div>
                  </button>
                );
              })}
              {!loading && runbooks.length === 0 && (
                <p className="p-3 font-mono text-[11px] text-tertiary">
                  No runbooks match this filter.
                </p>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            {selected ? (
              <RunbookDetail runbook={selected} />
            ) : (
              <div className="card grid min-h-64 place-items-center p-6">
                <p className="font-mono text-[11.5px] text-tertiary">
                  Select a runbook to inspect its safe triage sequence.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RunbookDetail({ runbook }: { runbook: Runbook }) {
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label-caps">{runbook.category}</div>
            <h2 className="mt-2 font-serif text-2xl text-primary">{runbook.title}</h2>
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
              SEVERITY_STYLES[runbook.severity] ?? "text-tertiary"
            }`}
          >
            {runbook.severity}
          </span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-secondary">
          {runbook.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {runbook.symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-[4px] border border-hairline px-2 py-1 font-mono text-[10px] text-tertiary"
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="label-caps">Read-only triage</div>
        <ol className="mt-3 space-y-4">
          {runbook.steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[4px] border border-hairline font-mono text-[10px] text-tertiary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-primary">{step.title}</div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-tertiary">
                  {step.action}
                </p>
                {step.command && (
                  <pre className="mt-2 overflow-x-auto rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-2.5 font-mono text-[11px] text-secondary">
                    {step.command}
                  </pre>
                )}
                {step.expected && (
                  <p className="mt-1 font-mono text-[10px] text-tertiary">
                    Expected · {step.expected}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-[4px] border border-warn bg-accent-soft p-5">
        <div className="label-caps">Guardrails</div>
        <ul className="mt-2 space-y-2 text-[11.5px] text-secondary">
          {runbook.guardrails.map((guardrail) => (
            <li key={guardrail} className="flex gap-2">
              <span className="text-warn">·</span>
              <span>{guardrail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[10px] text-tertiary">
          This product never executes a remediation. Changes are proposals.
        </p>
      </div>
    </div>
  );
}
