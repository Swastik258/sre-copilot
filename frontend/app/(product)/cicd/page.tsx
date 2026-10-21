"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui";
import {
  api,
  ApiRequestError,
  type AIStructuredDiagnosis,
  type EvidenceRecord,
  type GitHubDiagnosisResponse,
  type GitHubJob,
  type GitHubRun,
  type GitHubRunResponse,
} from "@/lib/api";

type Phase = "idle" | "loading" | "ready" | "not_configured" | "error";

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-[var(--border-strong)] text-secondary",
  low: "border-info text-info",
  medium: "border-warn text-warn",
  high: "border-bad text-bad",
  critical: "border-bad text-bad",
};

export default function CicdPage() {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState("");
  const [runs, setRuns] = useState<GitHubRun[]>([]);
  const [selected, setSelected] = useState<GitHubRun | null>(null);
  const [detail, setDetail] = useState<GitHubRunResponse | null>(null);
  const [diagnosis, setDiagnosis] = useState<GitHubDiagnosisResponse | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  async function loadRuns(event?: FormEvent) {
    event?.preventDefault();
    const normalized = repo.trim();
    if (!normalized) {
      setPhase("error");
      setMessage("Enter a repository in owner/name form.");
      return;
    }
    setPhase("loading");
    setMessage(null);
    setRuns([]);
    setSelected(null);
    setDetail(null);
    setDiagnosis(null);
    try {
      const result = await api.github.runs(
        normalized,
        branch.trim() || undefined,
      );
      setActiveRepo(normalized);
      setRuns(result.runs);
      setPhase("ready");
      if (result.runs.length === 0) {
        setMessage("No workflow runs matched this repository and branch.");
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "not_configured") {
        setPhase("not_configured");
        setMessage(err.message);
      } else {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "Failed to load workflow runs");
      }
    }
  }

  async function selectRun(run: GitHubRun) {
    setSelected(run);
    setDetail(null);
    setDiagnosis(null);
    setMessage(null);
    setLoadingRun(true);
    try {
      const result = await api.github.run(activeRepo, run.id);
      setDetail(result);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load workflow run");
    } finally {
      setLoadingRun(false);
    }
  }

  async function diagnose() {
    if (!selected) return;
    setDiagnosing(true);
    setMessage(null);
    try {
      const result = await api.github.diagnose(activeRepo, selected.id);
      setDiagnosis(result);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Diagnosis failed");
    } finally {
      setDiagnosing(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Read-only CI/CD diagnostics</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">
              GitHub Actions
            </h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Load a repository&apos;s workflow runs, inspect the failed job and
              step, and correlate bounded log excerpts into an evidence-backed
              diagnosis. Nothing is triggered, re-run, cancelled, or changed.
            </p>
          </div>
          <Badge tone="good">GET-only · read-only token</Badge>
        </div>

        <form
          onSubmit={(event) => void loadRuns(event)}
          className="mt-8 grid grid-cols-1 gap-3 rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)_auto] sm:items-end"
        >
          <div>
            <label className="label-caps" htmlFor="repo">
              Repository
            </label>
            <input
              id="repo"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="owner/repo"
              autoComplete="off"
              className="mt-2 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-sm text-primary placeholder:text-tertiary"
            />
          </div>
          <div>
            <label className="label-caps" htmlFor="branch">
              Branch (optional)
            </label>
            <input
              id="branch"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="main"
              autoComplete="off"
              className="mt-2 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-sm text-primary placeholder:text-tertiary"
            />
          </div>
          <button
            type="submit"
            disabled={phase === "loading"}
            className="btn-primary h-[42px] whitespace-nowrap text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "loading" ? "Loading…" : "Load runs"}
          </button>
        </form>

        {phase === "not_configured" && <SetupNotice message={message} />}

        {phase === "error" && (
          <p className="mt-6 font-mono text-sm text-bad" role="alert">
            {message}
          </p>
        )}

        {phase === "loading" && (
          <p className="mt-8 font-mono text-sm text-tertiary">
            Loading workflow runs…
          </p>
        )}

        {phase === "ready" && message && (
          <p className="mt-6 font-mono text-sm text-secondary">{message}</p>
        )}

        {phase === "ready" && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] animate-fade-in">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="label-caps">Workflow runs</span>
                <span className="font-mono text-[10.5px] text-tertiary">
                  {runs.length} loaded
                </span>
              </div>
              <div className="space-y-2">
                {runs.length === 0 && (
                  <p className="font-mono text-[11px] text-tertiary">
                    No workflow runs found.
                  </p>
                )}
                {runs.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => void selectRun(run)}
                    className={`block w-full rounded-[4px] border px-3 py-2 text-left transition ${
                      selected?.id === run.id
                        ? "border-warn bg-accent-soft"
                        : "border-hairline hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-primary">
                          {run.name ?? "workflow"}{" "}
                          <span className="font-mono text-[11px] text-tertiary">
                            #{run.run_number ?? run.id}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[10.5px] text-tertiary">
                          {run.display_title ?? run.workflow_path ?? "workflow run"}
                        </div>
                      </div>
                      <span className={`dot ${runDot(run.conclusion, run.status)} mt-1.5`} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-tertiary">
                      <span>{run.conclusion ?? run.status}</span>
                      <span>· {run.branch ?? "unknown branch"}</span>
                      {run.head_sha && <span>· {run.head_sha.slice(0, 7)}</span>}
                      <span>· {formatTime(run.updated_at ?? run.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              {!selected && (
                <div className="grid h-full min-h-[260px] place-items-center rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-12 text-center">
                  <p className="max-w-sm font-mono text-[12px] text-tertiary">
                    Select a workflow run to inspect its jobs and steps, then
                    diagnose the failure using the read-only API.
                  </p>
                </div>
              )}

              {selected && loadingRun && (
                <p className="font-mono text-sm text-tertiary">
                  Loading run #{selected.run_number ?? selected.id}…
                </p>
              )}

              {detail && (
                <RunView
                  detail={detail}
                  diagnosis={diagnosis}
                  diagnosing={diagnosing}
                  onDiagnose={() => void diagnose()}
                />
              )}
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
      <h2 className="font-serif text-xl text-primary">
        GitHub Actions is not configured
      </h2>
      <p className="mt-2 text-sm text-secondary">
        {message ?? "The read-only GitHub Actions integration is disabled."}
      </p>
      <p className="mt-3 text-sm text-secondary">
        Add a fine-grained token with <strong>Actions: read</strong>,{" "}
        <strong>Contents: read</strong>, and <strong>Metadata: read</strong>, then
        set:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 font-mono text-[12px] text-primary">
{`GITHUB_ENABLED=true
GITHUB_TOKEN=<read-only token>
GITHUB_API_URL=https://api.github.com`}
      </pre>
      <p className="mt-3 text-xs text-tertiary">
        The token stays on the backend. This screen only calls repository, run,
        job, and bounded-log read endpoints.
      </p>
    </div>
  );
}

function RunView({
  detail,
  diagnosis,
  diagnosing,
  onDiagnose,
}: {
  detail: GitHubRunResponse;
  diagnosis: GitHubDiagnosisResponse | null;
  diagnosing: boolean;
  onDiagnose: () => void;
}) {
  const { run, jobs } = detail;
  const hasFailure =
    run.conclusion !== "success" ||
    jobs.some((job) => job.conclusion && job.conclusion !== "success");

  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
              {run.name ?? "workflow"} · run #{run.run_number ?? run.id}
            </div>
            <h2 className="mt-2 font-serif text-xl text-primary">
              {run.display_title ?? "Workflow run"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-tertiary">
              <span>{run.event ?? "event"}</span>
              <span>· {run.branch ?? "unknown branch"}</span>
              {run.head_sha && <span>· {run.head_sha.slice(0, 8)}</span>}
              {run.actor && <span>· {run.actor}</span>}
              <span>· {formatTime(run.updated_at ?? run.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(run.conclusion, run.status)}>
              {run.conclusion ?? run.status}
            </Badge>
            {run.html_url && (
              <a
                href={run.html_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-[12px]"
              >
                Open in GitHub
              </a>
            )}
            {hasFailure && (
              <button
                type="button"
                onClick={onDiagnose}
                disabled={diagnosing}
                className="btn-primary text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {diagnosing ? "Diagnosing…" : "Diagnose failed run"}
              </button>
            )}
          </div>
        </div>
      </div>

      {diagnosis ? (
        <DiagnosisView result={diagnosis} />
      ) : (
        <div>
          <div className="mb-2 label-caps">Jobs and steps</div>
          <div className="space-y-2">
            {jobs.length === 0 && (
              <p className="font-mono text-[11.5px] text-tertiary">
                No job details were returned for this run.
              </p>
            )}
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobRow({ job }: { job: GitHubJob }) {
  return (
    <div className="rounded-[4px] border border-hairline p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`dot ${runDot(job.conclusion, job.status)}`} />
          <span className="text-[13px] text-primary">{job.name}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] text-tertiary">
          {job.runner_name && <span>{job.runner_name}</span>}
          <span>{job.conclusion ?? job.status}</span>
        </div>
      </div>
      {job.steps.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-hairline pt-2">
          {job.steps.map((step, index) => (
            <div
              key={`${job.id}-${step.number ?? index}`}
              className="flex items-center justify-between gap-3 font-mono text-[10.5px]"
            >
              <span
                className={
                  step.conclusion === "failure" || step.conclusion === "timed_out"
                    ? "text-bad"
                    : "text-tertiary"
                }
              >
                {step.number ? `${step.number}. ` : ""}
                {step.name}
              </span>
              <span
                className={
                  step.conclusion === "failure" || step.conclusion === "timed_out"
                    ? "text-bad"
                    : "text-primary0"
                }
              >
                {step.conclusion ?? step.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagnosisView({ result }: { result: GitHubDiagnosisResponse }) {
  const { diagnosis, evidence, run } = result;
  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
              {result.repo} · run #{run.run_number ?? run.id}
            </div>
            <h2 className="mt-2 font-serif text-xl text-primary">
              {diagnosis.summary}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="good">deterministic rules</Badge>
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

      <AIExplanation evidence={evidence} run={run} repo={result.repo} />

      <Section title="Confirmed observations">
        <ul className="space-y-1.5">
          {diagnosis.confirmed_observations.map((item, index) => (
            <li key={index} className="flex gap-2 text-[12.5px] text-primary">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-good" />
              <span>{item}</span>
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
          {diagnosis.hypotheses.map((hypothesis, index) => (
            <div key={index} className="rounded-[4px] border border-hairline p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-primary">
                  {hypothesis.statement}
                </p>
                <span className="shrink-0 font-mono text-[11px] text-tertiary">
                  {Math.round(hypothesis.confidence * 100)}%
                </span>
              </div>
              {hypothesis.reasoning && (
                <p className="mt-2 break-words text-[12px] text-secondary">
                  {hypothesis.reasoning}
                </p>
              )}
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
      </Section>

      {diagnosis.next_steps.length > 0 && (
        <Section title="Next diagnostic steps (read-only)">
          <ul className="space-y-2">
            {diagnosis.next_steps.map((step, index) => (
              <li key={index} className="rounded-[4px] border border-hairline p-3">
                <code className="block break-words font-mono text-[12px] text-primary">
                  {step.action}
                </code>
                {step.purpose && (
                  <p className="mt-1 text-[11.5px] text-tertiary">
                    {step.purpose}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {diagnosis.remediation.length > 0 && (
        <Section title="Remediation (requires explicit approval)">
          <div className="space-y-3">
            {diagnosis.remediation.map((item, index) => (
              <div
                key={index}
                className="rounded-[4px] border border-warn bg-accent-soft p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-primary">
                    {item.title}
                  </p>
                  <Badge tone="warn">changes state · {item.risk}</Badge>
                </div>
                <p className="mt-2 text-[12px] text-secondary">
                  {item.description}
                </p>
                {item.verification && (
                  <p className="mt-1 text-[11.5px] text-tertiary">
                    <span className="text-secondary">Verify:</span>{" "}
                    {item.verification}
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
            {diagnosis.missing_evidence.map((item, index) => (
              <li key={index}>· {item}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Evidence (${evidence.length})`}>
        <div className="space-y-2">
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function AIExplanation({
  evidence,
  run,
  repo,
}: {
  evidence: EvidenceRecord[];
  run: GitHubRun;
  repo: string;
}) {
  const [ai, setAi] = useState<AIStructuredDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.ai.diagnose({
        question: `Explain the likely cause of the failed GitHub Actions run ${repo}#${run.run_number ?? run.id} and the safest read-only next steps.`,
        surface: "cicd",
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
            Optional model-generated summary. Deterministic findings remain
            authoritative, and the model receives only cited evidence summaries.
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
            : "The model is optional; the deterministic diagnosis works without it."}
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
        </div>
      )}
    </div>
  );
}

function EvidenceRow({ item }: { item: EvidenceRecord }) {
  return (
    <div className="rounded-[4px] border border-hairline p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
            SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.info
          }`}
        >
          {item.severity}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-tertiary">
          {item.source_type}
        </span>
        {item.demo && <Badge tone="warn">demo</Badge>}
        <span className="max-w-full truncate font-mono text-[10px] text-tertiary">
          {item.provenance}
        </span>
      </div>
      <p className="mt-2 break-words text-[12px] text-primary">{item.summary}</p>
      {item.integrity && (
        <p className="mt-1 font-mono text-[10px] text-tertiary">
          sha256: {item.integrity.slice(0, 16)}…
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 label-caps">{title}</div>
      {children}
    </div>
  );
}

function runDot(conclusion: string | null | undefined, status: string): string {
  const value = conclusion ?? status;
  if (["success", "neutral", "skipped"].includes(value)) return "dot-good";
  if (["in_progress", "queued", "waiting", "pending", "requested"].includes(value)) {
    return "dot-warn";
  }
  if (["failure", "timed_out", "startup_failure", "cancelled", "action_required"].includes(value)) {
    return "dot-bad";
  }
  return "dot-idle";
}

function statusTone(
  conclusion: string | null | undefined,
  status: string,
): "good" | "warn" | "bad" | "neutral" {
  const value = conclusion ?? status;
  if (value === "success") return "good";
  if (["in_progress", "queued", "waiting", "pending", "requested"].includes(value)) {
    return "warn";
  }
  if (["failure", "timed_out", "startup_failure", "cancelled", "action_required"].includes(value)) {
    return "bad";
  }
  return "neutral";
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
