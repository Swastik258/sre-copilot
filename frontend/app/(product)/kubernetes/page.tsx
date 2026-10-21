"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiRequestError,
  type AIStructuredDiagnosis,
  type K8sPod,
  type PodDiagnosisResponse,
} from "@/lib/api";

type Phase = "loading" | "ready" | "not_configured" | "error";

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-[var(--border-strong)] text-secondary",
  low: "border-info text-info",
  medium: "border-warn text-warn",
  high: "border-bad text-bad",
  critical: "border-bad text-bad",
};

export default function KubernetesPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespace, setNamespace] = useState<string>("");
  const [pods, setPods] = useState<K8sPod[]>([]);
  const [selected, setSelected] = useState<K8sPod | null>(null);
  const [result, setResult] = useState<PodDiagnosisResponse | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const load = useCallback(async (ns?: string) => {
    setPhase("loading");
    setMessage(null);
    try {
      const [clusters, nsList] = await Promise.all([
        api.kubernetes.clusters(),
        api.kubernetes.namespaces(),
      ]);
      setDemo(clusters.demo);
      const names = nsList.namespaces.map((n) => n.name);
      setNamespaces(names);
      const activeNs = ns ?? names[0] ?? "";
      setNamespace(activeNs);
      const podList = await api.kubernetes.pods(activeNs || undefined);
      setPods(podList.pods);
      setPhase("ready");
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "not_configured") {
        setPhase("not_configured");
        setMessage(err.message);
      } else {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "Failed to load cluster data");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onNamespaceChange = useCallback(
    async (ns: string) => {
      setNamespace(ns);
      setSelected(null);
      setResult(null);
      setMessage(null);
      try {
        const podList = await api.kubernetes.pods(ns || undefined);
        setPods(podList.pods);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to load pods");
      }
    },
    [],
  );

  const diagnose = useCallback(async (pod: K8sPod) => {
    setSelected(pod);
    setResult(null);
    setMessage(null);
    setDiagnosing(true);
    try {
      const res = await api.kubernetes.diagnose(pod.namespace, pod.name);
      setResult(res);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Diagnosis failed");
    } finally {
      setDiagnosing(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Read-only cluster diagnostics</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Kubernetes</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Select a pod to produce an evidence-backed diagnosis. Facts are cited; nothing is changed.
            </p>
          </div>
          {demo && (
            <span className="rounded-full border border-warn bg-accent-soft px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-warn">
              demo data · fixtures
            </span>
          )}
        </div>

        {phase === "not_configured" && (
          <SetupNotice message={message} />
        )}

        {phase === "error" && (
          <p className="mt-8 font-mono text-sm text-bad">{message}</p>
        )}

        {phase === "loading" && (
          <p className="mt-8 font-mono text-sm text-tertiary">Loading cluster…</p>
        )}

        {phase === "ready" && message && (
          <p className="mt-6 font-mono text-sm text-bad">{message}</p>
        )}

        {phase === "ready" && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] animate-fade-in">
            <div>
              <label className="label-caps" htmlFor="ns">
                Namespace
              </label>
              <select
                id="ns"
                value={namespace}
                onChange={(e) => void onNamespaceChange(e.target.value)}
                className="mt-2 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-primary"
              >
                <option value="">all namespaces</option>
                {namespaces.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="mt-5 space-y-2">
                {pods.length === 0 && (
                  <p className="font-mono text-[11px] text-tertiary">No pods found.</p>
                )}
                {pods.map((pod) => (
                  <button
                    key={`${pod.namespace}/${pod.name}`}
                    type="button"
                    onClick={() => void diagnose(pod)}
                    className={`block w-full rounded-[4px] border px-3 py-2 text-left transition ${
                      selected?.name === pod.name
                        ? "border-warn bg-accent-soft"
                        : "border-hairline hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <div className="truncate text-sm text-primary">{pod.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-tertiary">
                      <PodDot phase={pod.phase} />
                      <span>{pod.namespace}</span>
                      <span>· {pod.phase}</span>
                      {pod.containers.some((c) => c.restart_count > 0) && (
                        <span className="text-accent">
                          · {pod.containers.reduce((a, c) => a + c.restart_count, 0)} restarts
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              {!selected && (
                <div className="grid h-full place-items-center rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-12 text-center">
                  <p className="max-w-sm font-mono text-[12px] text-tertiary">
                    Select a pod to run a read-only diagnosis. Results cite the exact
                    evidence used; no changes are made to the cluster.
                  </p>
                </div>
              )}
              {selected && diagnosing && (
                <p className="font-mono text-sm text-tertiary">
                  Diagnosing {selected.name}…
                </p>
              )}
              {result && <DiagnosisView key={`${result.pod.namespace}/${result.pod.name}`} result={result} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupNotice({ message }: { message: string | null }) {
  return (
    <div className="mt-8 rounded-[4px] border border-warn bg-accent-soft p-6">
      <h2 className="font-serif text-xl text-primary">Kubernetes is not configured</h2>
      <p className="mt-2 text-sm text-secondary">
        {message ?? "The read-only Kubernetes integration is disabled."}
      </p>
      <p className="mt-3 text-sm text-secondary">
        To explore with labelled demo fixtures, set:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 font-mono text-[12px] text-primary">
{`KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=true`}
      </pre>
      <p className="mt-3 text-xs text-tertiary">
        For a live cluster, also set <code className="font-mono">KUBERNETES_KUBECONFIG</code>{" "}
        (or <code className="font-mono">KUBERNETES_IN_CLUSTER=true</code>) and apply the
        read-only RBAC in docs/KUBERNETES_SETUP.md.
      </p>
    </div>
  );
}

function PodDot({ phase }: { phase: string }) {
  const cls =
    phase === "Running"
      ? "dot-good"
      : phase === "Pending"
        ? "dot-warn"
        : phase === "Succeeded"
          ? "dot-good"
          : "dot-bad";
  return <span className={`dot ${cls}`} />;
}

function DiagnosisView({ result }: { result: PodDiagnosisResponse }) {
  const { diagnosis, evidence, pod } = result;
  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
              {pod.namespace}/{pod.name}
            </div>
            <h2 className="mt-2 font-serif text-xl text-primary">{diagnosis.summary}</h2>
          </div>
          <div className="flex items-center gap-2">
            {diagnosis.model_generated ? (
              <Badge tone="warn">AI-generated</Badge>
            ) : (
              <Badge tone="good">deterministic rules</Badge>
            )}
            <Badge tone="neutral">risk: {diagnosis.risk_level}</Badge>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-[var(--border-strong)]">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(diagnosis.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-tertiary">
            {Math.round(diagnosis.confidence * 100)}% confidence
            {diagnosis.confidence_basis ? ` — ${diagnosis.confidence_basis}` : ""}
          </span>
        </div>
      </div>

      <AIExplanation pod={pod} evidence={evidence} />

      <Section title="Confirmed observations">
        <ul className="space-y-1.5">
          {diagnosis.confirmed_observations.map((o, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-primary">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-good" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Hypotheses">
        {diagnosis.hypotheses.length === 0 && (
          <p className="text-[12.5px] text-tertiary">
            No failure hypotheses matched the available evidence.
          </p>
        )}
        <div className="space-y-3">
          {diagnosis.hypotheses.map((h, i) => (
            <div key={i} className="rounded-[4px] border border-hairline p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-primary">{h.statement}</p>
                <span className="shrink-0 font-mono text-[11px] text-tertiary">
                  {Math.round(h.confidence * 100)}%
                </span>
              </div>
              {h.reasoning && (
                <p className="mt-2 text-[12px] text-secondary">{h.reasoning}</p>
              )}
              {h.evidence_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {h.evidence_ids.map((id) => (
                    <span
                      key={id}
                      className="rounded border border-[var(--border-strong)] px-1.5 py-0.5 font-mono text-[10px] text-tertiary"
                    >
                      {id.slice(0, 8)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {diagnosis.next_steps.length > 0 && (
        <Section title="Next diagnostic steps (read-only)">
          <ul className="space-y-2">
            {diagnosis.next_steps.map((s, i) => (
              <li key={i} className="rounded-[4px] border border-hairline p-3">
                <code className="block break-all font-mono text-[12px] text-primary">
                  {s.action}
                </code>
                {s.purpose && (
                  <p className="mt-1 text-[11.5px] text-tertiary">{s.purpose}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {diagnosis.remediation.length > 0 && (
        <Section title="Remediation (requires explicit approval)">
          <div className="space-y-3">
            {diagnosis.remediation.map((r, i) => (
              <div key={i} className="rounded-[4px] border border-warn bg-accent-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-primary">{r.title}</p>
                  <Badge tone="warn">changes state · {r.risk}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-secondary">{r.description}</p>
                {r.rollback && (
                  <p className="mt-2 text-[11.5px] text-tertiary">
                    <span className="text-secondary">Rollback:</span> {r.rollback}
                  </p>
                )}
                {r.verification && (
                  <p className="mt-1 text-[11.5px] text-tertiary">
                    <span className="text-secondary">Verify:</span> {r.verification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {diagnosis.missing_evidence.length > 0 && (
        <Section title="Missing evidence">
          <ul className="space-y-1 text-[12px] text-tertiary">
            {diagnosis.missing_evidence.map((m, i) => (
              <li key={i}>· {m}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Evidence (${evidence.length})`}>
        <div className="space-y-2">
          {evidence.map((e) => (
            <div key={e.id} className="rounded-[4px] border border-hairline p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                    SEVERITY_STYLES[e.severity] ?? SEVERITY_STYLES.info
                  }`}
                >
                  {e.severity}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">
                  {e.source_type}
                </span>
                {e.demo && <Badge tone="warn">demo</Badge>}
                <span className="font-mono text-[10px] text-tertiary">
                  {e.provenance}
                </span>
              </div>
              <p className="mt-2 break-words text-[12px] text-primary">{e.summary}</p>
              {e.integrity && (
                <p className="mt-1 font-mono text-[10px] text-tertiary">
                  sha256: {e.integrity.slice(0, 16)}…
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AIExplanation({
  pod,
  evidence,
}: {
  pod: K8sPod;
  evidence: PodDiagnosisResponse["evidence"];
}) {
  const [ai, setAi] = useState<AIStructuredDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.ai.diagnose({
        question: `Explain the likely cause and the safest next diagnostic steps for ${pod.namespace}/${pod.name}.`,
        surface: "kubernetes",
        // Payloads can contain large log excerpts. The backend prompt uses the
        // already-redacted summaries, so do not send the payloads themselves.
        evidence: evidence.map((item) => ({ ...item, payload: undefined })),
      });
      setAi(result);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "AI explanation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label-caps">AI explanation</div>
          <p className="mt-1 max-w-prose text-[12px] text-tertiary">
            Optional model-generated summary. The deterministic findings above
            remain authoritative, and nothing is executed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void explain()}
          disabled={loading || evidence.length === 0}
          className="btn-ghost text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Asking model…" : ai ? "Ask again" : "Explain with AI"}
        </button>
      </div>

      {error && (
        <p className="mt-3 font-mono text-[11.5px] text-bad" role="alert">
          {error}
        </p>
      )}

      {!ai && !loading && !error && (
        <p className="mt-3 font-mono text-[11.5px] text-tertiary">
          {evidence.length === 0
            ? "No evidence is available to send."
            : "Sends only the cited evidence summaries to the configured AI provider."}
        </p>
      )}

      {ai && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warn">AI-generated</Badge>
            <span className="font-mono text-[10.5px] text-tertiary">
              {ai.model_provider ?? "provider"}/{ai.model_name ?? "model"}
            </span>
            <span className="font-mono text-[10.5px] text-tertiary">
              · {Math.round(ai.confidence * 100)}% confidence
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-primary">{ai.summary}</p>

          {ai.hypotheses.length > 0 && (
            <div>
              <div className="mb-2 label-caps">Model hypotheses</div>
              <div className="space-y-2">
                {ai.hypotheses.map((hypothesis, index) => (
                  <div key={index} className="rounded-[4px] border border-hairline p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[12.5px] text-primary">
                        {hypothesis.explanation}
                      </p>
                      <span className="shrink-0 font-mono text-[10.5px] text-tertiary">
                        {Math.round(hypothesis.confidence * 100)}%
                      </span>
                    </div>
                    {hypothesis.evidence_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {hypothesis.evidence_ids.map((id) => (
                          <span
                            key={id}
                            className="rounded border border-[var(--border-strong)] px-1.5 py-0.5 font-mono text-[10px] text-tertiary"
                          >
                            {id.slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai.next_steps.length > 0 && (
            <div>
              <div className="mb-2 label-caps">Suggested read-only steps</div>
              <ul className="space-y-1.5">
                {ai.next_steps.map((step, index) => (
                  <li key={index} className="flex gap-2 text-[12.5px] text-primary">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ai.proposed_remediation.length > 0 && (
            <div>
              <div className="mb-2 label-caps">Proposed remediation</div>
              <div className="space-y-2">
                {ai.proposed_remediation.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-[4px] border border-warn bg-accent-soft p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12.5px] text-primary">{action.description}</p>
                      <Badge tone="warn">
                        {action.changes_state ? "changes state" : "read-only"} · {action.risk}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-tertiary">
                      {action.requires_approval
                        ? "Requires explicit human approval; never executed automatically."
                        : "Review before acting."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(ai.risks.length > 0 || ai.unknowns.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {ai.risks.length > 0 && (
                <div>
                  <div className="mb-2 label-caps">Risks</div>
                  <ul className="space-y-1 text-[11.5px] text-tertiary">
                    {ai.risks.map((risk, index) => (
                      <li key={index}>· {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.unknowns.length > 0 && (
                <div>
                  <div className="mb-2 label-caps">Unknowns</div>
                  <ul className="space-y-1 text-[11.5px] text-tertiary">
                    {ai.unknowns.map((unknown, index) => (
                      <li key={index}>· {unknown}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 label-caps">{title}</div>
      {children}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "good" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    good: "border-good bg-good-soft text-good",
    warn: "border-warn bg-accent-soft text-warn",
    neutral: "border-[var(--border-strong)] text-secondary",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${styles}`}
    >
      {children}
    </span>
  );
}
