"use client";

import { useState } from "react";
import { DepthScale } from "@/components/editorial";
import { DEMO_DIAGNOSES } from "@/data/demo-diagnoses";

const SCENARIOS = [
  {
    label: "CrashLoopBackOff",
    fixture: "prod/api-7d9f8b6c4-x2k9p",
    detail: "api container, 14 restarts",
  },
  {
    label: "OOMKilled",
    fixture: "prod/worker-5f8c9d-oom1",
    detail: "worker container, exit 137",
  },
  {
    label: "ImagePullBackOff",
    fixture: "staging/reporting-6c4b7d-i9p2",
    detail: "reporting image not found",
  },
  {
    label: "Pending",
    fixture: "staging/batch-7c8f5d-q2m4n",
    detail: "no node has enough memory",
  },
  {
    label: "Failing readiness probe",
    fixture: "prod/edge-6f9c7b-probe",
    detail: "edge process not yet listening",
  },
] as const;

export function DiagnosisDemo() {
  const [selected, setSelected] = useState(0);
  const scenario = SCENARIOS[selected];
  const result = DEMO_DIAGNOSES[scenario.fixture];
  const { diagnosis } = result;

  return (
    <section className="diagnosis-demo" aria-label="Sample diagnosis">
      <div className="diagnosis-demo-toolbar">
        <label htmlFor="demo-scenario">Failure</label>
        <select
          id="demo-scenario"
          value={selected}
          onChange={(event) => setSelected(Number(event.currentTarget.value))}
        >
          {SCENARIOS.map((item, index) => (
            <option value={index} key={item.fixture + item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="demo-data-note">Demo data · rules-engine snapshot</span>
      </div>

      <div className="diagnosis-demo-content">
        <DepthScale
          compact
          items={[
            { mark: "0m", label: "Observed" },
            { mark: "1m", label: "Evidence" },
            { mark: "2m", label: "Hypothesis" },
          ]}
        />

        <div className="diagnosis-output" aria-live="polite">
          <p className="diagnosis-resource">
            {result.pod.namespace}/{result.pod.name} · {result.pod.phase}
            <span aria-hidden="true"> · </span>
            {scenario.detail}
          </p>
          <h2>{diagnosis.summary}</h2>

          <section className="diagnosis-depth-section">
            <h3>Observed facts</h3>
            <ul>
              {diagnosis.confirmed_observations.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>

          <section className="diagnosis-depth-section">
            <h3>Evidence</h3>
            <ul className="evidence-list">
              {result.evidence.map((item) => (
                <li key={item.reference}>
                  <span>{item.summary}</span>
                  <span className="evidence-reference">{item.reference}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="diagnosis-depth-section">
            <h3>Ranked hypotheses</h3>
            <p className="diagnosis-note">
              Interpretations, not confirmed facts. Confidence belongs to the
              rules engine; the evidence stays attached.
            </p>
            <ul>
              {diagnosis.hypotheses.map((hypothesis, index) => (
                <li key={`${scenario.fixture}-${index}`}>
                  <span className="hypothesis-text">{hypothesis.statement}</span>
                  <span className="hypothesis-confidence">
                    {Math.round(hypothesis.confidence * 100)}%
                  </span>
                  {hypothesis.evidence_refs.length > 0 && (
                    <span className="evidence-inline">
                      {hypothesis.evidence_refs.map((reference) => (
                        <span className="evidence-reference" key={reference}>
                          {reference}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
