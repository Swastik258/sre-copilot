"use client";

import "./homepage.css";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  Check,
  CircleHelp,
  FileSearch,
  GitBranch,
  Layers3,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { FAQ } from "@/components/FAQ";
import { PLAN_CATALOG } from "@/lib/plans";
import { ctaMountain } from "@/lib/images";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const SOURCES = [
  {
    name: "Kubernetes",
    description: "Review workload state and related cluster records.",
    icon: Layers3,
  },
  {
    name: "GitHub Actions",
    description: "Follow a failed run to its job, step, and logs.",
    icon: GitBranch,
  },
  {
    name: "Prometheus",
    description: "Inspect configured signals alongside other evidence.",
    icon: Activity,
  },
] as const;

const CAPABILITIES = [
  {
    title: "Read-only by default",
    description: "Inspect configured sources without applying infrastructure changes.",
    icon: LockKeyhole,
  },
  {
    title: "Facts stay distinct",
    description: "Separate source observations from possible explanations.",
    icon: SearchCheck,
  },
  {
    title: "Evidence stays close",
    description: "Review source references alongside the findings they support.",
    icon: FileSearch,
  },
  {
    title: "AI remains optional",
    description: "Use deterministic findings with optional model explanation.",
    icon: Sparkles,
  },
] as const;

const EVIDENCE_LAYERS = [
  {
    label: "Observed facts",
    description: "What the configured source records actually show.",
    tone: "fact",
  },
  {
    label: "Hypotheses",
    description: "Possible explanations, presented separately for review.",
    tone: "hypothesis",
  },
  {
    label: "Unknowns",
    description: "Context that still needs an operator to confirm.",
    tone: "unknown",
  },
] as const;

const FAILURE_EXAMPLES = [
  "CrashLoopBackOff",
  "OOMKilled",
  "ImagePullBackOff",
  "Pending / Unschedulable",
  "Probe failure",
] as const;

const KUBERNETES_CONFIGS = [
  {
    label: "Explore with fixtures",
    code: [
      "KUBERNETES_ENABLED=true",
      "KUBERNETES_DEMO_MODE=true",
    ],
    note: "Start with labelled demo fixtures. No cluster or provider key is needed.",
  },
  {
    label: "Use a local cluster",
    code: [
      "KUBERNETES_ENABLED=true",
      "KUBERNETES_DEMO_MODE=false",
      "KUBERNETES_KUBECONFIG=C:/Users/you/.kube/config",
      "KUBERNETES_CONTEXT=your-context",
      "KUBERNETES_IN_CLUSTER=false",
    ],
    note: "Use a kubeconfig whose identity has only the documented read permissions.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    title: "Choose a source",
    body: "Pick a configured, read-only source.",
  },
  {
    title: "Collect records",
    body: "Keep events and logs in context.",
  },
  {
    title: "Separate signals",
    body: "Review facts apart from hypotheses.",
  },
  {
    title: "Verify the lead",
    body: "Trace a finding to its source.",
  },
] as const;

function WorkflowPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="landing-workflow-mini landing-workflow-source-picker">
        <span className="landing-workflow-mini-label">SOURCE</span>
        <div className="is-selected">
          <Layers3 size={15} aria-hidden="true" />
          <span>Kubernetes</span>
          <Check size={13} aria-hidden="true" />
        </div>
        <div>
          <GitBranch size={15} aria-hidden="true" />
          <span>GitHub Actions</span>
        </div>
        <div>
          <Activity size={15} aria-hidden="true" />
          <span>Prometheus</span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="landing-workflow-mini landing-workflow-record-list">
        <span className="landing-workflow-mini-label">SOURCE RECORDS</span>
        <div>
          <span className="landing-workflow-record-dot" />
          <code>pod/api-worker</code>
          <small>status</small>
        </div>
        <div>
          <span className="landing-workflow-record-dot is-active" />
          <code>events/api-worker:142</code>
          <small>event</small>
        </div>
        <div>
          <span className="landing-workflow-record-dot" />
          <code>logs/api-worker</code>
          <small>output</small>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="landing-workflow-mini landing-workflow-fact-split">
        <div>
          <span className="landing-workflow-mini-label">OBSERVED FACT</span>
          <strong>Restart recorded</strong>
          <small>From a source record</small>
        </div>
        <div>
          <span className="landing-workflow-mini-label">HYPOTHESIS</span>
          <strong>Possible failure class</strong>
          <small>For operator review</small>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-workflow-mini landing-workflow-citation">
      <span className="landing-workflow-mini-label">EVIDENCE REFERENCE</span>
      <span className="landing-workflow-citation-link">
        <FileSearch size={15} aria-hidden="true" />
        <code>events/api-worker:142</code>
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
      <small>Source linked to the finding</small>
    </div>
  );
}

function FadeUp({
  children,
  className,
  delay = 0,
  onPointerMove,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: reduceMotion ? 0.18 : 0.58,
        delay: reduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      onPointerMove={onPointerMove}
    >
      {children}
    </motion.div>
  );
}

export function LandingRemainder() {
  const reduceMotion = usePrefersReducedMotion();
  const workflowRef = useRef<HTMLElement>(null);
  const workflowInView = useInView(workflowRef, { amount: 0.25 });
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [manualWorkflowSelection, setManualWorkflowSelection] = useState(false);
  const [activeConfig, setActiveConfig] = useState(0);
  const selectedConfig = KUBERNETES_CONFIGS[activeConfig];

  useEffect(() => {
    if (!workflowInView || reduceMotion || manualWorkflowSelection) return;

    const timer = window.setInterval(() => {
      setActiveWorkflowStep((current) => (current + 1) % WORKFLOW_STEPS.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [manualWorkflowSelection, reduceMotion, workflowInView]);

  return (
    <div className="landing-home-sections">
      <section
        ref={workflowRef}
        className="landing-workflow-section"
        aria-labelledby="landing-workflow-title"
      >
        <div className="landing-container">
          <FadeUp className="landing-section-heading landing-section-heading-split">
            <div>
              <h2 id="landing-workflow-title">
                Move from alert to a source-linked answer in four steps.
              </h2>
            </div>
            <p>
              Keep source records, observations, and hypotheses linked through
              review.
            </p>
          </FadeUp>

          <div className="landing-workflow-timeline">
            <span className="landing-workflow-beam" aria-hidden="true" />
            <ol>
              {WORKFLOW_STEPS.map((step, index) => {
                const active = activeWorkflowStep === index;

                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      className={`landing-workflow-node${active ? " is-active" : ""}`}
                      aria-current={active ? "step" : undefined}
                      onClick={() => {
                        setActiveWorkflowStep(index);
                        setManualWorkflowSelection(true);
                      }}
                    >
                      <span className="landing-workflow-node-top">
                        <span className="landing-workflow-node-marker">
                          <span />
                        </span>
                        <span className="landing-workflow-node-number">
                          0{index + 1}
                        </span>
                      </span>
                      <strong>{step.title}</strong>
                      <span className="landing-workflow-node-copy">
                        {step.body}
                      </span>
                      <span className="landing-workflow-mini-wrap">
                        <WorkflowPreview index={index} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section
        id="integrations"
        className="landing-sources-section"
        aria-labelledby="landing-sources-title"
      >
        <div className="landing-container landing-sources-layout">
          <FadeUp className="landing-section-heading">
            <span className="landing-eyebrow">Built-in adapters</span>
            <h2 id="landing-sources-title">Meet the systems your team already runs.</h2>
            <p>
              Availability depends on your deployment and source configuration.
            </p>
          </FadeUp>
          <div className="landing-source-cards">
            {SOURCES.map((source, index) => {
              const Icon = source.icon;
              return (
                <FadeUp
                  className="landing-source-card"
                  delay={index * 0.07}
                  key={source.name}
                >
                  <span className="landing-source-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="landing-source-label">AVAILABLE ADAPTER</span>
                  <h3>{source.name}</h3>
                  <p>{source.description}</p>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="landing-config-section"
        aria-labelledby="landing-config-title"
      >
        <div className="landing-container">
          <FadeUp className="landing-section-heading landing-section-heading-split">
            <div>
              <span className="landing-eyebrow">A safer way to connect</span>
              <h2 id="landing-config-title">Start with fixtures. Connect a read-only cluster when ready.</h2>
            </div>
            <p>
              Kubernetes is optional. Configure the backend with the documented
              environment settings and keep permissions limited to read access.
            </p>
          </FadeUp>

          <FadeUp className="landing-config-panel">
            <div className="landing-config-main">
              <div className="landing-config-tabs" role="tablist" aria-label="Kubernetes setup options">
                {KUBERNETES_CONFIGS.map((config, index) => (
                  <button
                    key={config.label}
                    type="button"
                    role="tab"
                    aria-selected={activeConfig === index}
                    aria-controls="landing-kubernetes-config"
                    id={`landing-config-tab-${index}`}
                    onClick={() => setActiveConfig(index)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
              <div
                id="landing-kubernetes-config"
                role="tabpanel"
                aria-labelledby={`landing-config-tab-${activeConfig}`}
                className="landing-config-code"
              >
                <div className="landing-config-code-header">
                  <span><span aria-hidden="true" /> backend/.env</span>
                  <span>Environment</span>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.pre
                    key={activeConfig}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                  >
                    <code>
                      {selectedConfig.code.map((line) => (
                        <span className="landing-code-line" key={line}>{line}</span>
                      ))}
                    </code>
                  </motion.pre>
                </AnimatePresence>
                <p>{selectedConfig.note}</p>
              </div>
            </div>

            <aside className="landing-config-scope">
              <span className="landing-config-scope-icon">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <span className="landing-eyebrow">Permission boundary</span>
              <h3>Read signals. Never apply changes.</h3>
              <p>
                The documented Kubernetes role grants only <code>get</code>,
                {" "}<code>list</code>, and <code>watch</code> for the resources
                Tarn reads. It grants no Secret or ConfigMap access.
              </p>
              <Link href="/docs#integrations" className="landing-inline-link">
                Read the setup guide <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </aside>
          </FadeUp>
        </div>
      </section>

      <section className="landing-capabilities-section" aria-labelledby="landing-capabilities-title">
        <div className="landing-container">
          <FadeUp className="landing-section-heading landing-section-heading-centered">
            <span className="landing-eyebrow">Designed for operator control</span>
            <h2 id="landing-capabilities-title">A useful answer is one you can verify.</h2>
          </FadeUp>
          <div className="landing-capability-grid">
            {CAPABILITIES.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <FadeUp
                  className="landing-capability-card"
                  delay={index * 0.06}
                  key={capability.title}
                >
                  <span className="landing-capability-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-evidence-section" aria-labelledby="landing-evidence-title">
        <div className="landing-container landing-evidence-layout">
          <FadeUp className="landing-evidence-copy">
            <span className="landing-eyebrow">Make the reasoning inspectable</span>
            <h2 id="landing-evidence-title">Keep what you know separate from what you suspect.</h2>
            <p>
              A diagnosis should make uncertainty visible. Review evidence,
              hypotheses, and remaining questions without blending them together.
            </p>
            <Link href="/docs" className="landing-inline-link">
              Explore the documentation <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </FadeUp>
          <FadeUp className="landing-evidence-panel">
            <div className="landing-evidence-panel-top">
              <span><FileSearch size={16} aria-hidden="true" /> Investigation record</span>
              <span className="landing-evidence-sample">STRUCTURE</span>
            </div>
            <div className="landing-evidence-layers">
              {EVIDENCE_LAYERS.map((layer, index) => (
                <div className={`landing-evidence-layer is-${layer.tone}`} key={layer.label}>
                  <span className="landing-evidence-index">0{index + 1}</span>
                  <span className="landing-evidence-mark" aria-hidden="true" />
                  <span className="landing-evidence-layer-copy">
                    <strong>{layer.label}</strong>
                    <small>{layer.description}</small>
                  </span>
                  <Check size={15} aria-hidden="true" />
                </div>
              ))}
            </div>
            <p className="landing-evidence-disclaimer">
              Illustrative structure, not a live investigation.
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="landing-failure-section" aria-labelledby="landing-failure-title">
        <div className="landing-container landing-failure-layout">
          <FadeUp className="landing-section-heading">
            <span className="landing-eyebrow">Kubernetes workload review</span>
            <h2 id="landing-failure-title">Start with the signal. Follow it back to evidence.</h2>
            <p>
              These are examples of workload conditions operators may investigate.
              What Tarn can show depends on the evidence available from your cluster.
            </p>
          </FadeUp>
          <div className="landing-failure-list" aria-label="Example Kubernetes workload conditions">
            {FAILURE_EXAMPLES.map((failure, index) => (
              <FadeUp
                className="landing-failure-row"
                delay={index * 0.045}
                key={failure}
              >
                <span className="landing-failure-status" aria-hidden="true">
                  <CircleHelp size={15} />
                </span>
                <span>{failure}</span>
                <span className="landing-failure-tag">Example signal</span>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-pricing-section" aria-labelledby="landing-pricing-title">
        <div className="landing-container">
          <FadeUp className="landing-section-heading landing-section-heading-split">
            <div>
              <span className="landing-eyebrow">Straightforward access</span>
              <h2 id="landing-pricing-title">Every live capability is free today.</h2>
            </div>
            <p>
              No payment flow is enabled. Pro and Team are planned tiers, not
              currently available for purchase.
            </p>
          </FadeUp>
          <div className="landing-pricing-grid">
            {PLAN_CATALOG.map((plan, index) => (
              <FadeUp
                className={`landing-plan-card${plan.accent ? " is-planned" : ""}`}
                delay={index * 0.07}
                key={plan.id}
              >
                <div className="landing-plan-topline">
                  <span>{plan.name}</span>
                  <span className={plan.status === "available" ? "is-live" : ""}>
                    {plan.status === "available" ? "Available now" : "Planned"}
                  </span>
                </div>
                <div className="landing-plan-price">{plan.price}</div>
                <p className="landing-plan-period">{plan.period}</p>
                <p className="landing-plan-blurb">{plan.blurb}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta.href}
                  className={plan.status === "available" ? "landing-plan-cta is-primary" : "landing-plan-cta"}
                >
                  {plan.cta.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </FadeUp>
            ))}
          </div>
          <p className="landing-pricing-note">
            Future tier features and limits are not active entitlements.
          </p>
        </div>
      </section>

      <section className="landing-faq-section" aria-labelledby="landing-faq-title">
        <div className="landing-container landing-faq-layout">
          <FadeUp className="landing-section-heading">
            <span className="landing-eyebrow">Good to know</span>
            <h2 id="landing-faq-title">Clarity for the next incident.</h2>
            <p>Understand how Tarn treats evidence and keeps operators in control.</p>
          </FadeUp>
          <FadeUp className="landing-faq-card">
            <FAQ />
          </FadeUp>
        </div>
      </section>

      <section className="landing-final-section" aria-labelledby="landing-final-title">
        <div className="landing-container">
          <div className="landing-final-card">
            <Image
              src={ctaMountain.src}
              alt={ctaMountain.alt}
              fill
              sizes="(max-width: 760px) 100vw, 1152px"
              className="landing-final-image"
            />
            <div className="landing-final-shade" aria-hidden="true" />
            <FadeUp className="landing-final-content">
              <span className="landing-eyebrow">Evidence-first operations</span>
              <h2 id="landing-final-title">Ready to make your next diagnosis easier to verify?</h2>
              <p>Start with the evidence. Keep the decision with your team.</p>
              <div className="landing-final-actions">
                <Link href="/sign-up" className="landing-button landing-button-primary">
                  Get started <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/docs" className="landing-button landing-button-secondary">
                  Read the docs
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
    </div>
  );
}
