"use client";

import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { Pause, Play } from "lucide-react";
import { AuthHeader } from "@/components/AuthHeader";
import { heroMountain } from "@/lib/images";

type AuthMode = "login" | "signup";

const features = [
  {
    title: "Read-only diagnosis",
    description: "Review infrastructure signals without applying changes.",
  },
  {
    title: "Cited evidence",
    description: "Follow each finding back to its source.",
  },
  {
    title: "Facts vs hypotheses",
    description: "See observations kept distinct from possible causes.",
  },
];

function FeatureCarousel() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused || interacting) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % features.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [interacting, paused, reduceMotion]);

  const feature = features[active];

  return (
    <div
      className="auth-feature-carousel"
      role="region"
      aria-label="Tarn product features"
      aria-roledescription="carousel"
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteracting(false);
        }
      }}
    >
      <article
        key={feature.title}
        className="auth-feature-slide"
        role="group"
        aria-roledescription="slide"
        aria-label={`${active + 1} of ${features.length}`}
      >
        <h2>{feature.title}</h2>
        <p>{feature.description}</p>
      </article>

      <div className="auth-carousel-controls" aria-label="Carousel controls">
        <div className="auth-carousel-dots">
          {features.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Show ${item.title}`}
              aria-current={active === index ? "true" : undefined}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="auth-carousel-toggle"
          aria-label={paused ? "Resume carousel" : "Pause carousel"}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export function AuthPacket({
  children,
  mode,
}: {
  children: ReactNode;
  mode: AuthMode;
}) {
  const reduceMotion = useReducedMotion();
  const imageX = useMotionValue(0);
  const imageY = useMotionValue(0);
  const smoothX = useSpring(imageX, { stiffness: 55, damping: 22 });
  const smoothY = useSpring(imageY, { stiffness: 55, damping: 22 });

  function moveImage(event: PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    imageX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * -10);
    imageY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -10);
  }

  function resetImage() {
    imageX.set(0);
    imageY.set(0);
  }

  return (
    <div className="auth-packet">
      <section className="auth-left" aria-label="Account access">
        <div className="auth-left-inner">
          <div className="auth-local-brand auth-stagger-item">
            <AuthHeader variant="panel" />
          </div>
          <div className="auth-form-slot auth-stagger-item">
            {children}
          </div>
          <p className="auth-readonly auth-stagger-item">
            <span aria-hidden="true" />
            Read-only by default.
          </p>
        </div>
      </section>

      <aside
        className="auth-story"
        aria-label="About Tarn"
        onPointerMove={moveImage}
        onPointerLeave={resetImage}
      >
        <motion.div
          className="auth-story-image"
          aria-hidden="true"
          style={{
            backgroundImage: `url("${heroMountain.src}")`,
            x: smoothX,
            y: smoothY,
            scale: 1.06,
          }}
        />
        <div className="auth-story-overlay" aria-hidden="true" />
        <div className="auth-ripples" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <header className="auth-story-header">
          <a href="/support">Contact support</a>
        </header>

        {mode === "signup" ? (
          <div className="auth-story-message">
            <h2>Evidence, not guesses.</h2>
          </div>
        ) : (
          <FeatureCarousel />
        )}

        <div className="auth-diagnosis-preview">
          <div className="auth-preview-topline">
            <span>Diagnosis preview</span>
            <span className="auth-citation-chip">Evidence references</span>
          </div>
          <h3>Observed facts, separate from possible causes.</h3>
          <p>Each finding stays connected to its source evidence.</p>
        </div>
      </aside>
    </div>
  );
}
