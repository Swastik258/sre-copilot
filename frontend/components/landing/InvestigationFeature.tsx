"use client";

import "./feature.css";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
} from "motion/react";
import {
  Check,
  CircleDot,
  FileSearch,
  ListChecks,
  LockKeyhole,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { featureMountain } from "@/lib/images";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const TABS = [
  {
    label: "Diagnose any pod",
    title: "Start with the failing workload.",
    description:
      "Bring workload state and related source records into one reviewable investigation path.",
    details: ["Workload state", "Related events and logs", "Failure-class hypotheses"],
    icon: Search,
  },
  {
    label: "Read-only by default",
    title: "Inspect without changing infrastructure.",
    description:
      "Tarn gathers evidence from configured read-only sources. Decisions and changes stay with your team.",
    details: ["Read-only source access", "No applied changes", "Operator remains in control"],
    icon: LockKeyhole,
  },
  {
    label: "Cited evidence",
    title: "Trace findings back to their sources.",
    description:
      "Keep observed facts distinct from possible explanations, with source references ready to review.",
    details: ["Source-backed observations", "Separate hypotheses", "Reviewable references"],
    icon: FileSearch,
  },
  {
    label: "Fast triage",
    title: "Follow a consistent path to a lead.",
    description:
      "Move from collected events through failure-class review to evidence your team can verify.",
    details: ["Collect relevant events", "Review logs", "Cite supporting evidence"],
    icon: ListChecks,
  },
] as const;

const PROGRESS_STEPS = [
  { title: "Collect events", detail: "Read source records" },
  { title: "Read logs", detail: "Review workload output" },
  { title: "Match failure class", detail: "Compare observed symptoms" },
  { title: "Cite evidence", detail: "Keep references attached" },
] as const;

const TAB_INTERVAL = 6200;
const STEP_INTERVAL = 1550;

const featureReveal: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const featureRevealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function InvestigationFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.25 });
  const reduceMotion = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [manualSelection, setManualSelection] = useState(false);
  const manualSelectionRef = useRef(false);

  useEffect(() => {
    if (!isInView || reduceMotion || manualSelection) return;

    const timer = window.setInterval(() => {
      if (!manualSelectionRef.current) {
        setActiveTab((current) => (current + 1) % TABS.length);
      }
    }, TAB_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isInView, manualSelection, reduceMotion]);

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % PROGRESS_STEPS.length);
    }, STEP_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isInView, reduceMotion]);

  function selectTab(index: number) {
    manualSelectionRef.current = true;
    setActiveTab(index);
    setManualSelection(true);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (activeTab + 1) % TABS.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (activeTab - 1 + TABS.length) % TABS.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    selectTab(nextIndex);
    document.getElementById(`investigation-tab-${nextIndex}`)?.focus();
  }

  const selectedTab = TABS[activeTab];
  const SelectedIcon = selectedTab.icon;
  const revealContainer: Variants = reduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0.02 } } }
    : featureReveal;
  const revealItem: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.18 } },
      }
    : featureRevealItem;

  return (
    <section
      ref={sectionRef}
      id="features"
      className="landing-feature-section"
      aria-labelledby="landing-feature-title"
    >
      <motion.div
        className="landing-container"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
      >
        <motion.div className="landing-feature-heading" variants={revealItem}>
          <h2 id="landing-feature-title">
            Everything between your pod and the root cause.
          </h2>
          <p>
            Follow a read-only investigation from source records to findings
            your team can verify.
          </p>
        </motion.div>

        <motion.div className="landing-feature-card" variants={revealItem}>
          <div className="landing-feature-image">
            <Image
              src={featureMountain.src}
              alt={featureMountain.alt}
              fill
              sizes="(max-width: 760px) 100vw, 58vw"
              className="landing-feature-mountain"
            />
            <div className="landing-feature-image-overlay" aria-hidden="true" />
            <div className="landing-feature-image-caption">
              <span className="landing-feature-caption-mark">
                <CircleDot size={13} aria-hidden="true" />
              </span>
              <span>
                <strong>Investigation path</strong>
                <small>Source records stay in context</small>
              </span>
            </div>

            <div className="landing-progress-card" aria-label="Investigation steps">
              <div className="landing-progress-heading">
                <span>WORKFLOW</span>
                <span>READ-ONLY</span>
              </div>
              <ol>
                {PROGRESS_STEPS.map((step, index) => {
                  const complete =
                    activeStep > index ||
                    (activeStep === 0 && index === PROGRESS_STEPS.length - 1);
                  const active = activeStep === index;

                  return (
                    <li
                      key={step.title}
                      className={active ? "is-active" : ""}
                      aria-current={active ? "step" : undefined}
                    >
                      <span className="landing-progress-icon">
                        {complete ? (
                          <motion.span
                            className="landing-progress-complete"
                            initial={
                              reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.6 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: reduceMotion ? 0.15 : 0.22 }}
                          >
                            <Check size={12} aria-hidden="true" />
                          </motion.span>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </span>
                      <span className="landing-progress-copy">
                        <strong>{step.title}</strong>
                        <small>{step.detail}</small>
                      </span>
                      {active && !reduceMotion ? (
                        <span className="landing-progress-current" aria-hidden="true">
                          <motion.span
                            key={activeStep}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: STEP_INTERVAL / 1000, ease: "linear" }}
                          />
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="landing-feature-content">
            <div
              className="landing-feature-tabs"
              role="tablist"
              aria-label="Investigation capabilities"
            >
              {TABS.map((tab, index) => (
                <button
                  key={tab.label}
                  id={`investigation-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === index}
                  aria-controls="investigation-panel"
                  tabIndex={activeTab === index ? 0 : -1}
                  onClick={() => selectTab(index)}
                  onKeyDown={handleTabKeyDown}
                  className="landing-feature-tab"
                >
                  {tab.label}
                  {activeTab === index ? (
                    <motion.span
                      className="landing-feature-tab-underline"
                      layoutId="landing-feature-tab-underline"
                      transition={
                        reduceMotion
                          ? { duration: 0.12 }
                          : { type: "spring", stiffness: 420, damping: 36 }
                      }
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div
              id="investigation-panel"
              className="landing-feature-panel"
              role="tabpanel"
              aria-labelledby={`investigation-tab-${activeTab}`}
              tabIndex={0}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  className="landing-feature-panel-content"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.24 }}
                >
                  <div className="landing-feature-icon">
                    <SelectedIcon size={17} aria-hidden="true" />
                  </div>
                  <h3>{selectedTab.title}</h3>
                  <p>{selectedTab.description}</p>
                  <ul>
                    {selectedTab.details.map((detail) => (
                      <li key={detail}>
                        <Check size={14} aria-hidden="true" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
