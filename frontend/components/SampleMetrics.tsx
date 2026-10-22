"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const METRICS = [
  { value: 1240, label: "Signals reviewed", suffix: "+" },
  { value: 98, label: "Evidence linked", suffix: "%" },
  { value: 3.2, label: "Minutes to triage", suffix: "m", decimals: 1 },
  { value: 4, label: "Connected surfaces", suffix: "" },
];

export function SampleMetrics() {
  const sectionRef = useRef<HTMLElement>(null);
  const [values, setValues] = useState(METRICS.map(() => 0));
  const [started, setStarted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (reducedMotion) {
      setValues(METRICS.map((metric) => metric.value));
      return;
    }

    let frame = 0;
    let startTime = 0;
    const duration = 1250;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValues(METRICS.map((metric) => metric.value * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, started]);

  return (
    <section ref={sectionRef} className="sample-metrics-section">
      <div className="shell py-16 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="label-caps">Sample workflow metrics</span>
            <h2 className="heading-display mt-3 text-3xl text-[var(--text)] sm:text-4xl">
              A clearer signal in the noise.
            </h2>
          </div>
          <span className="sample-data-label">Illustrative values · not customer results</span>
        </div>
        <div className="sample-metrics-grid">
          {METRICS.map((metric, index) => {
            const formatted = metric.decimals
              ? values[index].toFixed(metric.decimals)
              : Math.round(values[index]).toLocaleString();
            return (
              <div key={metric.label} className="sample-metric">
                <div className="sample-metric-value">
                  {formatted}
                  <span>{metric.suffix}</span>
                </div>
                <div className="sample-metric-label">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
