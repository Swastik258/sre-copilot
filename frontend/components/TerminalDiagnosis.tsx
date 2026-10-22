"use client";

import { useEffect, useRef, useState } from "react";

export function TerminalDiagnosis() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(terminal);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={terminalRef}
      className={`incident-terminal ${visible ? "is-visible" : ""}`}
      aria-label="Illustrative sample CrashLoopBackOff diagnosis"
    >
      <div className="incident-terminal-bar">
        <span className="flex items-center gap-2">
          <span className="home-window-dot" />
          <span className="home-window-dot" />
          <span className="home-window-dot" />
        </span>
        <span>INCIDENT / SAMPLE-042</span>
        <span className="incident-terminal-status">
          <span className="status-beacon" />
          SAMPLE
        </span>
      </div>
      <div className="incident-terminal-content">
        <div className="incident-terminal-line terminal-line-1">
          <span className="terminal-prompt">$</span>
          <span>inspect pod payments-api-7d9b</span>
        </div>
        <div className="incident-terminal-line terminal-line-2">
          <span className="terminal-warn">OBSERVED</span>
          <span>CrashLoopBackOff · 6 restarts</span>
        </div>
        <div className="incident-terminal-line terminal-line-3">
          <span className="terminal-source">[sample log · line 18]</span>
          <span>Error: missing required config key DATABASE_URL</span>
        </div>
        <div className="incident-terminal-line terminal-line-4">
          <span className="terminal-source">[sample event · 2m ago]</span>
          <span>Back-off restarting failed container</span>
        </div>
        <div className="incident-terminal-conclusion">
          <span className="terminal-check">✓</span>
          <span>
            Likely cause: required configuration is unavailable.
            <span className="block pt-1 text-[var(--text-subtle)]">
              Hypothesis linked to sample log line 18 · verify before action
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
