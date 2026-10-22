"use client";

import Link from "next/link";
import { useState } from "react";

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
    q: "What does 'read-only by default' actually mean?",
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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[var(--bg-elevated)]">
      <div className="shell py-24">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">FAQ</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-primary">
              Questions,
              <br />
              answered.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-secondary">
            The short answers below are the same ones the code enforces. If
            something here contradicts what you find in the repo, the repo wins.
          </p>
        </div>

        {/* Accordion */}
        <div className="border-t border-hairline">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-hairline">
                <button
                  type="button"
                  id={`faq-question-${i}`}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-baseline gap-6 px-1 py-6 text-left transition hover:bg-[var(--bg-subtle)]"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] text-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-dense-lg font-medium text-primary">
                    {item.q}
                  </span>
                  <span
                    className={`font-mono text-[13px] text-tertiary transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-question-${i}`}
                    className="grid grid-cols-1 gap-6 pl-[2.75rem] pr-10 pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
                  >
                    <div />
                    <p className="max-w-prose text-dense text-secondary">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t border-hairline pt-6">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-tertiary">
            Something not answered here?
          </span>
          <Link href="/support" className="link-editorial text-dense">
            Contact support
          </Link>
        </div>
      </div>
    </section>
  );
}
