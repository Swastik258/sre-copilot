export type DemoDiagnosisFixture = {
  pod: {
    namespace: string;
    name: string;
    phase: string;
  };
  diagnosis: {
    summary: string;
    confirmed_observations: string[];
    hypotheses: {
      statement: string;
      confidence: number;
      evidence_refs: string[];
    }[];
  };
  evidence: {
    reference: string;
    summary: string;
  }[];
};

// Captured from the deterministic Kubernetes rules engine and checked-in demo fixture.
export const DEMO_DIAGNOSES = {
  "prod/api-7d9f8b6c4-x2k9p": {
    pod: {
      namespace: "prod",
      name: "api-7d9f8b6c4-x2k9p",
      phase: "Running",
    },
    diagnosis: {
      summary: "Container api is in CrashLoopBackOff after 14 restarts.",
      confirmed_observations: [
        "Pod prod/api-7d9f8b6c4-x2k9p is in phase Running on node node-a",
        "Total container restart count: 14",
        "Container api last terminated: reason=Error, exitCode=1",
      ],
      hypotheses: [
        {
          statement: "Container api is in CrashLoopBackOff after 14 restarts.",
          confidence: 0.85,
          evidence_refs: ["pod/status#1"],
        },
        {
          statement:
            'Readiness/liveness probe failing: Readiness probe failed: Get "http://10.1.2.3:8080/healthz": dial tcp 10.1.2.3:8080: connect: connection refused',
          confidence: 0.7,
          evidence_refs: ["pod/events#2"],
        },
        {
          statement: "Logs indicate a dependency is refusing connections.",
          confidence: 0.6,
          evidence_refs: ["pod/logs#1"],
        },
      ],
    },
    evidence: [
      {
        reference: "pod/status#1",
        summary:
          "Container api: state=waiting reason=CrashLoopBackOff restarts=14 lastReason=Error lastExit=1",
      },
      {
        reference: "pod/status#2",
        summary: "Pod prod/api-7d9f8b6c4-x2k9p phase=Running node=node-a",
      },
      {
        reference: "pod/events#1",
        summary:
          "Event BackOff (Warning, count=14): Back-off restarting failed container api in pod api-7d9f8b6c4-x2k9p_prod",
      },
      {
        reference: "pod/events#2",
        summary:
          'Event Unhealthy (Warning, count=9): Readiness probe failed: Get "http://10.1.2.3:8080/healthz": dial tcp 10.1.2.3:8080: connect: connection refused',
      },
      {
        reference: "pod/logs#1",
        summary: "Pod logs (last 4 lines) for prod/api-7d9f8b6c4-x2k9p",
      },
    ],
  },
  "prod/worker-5f8c9d-oom1": {
    pod: {
      namespace: "prod",
      name: "worker-5f8c9d-oom1",
      phase: "Running",
    },
    diagnosis: {
      summary:
        "Container worker was terminated for exceeding its memory limit (OOMKilled).",
      confirmed_observations: [
        "Pod prod/worker-5f8c9d-oom1 is in phase Running on node node-b",
        "Total container restart count: 5",
        "Container worker last terminated: reason=OOMKilled, exitCode=137",
      ],
      hypotheses: [
        {
          statement:
            "Container worker was terminated for exceeding its memory limit (OOMKilled).",
          confidence: 0.9,
          evidence_refs: ["pod/status#1"],
        },
        {
          statement: "Container worker is in CrashLoopBackOff after 5 restarts.",
          confidence: 0.85,
          evidence_refs: ["pod/status#1"],
        },
        {
          statement: "Logs indicate the process ran out of memory.",
          confidence: 0.6,
          evidence_refs: ["pod/logs#1"],
        },
      ],
    },
    evidence: [
      {
        reference: "pod/status#1",
        summary:
          "Container worker: state=waiting reason=CrashLoopBackOff restarts=5 lastReason=OOMKilled lastExit=137",
      },
      {
        reference: "pod/status#2",
        summary: "Pod prod/worker-5f8c9d-oom1 phase=Running node=node-b",
      },
      {
        reference: "pod/events#1",
        summary:
          "Event BackOff (Warning, count=5): Back-off restarting failed container worker",
      },
      {
        reference: "pod/logs#1",
        summary: "Pod logs (last 3 lines) for prod/worker-5f8c9d-oom1",
      },
    ],
  },
  "staging/reporting-6c4b7d-i9p2": {
    pod: {
      namespace: "staging",
      name: "reporting-6c4b7d-i9p2",
      phase: "Pending",
    },
    diagnosis: {
      summary:
        "Container reporting cannot pull its image (registry.example.com/reporting:0.9.0-rc1).",
      confirmed_observations: [
        "Pod staging/reporting-6c4b7d-i9p2 is in phase Pending (not scheduled)",
        "Total container restart count: 0",
      ],
      hypotheses: [
        {
          statement:
            "Container reporting cannot pull its image (registry.example.com/reporting:0.9.0-rc1).",
          confidence: 0.88,
          evidence_refs: ["pod/status#1"],
        },
        {
          statement:
            "Pod reporting-6c4b7d-i9p2 is Pending and cannot be scheduled: 0/5 nodes are available: 5 Insufficient cpu.",
          confidence: 0.85,
          evidence_refs: ["pod/status#2", "pod/events#1"],
        },
      ],
    },
    evidence: [
      {
        reference: "pod/status#1",
        summary:
          "Container reporting: state=waiting reason=ErrImagePull restarts=0",
      },
      {
        reference: "pod/status#2",
        summary:
          "Pod staging/reporting-6c4b7d-i9p2 phase=Pending node=unassigned",
      },
      {
        reference: "pod/events#1",
        summary:
          "Scheduling failure: 0/5 nodes are available: 5 Insufficient cpu.",
      },
      {
        reference: "pod/events#2",
        summary:
          "Event FailedScheduling (Warning, count=3): 0/5 nodes are available: 5 Insufficient cpu.",
      },
      {
        reference: "pod/events#3",
        summary:
          'Event Failed (Warning, count=2): Failed to pull image "registry.example.com/reporting:0.9.0-rc1": not found',
      },
    ],
  },
} satisfies Record<string, DemoDiagnosisFixture>;
