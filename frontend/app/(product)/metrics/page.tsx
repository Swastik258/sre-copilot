"use client";

import { useCallback, useMemo, useState } from "react";
import {
  api,
  ApiRequestError,
  type CorrelationResponse,
  type MetricQueryResponse,
  type MetricSeries,
} from "@/lib/api";

type Phase = "idle" | "loading" | "ready" | "not_configured" | "error";

const SERIES_CLASSES = ["text-accent", "text-warn", "text-info", "text-good"];

function localDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function pathFor(series: MetricSeries, min: number, max: number): string {
  if (series.points.length === 0) return "";
  const width = 800;
  const height = 240;
  const span = max - min || 1;
  return series.points
    .map((point, index) => {
      const x =
        series.points.length === 1
          ? width / 2
          : (index / (series.points.length - 1)) * width;
      const y = height - ((point.value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function MetricsPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [query, setQuery] = useState("rate(http_requests_total[5m])");
  const [minutes, setMinutes] = useState(15);
  const [step, setStep] = useState("15s");
  const [result, setResult] = useState<MetricQueryResponse | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationResponse | null>(null);
  const [eventLabel, setEventLabel] = useState("deploy completed");
  const [eventTime, setEventTime] = useState(localDateTimeValue(new Date()));
  const [error, setError] = useState<string | null>(null);

  const bounds = useMemo(() => {
    const values = result?.series.flatMap((series) =>
      series.points.map((point) => point.value),
    ) ?? [];
    if (values.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [result]);

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setCorrelation(null);
    try {
      const response = await api.metrics.query(query, minutes, step);
      setResult(response);
      setPhase("ready");
    } catch (err) {
      setResult(null);
      if (err instanceof ApiRequestError && err.code === "not_configured") {
        setPhase("not_configured");
        setError(err.message);
      } else {
        setPhase("error");
        setError(
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Metric query failed",
        );
      }
    }
  }, [minutes, query, step]);

  const correlate = useCallback(async () => {
    if (!result) return;
    setError(null);
    try {
      const parsed = new Date(eventTime);
      const response = await api.metrics.correlate({
        query,
        minutes,
        step,
        events: [
          {
            timestamp: Number.isNaN(parsed.getTime())
              ? new Date().toISOString()
              : parsed.toISOString(),
            label: eventLabel.trim() || "deploy",
            severity: "medium",
          },
        ],
      });
      setCorrelation(response);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Correlation failed",
      );
    }
  }, [eventLabel, eventTime, minutes, query, result, step]);

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="grid-overlay" />
      <div className="shell relative py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <span className="label-caps">Read-only metrics</span>
            <h1 className="mt-3 font-serif text-display-sm text-primary">Metrics</h1>
            <p className="mt-2 max-w-prose text-dense text-tertiary">
              Query Prometheus, inspect bounded series, and correlate a metric
              spike with a deploy or log event. A timing signal is not causation.
            </p>
          </div>
          {result?.demo && <span className="tag-planned">demo series</span>}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] animate-fade-in">
          <section className="min-w-0 space-y-5">
            <div className="card p-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                <label>
                  <span className="label-caps">PromQL query</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={minutes}
                    onChange={(event) => setMinutes(Number(event.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
                <label>
                  <span className="label-caps">Step</span>
                  <input
                    value={step}
                    onChange={(event) => setStep(event.target.value)}
                    className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10.5px] text-tertiary">
                  Read-only GET · bounded to 1,440 minutes
                </span>
                <button
                  type="button"
                  className="btn-accent disabled:opacity-50"
                  onClick={() => void load()}
                  disabled={phase === "loading" || !query.trim()}
                >
                  {phase === "loading" ? "Querying…" : "Run query"}
                </button>
              </div>
            </div>

            {phase === "not_configured" && (
              <div className="rounded-[4px] border border-warn bg-accent-soft p-5">
                <h2 className="font-serif text-xl text-primary">Prometheus is not configured</h2>
                <p className="mt-2 text-sm text-secondary">
                  {error ?? "The read-only Prometheus integration is disabled."}
                </p>
                <pre className="mt-3 overflow-x-auto rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 font-mono text-[12px] text-primary">
{`PROMETHEUS_ENABLED=true
PROMETHEUS_DEMO_MODE=true`}
                </pre>
                <p className="mt-2 text-[11.5px] text-tertiary">
                  Or set <code className="font-mono">PROMETHEUS_URL</code> for a
                  live read-only endpoint.
                </p>
              </div>
            )}

            {phase === "error" && (
              <p className="font-mono text-[12px] text-bad" role="alert">
                {error}
              </p>
            )}

            {result && (
              <>
                <div className="rounded-[4px] border border-hairline bg-[var(--bg-subtle)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="label-caps">Result</div>
                      <p className="mt-2 text-[13px] text-primary">{result.summary}</p>
                    </div>
                    <span className="font-mono text-[10px] text-tertiary">
                      {new Date(result.start).toLocaleTimeString()} –{" "}
                      {new Date(result.end).toLocaleTimeString()} · step {result.step}
                    </span>
                  </div>
                  {result.series.length === 0 && (
                    <p className="mt-3 font-mono text-[11.5px] text-tertiary">
                      No series returned. Try a broader query or a longer window.
                    </p>
                  )}
                  {result.series.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-[4px] border border-hairline bg-[var(--bg)] p-2">
                      <svg
                        viewBox="0 0 800 240"
                        role="img"
                        aria-label="Metric series"
                        className="h-64 w-full"
                      >
                        <path
                          d="M0,240 L800,240"
                          className="stroke-[var(--border-strong)]"
                          fill="none"
                        />
                        {result.series.map((series, index) => (
                          <path
                            key={`${series.name}-${index}`}
                            d={pathFor(series, bounds.min, bounds.max)}
                            fill="none"
                            strokeWidth={2}
                            stroke="currentColor"
                            className={SERIES_CLASSES[index % SERIES_CLASSES.length]}
                          />
                        ))}
                      </svg>
                    </div>
                  )}
                  {result.series.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-4">
                      {result.series.map((series, index) => (
                        <span
                          key={`${series.name}-legend-${index}`}
                          className="flex items-center gap-2 font-mono text-[10.5px] text-tertiary"
                        >
                          <span
                            className={`h-0.5 w-5 ${
                              index === 0
                                ? "bg-accent"
                                : index === 1
                                  ? "bg-warn"
                                  : index === 2
                                    ? "bg-info"
                                    : "bg-good"
                            }`}
                          />
                          {series.name}
                          {Object.entries(series.labels).length > 0
                            ? ` · ${Object.entries(series.labels)
                                .slice(0, 2)
                                .map(([key, value]) => `${key}=${value}`)
                                .join(", ")}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-5">
                  <div className="label-caps">Correlate an event</div>
                  <p className="mt-1 text-[11.5px] text-tertiary">
                    The service flags metric points at least two standard
                    deviations from their own window near the event. It does not
                    claim the event caused the metric change.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                    <label>
                      <span className="label-caps">Event label</span>
                      <input
                        value={eventLabel}
                        onChange={(event) => setEventLabel(event.target.value)}
                        className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                      />
                    </label>
                    <label>
                      <span className="label-caps">Event time</span>
                      <input
                        type="datetime-local"
                        value={eventTime}
                        onChange={(event) => setEventTime(event.target.value)}
                        className="mt-1 w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-[12px] text-primary"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost mt-3 text-[12px]"
                    onClick={() => void correlate()}
                  >
                    Correlate
                  </button>

                  {correlation && (
                    <div className="mt-4 border-t border-hairline pt-3">
                      <p className="text-[12px] text-primary">{correlation.summary}</p>
                      {correlation.matches.length === 0 && (
                        <p className="mt-2 font-mono text-[11px] text-tertiary">
                          No metric crossed the threshold near this event.
                        </p>
                      )}
                      <div className="mt-2 space-y-2">
                        {correlation.matches.map((match, index) => (
                          <div
                            key={`${match.metric_name}-${index}`}
                            className="rounded-[4px] border border-hairline p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-primary">
                                {match.metric_name}
                              </span>
                              <span className="font-mono text-[10px] text-warn">
                                z={match.z_score} · {match.direction}
                              </span>
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-tertiary">
                              observed {match.observed_value.toFixed(3)} · mean{" "}
                              {match.baseline_mean.toFixed(3)} · stddev{" "}
                              {match.baseline_stddev.toFixed(3)}
                            </div>
                            {match.evidence_id && (
                              <div className="mt-1 font-mono text-[10px] text-tertiary">
                                evidence {match.evidence_id.slice(0, 8)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[4px] border border-hairline p-4">
              <div className="label-caps">Read-only boundary</div>
              <ul className="mt-2 space-y-2 text-[11.5px] text-tertiary">
                <li>· Only GET requests to the query API</li>
                <li>· Series reduced to bounded evidence</li>
                <li>· No Prometheus admin or write path</li>
                <li>· Correlation is a timing hint, not proof</li>
              </ul>
            </div>
            <div className="rounded-[4px] border border-hairline p-4">
              <div className="label-caps">Try a query</div>
              <div className="mt-2 space-y-1 font-mono text-[10.5px] text-tertiary">
                <p>up</p>
                <p>rate(http_requests_total[5m])</p>
                <p>histogram_quantile(0.99, …)</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
