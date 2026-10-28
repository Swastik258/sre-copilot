"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    q: "How are observations different from hypotheses?",
    a:
      "Observations are returned by the source. Hypotheses are possible explanations ranked separately, with evidence references you can inspect.",
  },
  {
    q: "What does an evidence reference point to?",
    a:
      "Each reference identifies the source record used by a diagnosis, such as pod status, an event, or a log entry.",
  },
  {
    q: "Which integrations are available?",
    a:
      "The current built-in adapters are Kubernetes, GitHub Actions, and Prometheus. Availability depends on deployment configuration.",
  },
  {
    q: "Can I inspect a finding's source?",
    a:
      "Yes. Evidence references identify the records used by a diagnosis so you can review the underlying context.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="packet-faq-list">
      {QUESTIONS.map((item, index) => {
        const isOpen = open === index;
        const questionId = `home-faq-question-${index}`;
        const answerId = `home-faq-answer-${index}`;

        return (
          <div key={item.q}>
            <button
              type="button"
              id={questionId}
              aria-controls={answerId}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span>{item.q}</span>
              <svg
                className={`home-faq-chevron${isOpen ? " is-open" : ""}`}
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
            {isOpen && (
              <p id={answerId} role="region" aria-labelledby={questionId}>
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
