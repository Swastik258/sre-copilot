const STEPS = [
  {
    n: "01",
    title: "Connect a surface",
    body:
      "Point SRE Copilot at a Kubernetes cluster, a GitHub repository, a Terraform plan, or a log file. Every connector is read-only by default. Nothing runs against your infrastructure until you turn it on.",
    meta: "kubeconfig · GitHub token · plan.json · local file",
  },
  {
    n: "02",
    title: "Ask, or let it notice",
    body:
      "Ask a question in plain language, or let the status ring pull your attention when a surface changes. Either way, the AI is only allowed to call a fixed set of read operations with validated arguments.",
    meta: "k8s.pods.get · k8s.events.list · gh.workflow.runs · tf.plan.parse",
  },
  {
    n: "03",
    title: "Read the evidence, approve a change",
    body:
      "Every answer is split into observed facts, hypotheses, and next steps. Proposed changes arrive as a diff. Nothing is applied automatically — you approve each one, and the decision is written to the audit log.",
    meta: "observed · hypothesis · confidence · next steps · audit event",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-hairline bg-[var(--bg-elevated)]">
      <div className="shell py-24">
        {/* Header */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">How it works</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-primary">
              Read-only by default.
              <br />
              Nothing runs until you approve it.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-secondary">
            The model never has shell access. It can only request specific,
            allowlisted operations through validated schemas. A separate policy
            layer checks each request before any tool runs.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-strong)] lg:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="tick flex flex-col gap-5 bg-[var(--bg-elevated)] p-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] tracking-[0.14em] text-accent">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-[var(--border-strong)]" />
              </div>

              <h3 className="font-serif text-[1.5rem] leading-snug tracking-tight text-primary">
                {s.title}
              </h3>

              <p className="text-dense text-secondary">{s.body}</p>

              <div className="mt-auto border-t border-hairline pt-4 font-mono text-[10.5px] leading-relaxed text-tertiary">
                {s.meta}
              </div>
            </article>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-10 flex items-start gap-4 border-t border-hairline pt-6">
          <span className="dot dot-good mt-1.5 shrink-0" />
          <p className="max-w-prose text-dense text-tertiary">
            Logs, files, and tool output are treated as untrusted input. Prompt
            injection attempts, oversized payloads, and disallowed commands are
            rejected by the policy layer before the model ever sees them.
          </p>
        </div>
      </div>
    </section>
  );
}
