"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    q: "Does the model have shell access?",
    a:
      "No. The language model can only request a fixed set of read-only operations through validated schemas — kubectl get, GitHub workflow reads, plan parsing, log grouping. A separate policy engine checks each request before anything runs. There is no code path from a model response to an unrestricted command.",
  },
  {
    q: "How does redaction work before AI calls?",
    a:
      "Every payload is passed through a redactor that strips credentials, bearer tokens, passwords, private keys, and common cloud secret formats before it is sent to the model. The redactor runs server-side and its output — not the original — is what the model sees. Raw secrets never reach the audit log either.",
  },
  {
    q: "What does 'read-only by default' actually mean?",
    a:
      "The application ships in read-only mode. Kubernetes connectors can list pods, events, and logs — but cannot exec, delete, patch, or apply. Terraform analysis parses plans but never runs apply. GitHub connectors read workflow runs but cannot trigger or cancel. Write mode exists in the design and is disabled unless explicitly enabled by configuration plus per-request authorization.",
  },
  {
    q: "What happens to files I upload?",
    a:
      "Uploads are size- and type-validated on the backend, then redacted before storage or model use. They are scoped to your session and never used for training. You can delete an upload at any time, which removes it from storage and from any saved investigation that referenced it.",
  },
  {
    q: "Can I use it without any API keys?",
    a:
      "Yes. Demo mode ships with deterministic fixtures for every integration: Kubernetes pod states, log files, Terraform plans, GitHub workflow logs. The AI provider defaults to a mock that returns canned structured responses. The entire test suite runs offline, without any cloud credentials.",
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
    <section id="faq" className="bg-ink-900">
      <div className="shell py-24">
        {/* Header */}
        <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <span className="label-caps">FAQ</span>
            <h2 className="mt-4 font-serif text-display tracking-tight text-paper-50">
              Questions,
              <br />
              answered.
            </h2>
          </div>
          <p className="max-w-prose self-end text-dense-lg text-paper-300">
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
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-baseline gap-6 px-1 py-6 text-left transition hover:bg-ink-850/50"
                  aria-expanded={isOpen}
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] text-paper-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-dense-lg font-medium text-paper-100">
                    {item.q}
                  </span>
                  <span
                    className={`font-mono text-[13px] text-paper-400 transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 gap-6 pl-[2.75rem] pr-10 pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <div />
                    <p className="max-w-prose text-dense text-paper-300">
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
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper-400">
            Something not answered here?
          </span>
          <a href="/support" className="link-editorial text-dense">
            Write to us
          </a>
        </div>
      </div>
    </section>
  );
}