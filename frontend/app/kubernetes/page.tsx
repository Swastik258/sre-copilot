"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiRequestError,
  type K8sPod,
  type PodDiagnosisResponse,
} from "@/lib/api";

type Phase = "loading" | "ready" | "not_configured" | "error";

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-hairline-strong text-paper-300",
  low: "border-sky-500/30 text-sky-700",
  medium: "border-amber-500/40 text-amber-700",
  high: "border-rose-500/40 text-rose-700",
  critical: "border-rose-600/60 text-rose-700",
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="label-caps">Read-only cluster diagnostics</span>
            <h1 className="mt-3 font-serif text-display-sm text-paper-50">Kubernetes</h1>
            <p className="mt-2 max-w-prose text-dense text-paper-400">
              Select a pod to produce an evidence-backed diagnosis. Facts are cited; nothing is changed.
            </p>
          </div>
          {demo && (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-amber-700">
              demo data · fixtures
            </span>
          )}
        </div>

        {phase === "not_configured" && (
          <SetupNotice message={message} />
        )}

        {phase === "error" && (
          <p className="mt-8 font-mono text-sm text-rose-600">{message}</p>
        )}

        {phase === "loading" && (
          <p className="mt-8 font-mono text-sm text-paper-400">Loading cluster…</p>
        )}

        {phase === "ready" && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <div>
              <label className="label-caps" htmlFor="ns">
                Namespace
              </label>
              <select
                id="ns"
                value={namespace}
                onChange={(e) => void onNamespaceChange(e.target.value)}
                className="mt-2 w-full rounded-lg border border-hairline-strong bg-ink-850 px-3 py-2 text-sm text-paper-100"
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
                  <p className="font-mono text-[11px] text-paper-400">No pods found.</p>
                )}
                {pods.map((pod) => (
                  <button
                    key={`${pod.namespace}/${pod.name}`}
                    type="button"
                    onClick={() => void diagnose(pod)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                      selected?.name === pod.name
                        ? "border-amber-500/50 bg-amber-500/[0.06]"
                        : "border-hairline hover:border-hairline-strong hover:bg-ink-850"
                    }`}
                  >
                    <div className="truncate text-sm text-paper-100">{pod.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-paper-400">
                      <PodDot phase={pod.phase} />
                      <span>{pod.namespace}</span>
                      <span>· {pod.phase}</span>
                      {pod.containers.some((c) => c.restart_count > 0) && (
                        <span className="text-amber-600">
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
                <div className="grid h-full place-items-center rounded-xl border border-hairline bg-ink-950/40 p-12 text-center">
                  <p className="max-w-sm font-mono text-[12px] text-paper-400">
                    Select a pod to run a read-only diagnosis. Results cite the exact
                    evidence used; no changes are made to the cluster.
                  </p>
                </div>
              )}
              {selected && diagnosing && (
                <p className="font-mono text-sm text-paper-400">
                  Diagnosing {selected.name}…
                </p>
              )}
              {result && <DiagnosisView result={result} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupNotice({ message }: { message: string | null }) {
  return (
    <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-6">
      <h2 className="font-serif text-xl text-paper-50">Kubernetes is not configured</h2>
      <p className="mt-2 text-sm text-paper-300">
        {message ?? "The read-only Kubernetes integration is disabled."}
      </p>
      <p className="mt-3 text-sm text-paper-300">
        To explore with labelled demo fixtures, set:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-hairline-strong bg-ink-950 p-3 font-mono text-[12px] text-paper-200">
{`KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=true`}
      </pre>
      <p className="mt-3 text-xs text-paper-400">
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
      <div className="rounded-xl border border-hairline bg-ink-950/40 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-400">
              {pod.namespace}/{pod.name}
            </div>
            <h2 className="mt-2 font-serif text-xl text-paper-50">{diagnosis.summary}</h2>
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
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
              style={{ width: `${Math.round(diagnosis.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-paper-400">
            {Math.round(diagnosis.confidence * 100)}% confidence
            {diagnosis.confidence_basis ? ` — ${diagnosis.confidence_basis}` : ""}
          </span>
        </div>
      </div>

      <Section title="Confirmed observations">
        <ul className="space-y-1.5">
          {diagnosis.confirmed_observations.map((o, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-paper-200">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Hypotheses">
        {diagnosis.hypotheses.length === 0 && (
          <p className="text-[12.5px] text-paper-400">
            No failure hypotheses matched the available evidence.
          </p>
        )}
        <div className="space-y-3">
          {diagnosis.hypotheses.map((h, i) => (
            <div key={i} className="rounded-lg border border-hairline p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-paper-100">{h.statement}</p>
                <span className="shrink-0 font-mono text-[11px] text-paper-400">
                  {Math.round(h.confidence * 100)}%
                </span>
              </div>
              {h.reasoning && (
                <p className="mt-2 text-[12px] text-paper-300">{h.reasoning}</p>
              )}
              {h.evidence_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {h.evidence_ids.map((id) => (
                    <span
                      key={id}
                      className="rounded border border-hairline-strong px-1.5 py-0.5 font-mono text-[10px] text-paper-400"
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
              <li key={i} className="rounded-lg border border-hairline p-3">
                <code className="block break-all font-mono text-[12px] text-paper-100">
                  {s.action}
                </code>
                {s.purpose && (
                  <p className="mt-1 text-[11.5px] text-paper-400">{s.purpose}</p>
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
              <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-paper-100">{r.title}</p>
                  <Badge tone="warn">changes state · {r.risk}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-paper-300">{r.description}</p>
                {r.rollback && (
                  <p className="mt-2 text-[11.5px] text-paper-400">
                    <span className="text-paper-300">Rollback:</span> {r.rollback}
                  </p>
                )}
                {r.verification && (
                  <p className="mt-1 text-[11.5px] text-paper-400">
                    <span className="text-paper-300">Verify:</span> {r.verification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {diagnosis.missing_evidence.length > 0 && (
        <Section title="Missing evidence">
          <ul className="space-y-1 text-[12px] text-paper-400">
            {diagnosis.missing_evidence.map((m, i) => (
              <li key={i}>· {m}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Evidence (${evidence.length})`}>
        <div className="space-y-2">
          {evidence.map((e) => (
            <div key={e.id} className="rounded-lg border border-hairline p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                    SEVERITY_STYLES[e.severity] ?? SEVERITY_STYLES.info
                  }`}
                >
                  {e.severity}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-paper-400">
                  {e.source_type}
                </span>
                {e.demo && <Badge tone="warn">demo</Badge>}
                <span className="font-mono text-[10px] text-paper-400">
                  {e.provenance}
                </span>
              </div>
              <p className="mt-2 break-words text-[12px] text-paper-200">{e.summary}</p>
              {e.integrity && (
                <p className="mt-1 font-mono text-[10px] text-paper-400">
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
    good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    neutral: "border-hairline-strong text-paper-300",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${styles}`}
    >
      {children}
    </span>
  );
}
