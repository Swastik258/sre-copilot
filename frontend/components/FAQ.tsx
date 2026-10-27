import Link from "next/link";

const QUESTIONS = [
  {
    q: "Does the model have shell access?",
    a:
      "No. The model has no tools, shell, or network access. The backend collects allowlisted read-only evidence first, then asks the model to explain that evidence. There is no code path from model output to a command or infrastructure change.",
  },
  {
    q: "How does redaction work before AI calls?",
    a:
      "Every payload is passed through a redactor that strips credentials, bearer tokens, passwords, private keys, and common cloud secret formats before it is sent to the model. The redactor runs server-side and its output — not the original — is what the model sees. Raw secrets never reach the audit log either.",
  },
  {
    q: "What does “read-only by default” actually mean?",
    a:
      "Infrastructure adapters are structurally read-only. Kubernetes connectors can list pods, events, and logs but cannot exec, delete, patch, or apply. Terraform analysis parses supplied plans but never runs plan or apply. GitHub connectors read workflow runs but cannot trigger, re-run, or cancel. Infrastructure-code output is a proposal that the product never writes or applies.",
  },
  {
    q: "What happens to logs or files I analyze?",
    a:
      "Log analysis is size-validated, redacted, and processed without persisting the raw paste. Saved investigations, audit events, and account data follow the deployment's retention policy and can be removed through the documented operator process. The application does not use customer data to train models. External AI providers are contacted only when configured; review their data policy, and use privacy mode to block that transmission.",
  },
  {
    q: "Can I use it without any API keys?",
    a:
      "Yes. Kubernetes, GitHub, and Prometheus provide labelled fixtures; Terraform and logs accept supplied sample input. The AI provider defaults to a deterministic mock. The backend test suite runs offline without cloud credentials.",
  },
  {
    q: "Which AI provider does it use?",
    a:
      "The provider is configurable via a single environment variable. It supports a mock provider for local development and tests, and one or more hosted providers when a key is supplied. Keys are read on the backend only and are never exposed to the browser or embedded in the frontend bundle.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-title">
      <div className="shell faq-section__grid">
        <div className="faq-section__intro">
          <p className="section-label">Questions</p>
          <h2 id="faq-title" className="mt-4">
            Short answers, enforced by the code.
          </h2>
          <p>
            If something here contradicts the repository, the repository wins.
            The full security notes live beside the implementation.
          </p>
        </div>

        <div className="faq-list">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="faq-row">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--border)] pt-5">
            <span className="text-xs text-[var(--text-subtle)]">
              Something not answered here?
            </span>
            <Link href="/support" className="link-editorial text-sm">
              Ask support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
