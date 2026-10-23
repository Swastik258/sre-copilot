const STATES = [
  {
    key: "idle",
    color: "var(--signal-idle)",
    title: "Faint",
    body: "Nothing to report. The ring sits quiet while you work.",
  },
  {
    key: "good",
    color: "var(--signal-good)",
    title: "All clear",
    body: "Every watched surface is healthy. A single green ring tells you so at a glance.",
  },
  {
    key: "warn",
    color: "var(--signal-warn)",
    title: "Attention",
    body: "A pod restarting, a plan with a destroy, a stale check — amber means look when you can.",
  },
  {
    key: "bad",
    color: "var(--signal-bad)",
    title: "Failure",
    body: "An incident is open. The ring turns red and the card shows the evidence behind it.",
  },
] as const;

export function SignatureRing() {
  return (
    <section className="border-b border-hairline bg-[var(--bg-subtle)]">
      <div className="shell py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Left: copy */}
          <div>
            <span className="label-caps">The ring</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-primary">
              One look says
              <br />
              how it&apos;s going.
            </h2>
            <p className="mt-5 max-w-prose text-dense-lg text-secondary">
              A single ring on the dashboard carries the state of everything
              Tarn is watching. It stays faint until there is something
              worth your attention — then color and motion do the telling.
            </p>

            <ul className="mt-8 space-y-3 border-t border-hairline pt-6 text-dense text-secondary">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-tertiary">01</span>
                <span>
                  <strong className="font-medium text-primary">Faint</strong> — no news.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-tertiary">02</span>
                <span>
                  <strong className="font-medium text-primary">Amber</strong> — something
                  is off; open the card when ready.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-tertiary">03</span>
                <span>
                  <strong className="font-medium text-primary">Red</strong> — a
                  failure; the evidence is already loaded.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-tertiary">04</span>
                <span>
                  <strong className="font-medium text-primary">Green</strong> — resolved
                  and stable for the window.
                </span>
              </li>
            </ul>
          </div>

          {/* Right: rings */}
          <div className="grid grid-cols-2 gap-px self-start bg-[var(--border-strong)] sm:grid-cols-4 lg:grid-cols-2">
            {STATES.map((s) => (
              <div
                key={s.key}
                className="flex flex-col items-center gap-4 bg-[var(--bg-elevated)] px-6 py-10 text-center"
              >
                <Ring
                  color={s.color}
                  pulse={s.key === "warn" || s.key === "bad"}
                />
                <div className="mt-1">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
                    {s.title}
                  </div>
                  <p className="mt-2 max-w-[22ch] text-[12.5px] leading-relaxed text-tertiary">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Ring({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <div
      className={`ring-status${pulse ? " ring-pulse" : ""}`}
      style={{ ["--ring-color" as string]: color }}
      aria-hidden
    />
  );
}
