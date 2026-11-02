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

const WORDS = ["Evidence,", "not", "guesses"];

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

function ProductMockup() {
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
                  <span role="cell"><i className="hero-status-warn" /> api-worker</span>
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
                <p>Source records are available for operator review.</p>
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
            Illustrative interface. Sample content is not a live diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const visualRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: visualRef,
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
    <section className="landing-hero" aria-labelledby="landing-hero-title">
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
            {WORDS.map((word) => (
              <motion.span
                key={word}
                className="landing-hero-word"
                variants={entranceItem}
                aria-hidden="true"
              >
                {word}
              </motion.span>
            ))}
            <span className="sr-only">Evidence, not guesses</span>
          </motion.h1>

          <motion.p className="landing-hero-subtitle" variants={entranceItem}>
            Read-only diagnosis for failing pods, pipelines, and Terraform
            plans—with cited evidence your team can verify.
          </motion.p>

          <motion.div className="landing-hero-actions" variants={entranceItem}>
            <Link href="/sign-up" className="landing-button landing-button-primary">
              Start diagnosing <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/docs" className="landing-button landing-button-secondary">
              View docs
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          ref={visualRef}
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
          <motion.div
            className="landing-hero-mountain"
            style={{ y: imageY, scale: imageScale }}
            whileHover={reduceMotion ? undefined : { scale: 1.055 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Image
              src={heroMountain.src}
              alt={heroMountain.alt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, (max-width: 1200px) 94vw, 1152px"
              className="landing-mountain-image"
            />
          </motion.div>
          <div className="landing-hero-image-fade" aria-hidden="true" />
          <ProductMockup />
        </motion.div>

        <div id="integrations" className="landing-integrations-strip">
          <span className="landing-integrations-label">Works with</span>
          <span><Layers3 size={17} aria-hidden="true" /> Kubernetes</span>
          <span><GitBranch size={17} aria-hidden="true" /> GitHub Actions</span>
          <span><Activity size={17} aria-hidden="true" /> Prometheus</span>
          <span><FileSearch size={17} aria-hidden="true" /> Terraform</span>
        </div>
      </div>
    </section>
  );
}
