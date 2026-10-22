"use client";

import { useEffect, useState } from "react";

const EVENTS = [
  {
    time: "00:00",
    label: "Restart count observed",
    evidence: "evidence: pod/status#1",
  },
  {
    time: "00:18",
    label: "Previous container log collected",
    evidence: "evidence: pod/logs#2",
  },
  {
    time: "00:34",
    label: "Configuration error matched",
    evidence: "evidence: pod/logs#3",
  },
  {
    time: "00:51",
    label: "Hypothesis ranked for review",
    evidence: "sample diagnosis",
  },
];

export function IncidentReplay() {
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setPosition((current) => Math.min(current + 1, EVENTS.length - 1));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (position === EVENTS.length - 1) setPlaying(false);
  }, [position]);

  function togglePlayback() {
    if (position === EVENTS.length - 1) setPosition(0);
    setPlaying((current) => !current);
  }

  const activeEvent = EVENTS[position];

  return (
    <section className="shell py-16 sm:py-20" aria-labelledby="replay-title">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-caps">Illustrative incident replay</span>
          <h2 id="replay-title" className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
            Follow the evidence, not the guess.
          </h2>
        </div>
        <span className="sample-data-label">Sample data · not a live incident</span>
      </div>

      <div className="replay-panel grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                payments-api · CrashLoopBackOff
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text)]">Demo fixture / replay sequence</p>
            </div>
            <span className="home-demo-tag">Illustrative</span>
          </div>

          <div className="my-6 space-y-5" aria-live="polite">
            {EVENTS.slice(0, position + 1).map((event, index) => (
              <div className="replay-event" key={event.time}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-[10px] text-[var(--accent)]">{event.time}</span>
                  <span className="text-sm text-[var(--text)]">{event.label}</span>
                </div>
                <span className="home-evidence-chip mt-2">{event.evidence}</span>
                {index === position && (
                  <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-[var(--signal-good)]">
                    <span className="dot dot-good" />
                    current sample step
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={togglePlayback}
                className="btn-accent"
                aria-label={playing ? "Pause incident replay" : "Play incident replay"}
              >
                {playing ? "Pause replay" : position === EVENTS.length - 1 ? "Replay again" : "Play replay"}
              </button>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {activeEvent.time} / 00:51
              </span>
            </div>
            <label className="sr-only" htmlFor="incident-replay-position">Incident replay position</label>
            <input
              id="incident-replay-position"
              className="replay-range"
              type="range"
              min="0"
              max={EVENTS.length - 1}
              step="1"
              value={position}
              onChange={(event) => {
                setPosition(Number(event.currentTarget.value));
                setPlaying(false);
              }}
            />
          </div>
        </div>

        <aside className="console-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--text-muted)]">
              Ranked hypothesis
            </span>
            <span className="home-status-ring" aria-label="Sample diagnosis complete">OK</span>
          </div>
          <p className="mt-5 text-sm font-semibold text-[var(--text)]">
            Required configuration may be unavailable.
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
            Sample conclusion from the replay. Verify the cited source before taking action.
          </p>
          <span className="home-evidence-chip mt-4">evidence: pod/logs#3</span>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--text-subtle)]">
              Current replay event
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{activeEvent.label}</p>
          </div>
          <p className="mt-5 border-t border-[var(--border)] pt-4 font-mono text-[9px] leading-5 text-[var(--text-subtle)]">
            Sample content only · no infrastructure queried · no action applied
          </p>
        </aside>
      </div>
    </section>
  );
}
