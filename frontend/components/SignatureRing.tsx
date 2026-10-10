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
];

export function SignatureRing() {
  return (
    <section className="border-b border-hairline bg-ink-900">
      <div className="mx-auto max-w-wide px-6 py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Left: copy */}
          <div>
            <span className="label-caps">The ring</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-paper-50">
              One look says
              <br />
              how it&apos;s going.
            </h2>
            <p className="mt-5 max-w-prose text-dense-lg text-paper-300">
              A single ring on the dashboard carries the state of everything
              SRE Copilot is watching. It stays faint until there is something
              worth your attention — then color and motion do the telling.
            </p>

            <ul className="mt-8 space-y-3 border-t border-hairline pt-6 text-dense text-paper-300">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-paper-400">01</span>
                <span>
                  <strong className="font-medium text-paper-100">Faint</strong> — no news.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-paper-400">02</span>
                <span>
                  <strong className="font-medium text-paper-100">Amber</strong> — something
                  is off; open the card when ready.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-paper-400">03</span>
                <span>
                  <strong className="font-medium text-paper-100">Red</strong> — a
                  failure; the evidence is already loaded.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-paper-400">04</span>
                <span>
                  <strong className="font-medium text-paper-100">Green</strong> — resolved
                  and stable for the window.
                </span>
              </li>
            </ul>
          </div>

          {/* Right: rings */}
          <div className="grid grid-cols-2 gap-px self-start bg-hairline-strong sm:grid-cols-4 lg:grid-cols-2">
            {STATES.map((s) => (
              <div
                key={s.key}
                className="flex flex-col items-center gap-4 bg-ink-900 px-6 py-10 text-center"
              >
                <Ring color={s.color} />
                <div className="mt-1">
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper-300">
                    {s.title}
                  </div>
                  <p className="mt-2 max-w-[22ch] text-[12.5px] leading-relaxed text-paper-400">
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

function Ring({ color }: { color: string }) {
  return (
    <div
      className="ring-status"
      style={{ ["--ring-color" as string]: color }}
      aria-hidden
    />
  );
}