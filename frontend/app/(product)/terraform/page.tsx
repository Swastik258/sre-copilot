"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui";
import {
  api,
  ApiRequestError,
  type AIStructuredDiagnosis,
  type EvidenceRecord,
  type TerraformChange,
  type TerraformFinding,
  type TerraformReviewResponse,
} from "@/lib/api";

const SAMPLE_PLAN = {
  format_version: "1.2",
  terraform_version: "1.9.0",
  resource_changes: [
    {
      address: "aws_s3_bucket.assets",
      type: "aws_s3_bucket",
      name: "assets",
      provider_name: "registry.terraform.io/hashicorp/aws",
      change: {
        actions: ["create"],
        before: null,
        after: {
          bucket: "demo-assets",
          tags: { team: "sre", environment: "staging" },
        },
        after_unknown: { arn: true },
      },
    },
    {
      address: "aws_db_instance.primary",
      type: "aws_db_instance",
      name: "primary",
      provider_name: "registry.terraform.io/hashicorp/aws",
      change: {
        actions: ["delete", "create"],
        before: { engine_version: "15.4", storage_gb: 100 },
        after: { engine_version: "15.6", storage_gb: 200 },
        replace_paths: [["engine_version"]],
        after_unknown: {},
      },
    },
    {
      address: "aws_db_snapshot.legacy",
      type: "aws_db_snapshot",
      name: "legacy",
      change: {
        actions: ["delete"],
        before: { identifier: "legacy-snapshot" },
        after: null,
      },
    },
    {
      address: "aws_instance.web",
      type: "aws_instance",
      name: "web",
      change: {
        actions: ["update"],
        before: { ami: "ami-old" },
        after: { ami: "ami-new" },
      },
    },
  ],
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-[var(--border-strong)] text-secondary",
  low: "border-info text-info",
  medium: "border-warn text-warn",
  high: "border-bad text-bad",
  critical: "border-bad text-bad",
};

export default function TerraformPage() {
  const [planText, setPlanText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [result, setResult] = useState<TerraformReviewResponse | null>(null);
  const [explanation, setExplanation] = useState<AIStructuredDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reviewPlan() {
    setError(null);
    setResult(null);
    setExplanation(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(planText);
    } catch (err) {
      setError(
        `Plan is not valid JSON: ${err instanceof Error ? err.message : "parse error"}`,
      );
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setError("Plan JSON must be an object, not an array or primitive.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.terraform.review(parsed);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Plan review failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function explainPlan() {
    setError(null);
    setExplaining(true);
    let parsed: unknown;
    try {
      parsed = JSON.parse(planText);
    } catch (err) {
      setError(
        `Plan is not valid JSON: ${err instanceof Error ? err.message : "parse error"}`,
      );
      setExplaining(false);
      return;
    }
    try {
      const response = await api.terraform.explain(
        parsed,
        "Explain the riskiest changes in this plan and what an operator should verify before applying it.",
      );
      setResult(response.review);
      setExplanation(response.explanation);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "AI explanation failed",
      );
    } finally {
      setExplaining(false);
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setPlanText(text);
      setFileName(file.name);
      setIsSample(false);
      setResult(null);
      setExplanation(null);
      setError(null);
    } catch {
      setError("Could not read the selected file.");
    }
  }

  function loadSample() {
    setPlanText(JSON.stringify(SAMPLE_PLAN, null, 2));
    setFileName("sample-plan.json");
    setIsSample(true);
    setResult(null);
    setExplanation(null);
    setError(null);
  }

  function clearPlan() {
    setPlanText("");
    setFileName(null);
    setIsSample(false);
    setResult(null);
    setExplanation(null);
    setError(null);
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Read-only plan review</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">
              Terraform blast radius
            </h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Paste a plan JSON document to detect replacements and deletions,
              surface stateful-resource risk, and see the blast radius before
              anyone applies it. This never runs Terraform or reads credentials.
            </p>
          </div>
          <Badge tone="good">no apply · values not returned</Badge>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] animate-fade-up delay-1">
          <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="label-caps">Plan JSON</div>
                <p className="mt-1 text-[11.5px] text-tertiary">
                  From <code className="font-mono">terraform show -json</code> or a
                  saved plan converted to JSON.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn-ghost cursor-pointer text-[12px]">
                  Upload JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => void onFileChange(event)}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={loadSample}
                  className="btn-ghost text-[12px]"
                >
                  Load sample
                </button>
              </div>
            </div>

            <textarea
              value={planText}
              onChange={(event) => {
                setPlanText(event.target.value);
                setFileName(null);
                setIsSample(false);
                setResult(null);
                setExplanation(null);
                setError(null);
              }}
              rows={18}
              spellCheck={false}
              placeholder={'{\n  "format_version": "1.2",\n  "resource_changes": []\n}'}
              className="mt-3 w-full resize-y rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 font-mono text-[11.5px] leading-relaxed text-primary placeholder:text-tertiary"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-tertiary">
                {fileName && <span>{fileName}</span>}
                {isSample && <Badge tone="warn">sample · illustrative</Badge>}
                {!fileName && <span>No file selected</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearPlan}
                  disabled={loading || (!planText && !result)}
                  className="btn-ghost text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void reviewPlan()}
                  disabled={loading || !planText.trim()}
                  className="btn-primary text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Reviewing…" : "Review plan"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 font-mono text-[11.5px] text-bad" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="min-w-0">
            {!result && !loading && (
              <div className="grid h-full min-h-[320px] place-items-center rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-12 text-center">
                <p className="max-w-sm font-mono text-[12px] text-tertiary">
                  Review a plan to see replacements, deletions, stateful-resource
                  risk, attribute-name changes, and the evidence behind every
                  finding. Values are deliberately omitted.
                </p>
              </div>
            )}
            {loading && (
              <p className="font-mono text-sm text-tertiary">Reviewing plan…</p>
            )}
            {result && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] border border-hairline bg-[var(--bg-subtle)] px-3 py-2">
                  <span className="font-mono text-[10.5px] text-tertiary">
                    Evidence is redacted before any external AI request.
                  </span>
                  <button
                    type="button"
                    className="btn-ghost text-[12px] disabled:opacity-50"
                    onClick={() => void explainPlan()}
                    disabled={explaining}
                  >
                    {explaining ? "Explaining…" : "Explain with AI"}
                  </button>
                </div>
                <ReviewView result={result} />
                {explanation && <ExplanationView explanation={explanation} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplanationView({
  explanation,
}: {
  explanation: AIStructuredDiagnosis;
}) {
  return (
    <div className="rounded-[4px] border border-accent bg-accent-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label-caps">AI explanation</div>
          <p className="mt-2 text-[13px] leading-relaxed text-primary">
            {explanation.summary}
          </p>
        </div>
        <span className="font-mono text-[10px] text-tertiary">
          {explanation.model_provider ?? "mock"} · confidence{" "}
          {Math.round(explanation.confidence * 100)}%
        </span>
      </div>

      {explanation.hypotheses.length > 0 && (
        <div className="mt-4">
          <div className="label-caps">Interpretations</div>
          <div className="mt-2 space-y-2">
            {explanation.hypotheses.map((hypothesis, index) => (
              <div
                key={`${hypothesis.explanation}-${index}`}
                className="rounded-[4px] border border-hairline bg-[var(--bg)] p-3"
              >
                <p className="text-[12px] text-secondary">{hypothesis.explanation}</p>
                <p className="mt-1 font-mono text-[10px] text-tertiary">
                  confidence {Math.round(hypothesis.confidence * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation.next_steps.length > 0 && (
        <div className="mt-4">
          <div className="label-caps">Verify next</div>
          <ul className="mt-2 space-y-1.5 text-[12px] text-secondary">
            {explanation.next_steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-2">
                <span className="text-accent">·</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation.unknowns.length > 0 && (
        <div className="mt-4">
          <div className="label-caps">Unknowns</div>
          <ul className="mt-2 space-y-1.5 text-[11.5px] text-tertiary">
            {explanation.unknowns.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      )}

      {explanation.proposed_remediation.length > 0 && (
        <div className="mt-4">
          <div className="label-caps">Proposed actions · not executed</div>
          <div className="mt-2 space-y-2">
            {explanation.proposed_remediation.map((action) => (
              <div
                key={action.description}
                className="rounded-[4px] border border-hairline bg-[var(--bg)] p-3"
              >
                <p className="text-[12px] text-secondary">{action.description}</p>
                <p className="mt-1 font-mono text-[10px] text-tertiary">
                  risk {action.risk} · {action.changes_state ? "changes state" : "read-only"} ·
                  approval required
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewView({ result }: { result: TerraformReviewResponse }) {
  const { summary, findings, changes, evidence } = result;
  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-tertiary">
              terraform {result.terraform_version ?? "unknown"} · format{" "}
              {result.format_version ?? "unknown"}
            </div>
            <h2 className="mt-2 font-serif text-xl text-primary">
              {summary.headline}
            </h2>
          </div>
          <Badge tone={blastTone(summary.blast_radius)}>
            blast radius: {summary.blast_radius}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Count label="total" value={summary.total} />
          <Count label="create" value={summary.create} tone="good" />
          <Count label="update" value={summary.update} tone="warn" />
          <Count label="replace" value={summary.replace} tone="bad" />
          <Count label="destroy" value={summary.destroy} tone="bad" />
          <Count label="read" value={summary.read} />
          <Count label="no-op" value={summary.no_op} />
          <Count label="unknown" value={summary.unknown} tone="warn" />
        </div>
      </div>

      <Section title={`Findings (${findings.length})`}>
        {findings.length === 0 && (
          <p className="text-[12.5px] text-tertiary">
            No high-risk replacements, deletions, stateful updates, or unknown
            values were found.
          </p>
        )}
        <div className="space-y-3">
          {findings.map((finding, index) => (
            <FindingRow key={`${finding.address ?? "finding"}-${index}`} finding={finding} />
          ))}
        </div>
      </Section>

      <Section title={`Resource changes (${changes.length})`}>
        <div className="space-y-2">
          {changes.length === 0 && (
            <p className="font-mono text-[11.5px] text-tertiary">
              This plan contains no resource changes.
            </p>
          )}
          {changes.map((change) => (
            <ChangeRow key={change.address} change={change} />
          ))}
        </div>
      </Section>

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

function Count({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const color = {
    good: "text-good",
    warn: "text-warn",
    bad: "text-bad",
    neutral: "text-primary",
  }[tone];
  return (
    <div className="rounded-[4px] border border-hairline px-2 py-2 text-center">
      <div className={`font-serif text-lg leading-none ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-tertiary">
        {label}
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: TerraformFinding }) {
  return (
    <div className="rounded-[4px] border border-hairline p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
              SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info
            }`}
          >
            {finding.severity}
          </span>
          <p className="text-[13px] text-primary">{finding.title}</p>
        </div>
        {finding.address && (
          <span className="max-w-full truncate font-mono text-[10px] text-tertiary">
            {finding.address}
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-secondary">
        {finding.detail}
      </p>
      {finding.evidence_id && (
        <p className="mt-1 font-mono text-[10px] text-tertiary">
          evidence: {finding.evidence_id.slice(0, 8)}…
        </p>
      )}
    </div>
  );
}

function ChangeRow({ change }: { change: TerraformChange }) {
  return (
    <div className="rounded-[4px] border border-hairline p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-[12px] text-primary">
            {change.address}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-tertiary">
            <span>{change.type ?? "resource"}</span>
            {change.provider && <span>· {change.provider}</span>}
            {change.stateful && <span>· stateful</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={actionTone(change.action)}>{change.action}</Badge>
          <Badge tone={riskTone(change.risk)}>risk: {change.risk}</Badge>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-tertiary">
        <span>actions: {change.actions.join(" → ") || "none"}</span>
        {change.action_reason && <span>reason: {change.action_reason}</span>}
      </div>

      {change.replace_paths.length > 0 && (
        <AttributeList
          label="replacement paths"
          values={change.replace_paths}
          tone="bad"
        />
      )}
      {change.changed_attributes.length > 0 && (
        <AttributeList
          label="changed attributes"
          values={change.changed_attributes}
          tone="neutral"
        />
      )}
      {change.unknown_attributes.length > 0 && (
        <AttributeList
          label="unknown attributes"
          values={change.unknown_attributes}
          tone="warn"
        />
      )}
    </div>
  );
}

function AttributeList({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const chip = {
    good: "border-good text-good",
    warn: "border-warn text-warn",
    bad: "border-bad text-bad",
    neutral: "border-[var(--border-strong)] text-secondary",
  }[tone];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">
        {label}:
      </span>
      {values.slice(0, 8).map((value) => (
        <span
          key={value}
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${chip}`}
        >
          {value}
        </span>
      ))}
      {values.length > 8 && (
        <span className="font-mono text-[10px] text-tertiary">
          +{values.length - 8} more
        </span>
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

function blastTone(
  blast: TerraformReviewResponse["summary"]["blast_radius"],
): "good" | "warn" | "bad" | "neutral" {
  if (blast === "critical" || blast === "high") return "bad";
  if (blast === "medium") return "warn";
  if (blast === "low") return "neutral";
  return "good";
}

function actionTone(
  action: TerraformChange["action"],
): "good" | "warn" | "bad" | "neutral" {
  if (action === "create") return "good";
  if (action === "update" || action === "unknown") return "warn";
  if (action === "replace" || action === "destroy") return "bad";
  return "neutral";
}

function riskTone(risk: TerraformChange["risk"]): "good" | "warn" | "bad" | "neutral" {
  if (risk === "critical" || risk === "high") return "bad";
  if (risk === "medium") return "warn";
  if (risk === "low") return "neutral";
  return "good";
}
