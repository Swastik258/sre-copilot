"use client";

import { useCallback, useMemo, useState } from "react";
import {
  api,
  ApiRequestError,
  type AIStructuredDiagnosis,
  type LogAnalyzeResponse,
  type LogSignature,
} from "@/lib/api";

const SAMPLE = `2026-10-21T18:02:09Z INFO  server boot commit=9f21c4
2026-10-21T18:02:11Z ERROR connect redis: ECONNREFUSED redis:6379
    at Pool.connect (ioredis/redis.js:190)
2026-10-21T18:02:11Z ERROR process exited code=1
2026-10-21T18:02:12Z ERROR connect redis: ECONNREFUSED redis:6379
    at Pool.connect (ioredis/redis.js:190)
2026-10-21T18:02:13Z WARN  retry attempt=3 backoff=250ms
2026-10-21T18:02:14Z INFO  healthcheck /healthz 200`;

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-[var(--border-strong)] text-secondary",
  low: "border-info text-info",
  medium: "border-warn text-warn",
  high: "border-bad text-bad",
  critical: "border-bad text-bad",
};

function formatTime(value?: string | null): string {
  if (!value) return "timestamp unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function LogsPage() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [environment, setEnvironment] = useState("");
  const [result, setResult] = useState<LogAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineCount = useMemo(() => text.split(/\r?\n/).filter(Boolean).length, [text]);

  const analyze = useCallback(async () => {
    if (!text.trim()) {
      setError("Paste at least one log line first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.logs.analyze({
        text,
        source: source.trim() || null,
        environment: environment.trim() || null,
      });
      setResult(response);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Log analysis failed",
      );
    } finally {
      setLoading(false);
    }
  }, [environment, source, text]);

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Local log analysis</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Logs</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Group a bounded log stream into signatures, surface the first
              occurrence, and cite the redacted evidence. Raw logs stay local.
            </p>
          </div>
          <span className="tag-live">live · deterministic</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] animate-fade-in">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="label-caps">Input</div>
                <p className="mt-1 text-[12px] text-tertiary">
                  Up to 1,000,000 characters; the first 20,000 lines are analyzed.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost text-[12px]"
                onClick={() => setText(SAMPLE)}
              >
                Load demo logs
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label-caps">Source</span>
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="checkout-api"
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary placeholder:text-tertiary"
                />
              </label>
              <label className="block">
                <span className="label-caps">Environment</span>
                <input
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  placeholder="production"
                  className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary placeholder:text-tertiary"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="label-caps">Log lines</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                spellCheck={false}
                rows={14}
                placeholder="2026-10-21T18:02:11Z ERROR connect redis: ECONNREFUSED redis:6379"
                className="mt-1 w-full resize-y rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 font-mono text-[11.5px] leading-relaxed text-primary placeholder:text-tertiary"
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[10.5px] text-tertiary">
                {lineCount.toLocaleString()} non-empty line{lineCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="btn-accent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                onClick={() => void analyze()}
              >
                {loading ? "Analyzing…" : "Analyze logs"}
              </button>
            </div>

            {error && (
              <p className="mt-3 font-mono text-[11.5px] text-bad" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="min-w-0">
            {!result && !loading && (
              <div className="grid h-full min-h-72 place-items-center rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-10 text-center">
                <p className="max-w-sm font-mono text-[12px] text-tertiary">
                  Analyze a stream to see grouped signatures, first/last seen
                  timestamps, stack frames, and evidence ids.
                </p>
              </div>
            )}

            {loading && (
              <p className="font-mono text-sm text-tertiary">Grouping lines…</p>
            )}

            {result && (
              <div className="space-y-5">
                <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="label-caps">Analysis</div>
                      <p className="mt-2 text-[13px] text-primary">{result.summary}</p>
                    </div>
                    {result.truncated && <span className="tag-planned">truncated</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10.5px] text-tertiary">
                    <span>{result.total_lines.toLocaleString()} total lines</span>
                    <span>· {result.parsed_lines.toLocaleString()} parsed</span>
                    <span>· {result.signatures.length} signatures shown</span>
                    <span>· {result.evidence.length} evidence records</span>
                  </div>
                </div>

                <AIExplanation result={result} />

                <div className="space-y-3">
                  {result.signatures.map((signature) => (
                    <SignatureCard key={signature.id} signature={signature} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SignatureCard({ signature }: { signature: LogSignature }) {
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                SEVERITY_STYLES[signature.severity] ?? SEVERITY_STYLES.info
              }`}
            >
              {signature.severity}
            </span>
            <span className="font-mono text-[10.5px] text-tertiary">
              {signature.count.toLocaleString()} occurrence{signature.count === 1 ? "" : "s"}
            </span>
            {signature.evidence_id && (
              <span className="font-mono text-[10.5px] text-tertiary">
                · evidence {signature.evidence_id.slice(0, 8)}
              </span>
            )}
          </div>
          <p className="mt-2 break-words font-mono text-[12px] text-primary">
            {signature.signature}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 font-mono text-[10.5px] text-tertiary sm:grid-cols-2">
        <div>
          <dt className="label-caps">First seen</dt>
          <dd className="mt-0.5 text-secondary">{formatTime(signature.first_seen)}</dd>
        </div>
        <div>
          <dt className="label-caps">Last seen</dt>
          <dd className="mt-0.5 text-secondary">{formatTime(signature.last_seen)}</dd>
        </div>
      </dl>

      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-3 font-mono text-[11px] leading-relaxed text-secondary">
        {signature.sample}
      </pre>

      {signature.frames.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[10.5px] text-tertiary">
            {signature.frames.length} stack frame{signature.frames.length === 1 ? "" : "s"}
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10.5px] leading-relaxed text-tertiary">
            {signature.frames.join("\n")}
          </pre>
        </details>
      )}
    </article>
  );
}

function AIExplanation({ result }: { result: LogAnalyzeResponse }) {
  const [ai, setAi] = useState<AIStructuredDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      setAi(
        await api.ai.diagnose({
          question: "Explain the most important log signature and the safest read-only next steps.",
          surface: "logs",
          evidence: result.evidence.map((item) => ({ ...item, payload: undefined })),
        }),
      );
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
    <div className="rounded-[4px] border border-hairline p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label-caps">Optional AI explanation</div>
          <p className="mt-1 text-[11.5px] text-tertiary">
            Only redacted evidence summaries leave the machine. Deterministic
            signatures above remain authoritative.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost text-[12px] disabled:opacity-50"
          disabled={loading || result.evidence.length === 0}
          onClick={() => void explain()}
        >
          {loading ? "Asking model…" : ai ? "Ask again" : "Explain with AI"}
        </button>
      </div>
      {error && <p className="mt-3 font-mono text-[11px] text-bad">{error}</p>}
      {ai && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2 font-mono text-[10.5px] text-tertiary">
            <span>{ai.model_provider ?? "provider"}/{ai.model_name ?? "model"}</span>
            <span>· {Math.round(ai.confidence * 100)}% confidence</span>
            {ai.model_generated && <span className="tag-planned">AI-generated</span>}
          </div>
          <p className="text-[12.5px] text-primary">{ai.summary}</p>
          {ai.next_steps.length > 0 && (
            <ul className="space-y-1 text-[11.5px] text-tertiary">
              {ai.next_steps.map((step, index) => (
                <li key={index}>· {step}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
