"use client";

import "./feature.css";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Check, CircleDot, FileSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const INVESTIGATION_STEPS = [
  {
    title: "Collect events",
    detail: "Read the records around the signal.",
  },
  {
    title: "Read logs",
    detail: "Keep workload output in context.",
  },
  {
    title: "Match failure class",
    detail: "Compare evidence with known conditions.",
  },
  {
    title: "Cite evidence",
    detail: "Keep each finding tied to its source.",
  },
] as const;

const EVIDENCE_STREAM = [
  {
    source: "KUBERNETES / EVENTS",
    time: "10:42:17.004",
    lines: [
      { type: "record", text: "api-worker entered CrashLoopBackOff" },
      { type: "record", text: "Container restart recorded" },
      { type: "reference", text: "events/api-worker:142" },
    ],
  },
  {
    source: "KUBERNETES / LOGS",
    time: "10:42:18.221",
    lines: [
      { type: "record", text: "Readiness probe failed" },
      { type: "record", text: "Container output retained for review" },
      { type: "reference", text: "logs/api-worker:latest" },
    ],
  },
  {
    source: "FAILURE CLASS / REVIEW",
    time: "10:42:18.307",
    lines: [
      { type: "record", text: "Observed state: repeated restarts" },
      { type: "hypothesis", text: "Possible class: CrashLoopBackOff" },
      { type: "reference", text: "Compare with source records" },
    ],
  },
  {
    source: "EVIDENCE / LINKED",
    time: "10:42:18.422",
    lines: [
      { type: "record", text: "Finding linked to event record" },
      { type: "record", text: "Observed fact kept separate" },
      { type: "reference", text: "events/api-worker:142" },
    ],
  },
] as const;

const STEP_INTERVAL = 3200;

function updateSpotlight(event: PointerEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--spotlight-x",
    `${event.clientX - bounds.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--spotlight-y",
    `${event.clientY - bounds.top}px`,
  );
}

export function InvestigationFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.25 });
  const reduceMotion = usePrefersReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [manualSelection, setManualSelection] = useState(false);
  const evidence = EVIDENCE_STREAM[activeStep];
  const progress = (activeStep + 1) / INVESTIGATION_STEPS.length;

  useEffect(() => {
    if (!isInView || reduceMotion || manualSelection) return;

    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % INVESTIGATION_STEPS.length);
    }, STEP_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isInView, manualSelection, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="landing-feature-section"
      aria-labelledby="landing-feature-title"
    >
      <div className="landing-container">
        <motion.div
          className="landing-investigation-heading"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.55, ease: "easeOut" }}
        >
          <h2 id="landing-feature-title">
            Everything between your pod and the root cause.
          </h2>
          <p>
            Trace a failing workload from source records to evidence your team
            can verify.
          </p>
        </motion.div>

        <motion.div
          className="landing-investigation-panel"
          onPointerMove={updateSpotlight}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{
            duration: reduceMotion ? 0.18 : 0.6,
            delay: reduceMotion ? 0 : 0.08,
            ease: "easeOut",
          }}
        >
          <div className="landing-investigation-steps">
            <div className="landing-investigation-progress" aria-hidden="true">
              <motion.span
                initial={false}
                animate={{ scaleY: progress }}
                transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
              />
            </div>
            <ol>
              {INVESTIGATION_STEPS.map((step, index) => {
                const active = activeStep === index;
                const complete = activeStep > index;

                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      className={`landing-investigation-step${active ? " is-active" : ""}`}
                      aria-current={active ? "step" : undefined}
                      onClick={() => {
                        setActiveStep(index);
                        setManualSelection(true);
                      }}
                    >
                      <span className="landing-investigation-step-marker">
                        {complete ? (
                          <Check size={12} aria-hidden="true" />
                        ) : (
                          <CircleDot size={13} aria-hidden="true" />
                        )}
                      </span>
                      <span className="landing-investigation-step-copy">
                        <strong>{step.title}</strong>
                        <small>{step.detail}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="landing-evidence-stream">
            <div className="landing-evidence-stream-header">
              <div>
                <FileSearch size={15} aria-hidden="true" />
                <span>Evidence stream</span>
              </div>
              <span className="landing-evidence-stream-state">SOURCE RECORDS</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeStep}
                className="landing-evidence-stream-content"
                initial={{
                  opacity: 0,
                  y: reduceMotion ? 0 : 8,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: reduceMotion ? 0 : -5,
                }}
                transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
              >
                <div className="landing-evidence-stream-meta">
                  <span>{evidence.source}</span>
                  <time>{evidence.time}</time>
                </div>
                <ul>
                  {evidence.lines.map((line) => (
                    <li
                      className={`is-${line.type}`}
                      key={`${line.type}-${line.text}`}
                    >
                      <span aria-hidden="true" />
                      <code>{line.text}</code>
                    </li>
                  ))}
                </ul>
                <div className="landing-evidence-stream-footer">
                  <span>Source context preserved</span>
                  <span>
                    STEP {String(activeStep + 1).padStart(2, "0")} / 04
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
