"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import {
  Activity,
  ArrowRight,
  Check,
  CircleHelp,
  Clock3,
  FileSearch,
  GitBranch,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { useRef } from "react";
import { heroMountain } from "@/lib/images";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(7px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.54, ease: [0.16, 1, 0.3, 1] },
  },
};

const DIAGNOSIS_FACTS = [
  {
    text: "Container state is CrashLoopBackOff",
    source: "events/api-worker:142",
  },
  {
    text: "Restart count is increasing",
    source: "pod/api-worker:status",
  },
  {
    text: "Probe failure is recorded",
    source: "events/api-worker:151",
  },
] as const;

const WORKS_WITH = [
  { name: "Kubernetes", icon: Layers3 },
  { name: "GitHub Actions", icon: GitBranch },
  { name: "Prometheus", icon: Activity },
  { name: "Logs & events", icon: FileSearch },
] as const;

function ProductMockup({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="hero-browser"
      role="group"
      aria-label="Illustrative Tarn diagnosis preview"
    >
      <div className="hero-browser-toolbar">
        <div className="hero-browser-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-browser-address">app.tarn.dev / diagnosis / workload</div>
        <span className="hero-preview-tag">Example workspace</span>
      </div>

      <div className="hero-dashboard">
        <aside className="hero-dashboard-sidebar" aria-hidden="true">
          <div className="hero-dashboard-brand">
            <span className="hero-brand-glyph">T</span>
            <span>Tarn</span>
          </div>
          <div className="hero-sidebar-active"><Activity size={14} /> Overview</div>
          <div><FileSearch size={14} /> Investigations</div>
          <div><Layers3 size={14} /> Integrations</div>
          <div className="hero-sidebar-caption">CONNECTED SOURCES</div>
          <div><span className="hero-source-dot" /> Kubernetes</div>
          <div><span className="hero-source-dot" /> GitHub Actions</div>
          <div><span className="hero-source-dot" /> Prometheus</div>
        </aside>

        <div className="hero-dashboard-content">
          <div className="hero-dashboard-heading">
            <div>
              <span className="hero-dashboard-eyebrow">KUBERNETES / WORKLOAD</span>
              <h2>Workload diagnosis</h2>
            </div>
            <span className="hero-readonly-badge"><ShieldCheck size={13} /> Read-only</span>
          </div>

          <div className="hero-kpi-grid" aria-label="Illustrative workspace overview">
            <div className="hero-kpi">
              <span>Investigation</span>
              <strong>Workload review</strong>
              <small>Example view</small>
            </div>
            <div className="hero-kpi">
              <span>Evidence sources</span>
              <strong><GitBranch size={14} /> Events + logs</strong>
              <small>Source records</small>
            </div>
            <div className="hero-kpi">
              <span>Review state</span>
              <strong><Clock3 size={14} /> Operator review</strong>
              <small>No changes applied</small>
            </div>
          </div>

          <div className="hero-workload-layout">
            <section className="hero-pod-panel" aria-label="Example workload list">
              <div className="hero-panel-heading">
                <div>
                  <span>WORKLOADS</span>
                  <h3>Example namespace</h3>
                </div>
                <span className="hero-example-label">Sample data</span>
              </div>
              <div className="hero-pod-table" role="table" aria-label="Example pod statuses">
                <div className="hero-pod-row hero-pod-header" role="row">
                  <span role="columnheader">Workload</span>
                  <span role="columnheader">Observed state</span>
                  <span role="columnheader">Evidence</span>
                </div>
                <div className="hero-pod-row" role="row">
                  <span role="cell">
                    <i className="hero-status-warn">
                      <svg
                        className="hero-pod-ripples"
                        viewBox="0 0 96 96"
                        aria-hidden="true"
                      >
                        <circle cx="48" cy="48" r="13" />
                        <circle cx="48" cy="48" r="13" />
                        <circle cx="48" cy="48" r="13" />
                      </svg>
                    </i>
                    api-worker
                  </span>
                  <span role="cell">Restarting</span>
                  <span role="cell">Events</span>
                </div>
                <div className="hero-pod-row" role="row">
                  <span role="cell"><i className="hero-status-ok" /> web-gateway</span>
                  <span role="cell">Running</span>
                  <span role="cell">Logs</span>
                </div>
                <div className="hero-pod-row" role="row">
                  <span role="cell"><i className="hero-status-muted" /> queue-consumer</span>
                  <span role="cell">Pending</span>
                  <span role="cell">Events</span>
                </div>
              </div>
            </section>

            <section className="hero-diagnosis-panel" aria-label="Illustrative diagnosis">
              <div className="hero-diagnosis-title">
                <span><FileSearch size={14} /> Diagnosis preview</span>
                <CircleHelp size={14} aria-hidden="true" />
              </div>
              <div className="hero-diagnosis-group">
                <h3><span className="hero-fact-mark" /> Observed facts</h3>
                <ul className="hero-diagnosis-facts">
                  {DIAGNOSIS_FACTS.map((fact, index) => (
                    <motion.li
                      key={fact.source}
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.35,
                        delay: reduceMotion ? 0 : 0.35 + index * 0.7,
                      }}
                    >
                      <motion.span
                        className="hero-diagnosis-fact-text"
                        initial={
                          reduceMotion
                            ? { clipPath: "inset(0 0 0 0)" }
                            : { clipPath: "inset(0 100% 0 0)" }
                        }
                        animate={{ clipPath: "inset(0 0 0 0)" }}
                        transition={{
                          duration: reduceMotion ? 0.01 : 0.8,
                          delay: reduceMotion ? 0 : 0.45 + index * 0.7,
                          ease: "linear",
                        }}
                      >
                        {fact.text}
                      </motion.span>
                      <motion.code
                        className="hero-diagnosis-citation"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: reduceMotion ? 0.01 : 0.25,
                          delay: reduceMotion ? 0 : 0.85 + index * 0.7,
                        }}
                      >
                        {fact.source}
                      </motion.code>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="hero-diagnosis-group">
                <h3><span className="hero-hypothesis-mark" /> Hypotheses</h3>
                <p>Possible explanations stay separate from observations.</p>
              </div>
              <div className="hero-diagnosis-group">
                <h3><span className="hero-unknown-mark" /> Unknowns</h3>
                <p>Confirm the relevant context before taking action.</p>
              </div>
              <div className="hero-diagnosis-foot"><Check size={12} /> No infrastructure writes</div>
            </section>
          </div>
          <p className="hero-sample-disclaimer">
            Illustrative interface
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [32, -32],
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.035, 1],
  );
  const entranceContainer: Variants = reduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
    : heroContainer;
  const entranceItem: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.18 } },
      }
    : heroItem;

  return (
    <section
      ref={heroRef}
      className="landing-hero"
      aria-labelledby="landing-hero-title"
    >
      <motion.div
        className="landing-hero-background"
        style={{ y: imageY, scale: imageScale }}
        aria-hidden="true"
      >
        <Image
          src={heroMountain.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="landing-mountain-image"
        />
        <div className="landing-hero-image-fade" />
      </motion.div>

      <div className="landing-container">
        <motion.div
          className="landing-hero-copy"
          variants={entranceContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p className="landing-hero-badge" variants={entranceItem}>
            <span className="landing-badge-new">New</span>
            Kubernetes workload diagnosis is live
            <ArrowRight size={13} aria-hidden="true" />
          </motion.p>

          <motion.h1 id="landing-hero-title" variants={entranceContainer}>
            <motion.span className="landing-hero-line" variants={entranceItem} aria-hidden="true">
              <span>Diagnose</span>
              <span>any</span>
              <span>failure.</span>
            </motion.span>
            <motion.span className="landing-hero-line" variants={entranceItem} aria-hidden="true">
              <span>Cite</span>
              <span>every</span>
              <span>fact.</span>
            </motion.span>
            <span className="sr-only">
              Diagnose any failure. Cite every fact.
            </span>
          </motion.h1>

          <motion.p className="landing-hero-subtitle" variants={entranceItem}>
            Read-only investigations for failing pods, pipelines and Terraform
            plans. Every finding links back to source records.
          </motion.p>

          <motion.div className="landing-hero-actions" variants={entranceItem}>
            <Link href="/sign-up" className="landing-button landing-button-primary">
              Start diagnosing <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/docs" className="landing-button landing-button-secondary">
              Read the docs
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="landing-hero-visual"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 30, rotateX: 3 }
          }
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.85,
            delay: reduceMotion ? 0 : 0.34,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <ProductMockup reduceMotion={reduceMotion} />
        </motion.div>

        <div className="landing-integrations-strip" aria-label="Works with">
          <span className="landing-integrations-label">Works with</span>
          <div className="landing-integrations-marquee">
            {[0, 1].map((copy) => (
              <div
                className="landing-integrations-track"
                key={copy}
                aria-hidden={copy === 1}
              >
                {WORKS_WITH.map(({ name, icon: Icon }) => (
                  <span key={name}>
                    <Icon size={16} aria-hidden="true" />
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
