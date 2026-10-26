"use client";

import { useState } from "react";
import { DEMO_DIAGNOSES } from "@/data/demo-diagnoses";

const SCENARIOS = [
  {
    label: "CrashLoopBackOff",
    fixture: "prod/api-7d9f8b6c4-x2k9p",
  },
  {
    label: "OOMKilled",
    fixture: "prod/worker-5f8c9d-oom1",
  },
  {
    label: "ImagePullBackOff / ErrImagePull",
    fixture: "staging/reporting-6c4b7d-i9p2",
  },
  {
    label: "Pending",
    fixture: "staging/reporting-6c4b7d-i9p2",
  },
  {
    label: "Failing readiness probe",
    fixture: "prod/api-7d9f8b6c4-x2k9p",
  },
] as const;

export function DiagnosisDemo() {
  const [selected, setSelected] = useState(0);
  const result = DEMO_DIAGNOSES[SCENARIOS[selected].fixture];
  const { diagnosis } = result;

  return (
    <section className="diagnosis-demo" aria-label="Try a sample diagnosis">
      <div className="diagnosis-demo-toolbar">
        <label htmlFor="demo-scenario">Choose a failure</label>
        <select
          id="demo-scenario"
          value={selected}
          onChange={(event) => setSelected(Number(event.currentTarget.value))}
        >
          {SCENARIOS.map((scenario, index) => (
            <option value={index} key={scenario.label}>{scenario.label}</option>
          ))}
        </select>
        <span className="demo-data-note">Demo data · rules-engine snapshot</span>
      </div>

      <div className="diagnosis-demo-content">
        <aside className="depth-scale" aria-label="Diagnosis depth">
          <span><b>0m</b> Observed</span>
          <span><b>1m</b> Evidence</span>
          <span><b>2m</b> Hypothesis</span>
        </aside>

        <div className="diagnosis-output" aria-live="polite">
          <p className="diagnosis-resource">
            {result.pod.namespace}/{result.pod.name} · {result.pod.phase}
          </p>
          <h2>{diagnosis.summary}</h2>

          <section className="diagnosis-depth-section">
            <h3>Observed facts</h3>
            <ul>
              {diagnosis.confirmed_observations.map((fact) => <li key={fact}>{fact}</li>)}
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
            <h3>Hypotheses</h3>
            <ul>
              {diagnosis.hypotheses.map((hypothesis) => (
                <li key={hypothesis.statement}>
                  <span className="hypothesis-text">{hypothesis.statement}</span>
                  <span className="hypothesis-confidence">
                    {Math.round(hypothesis.confidence * 100)}% confidence
                  </span>
                  {hypothesis.evidence_refs.length > 0 && (
                    <span className="evidence-inline">
                      {hypothesis.evidence_refs.map((reference) => (
                        <span className="evidence-reference" key={reference}>{reference}</span>
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
