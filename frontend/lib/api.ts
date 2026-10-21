/**
 * Typed API client for the SRE Copilot backend.
 *
 * - Single place that knows the API base URL.
 * - Unwraps the backend's standard error envelope.
 * - Never exposes secrets: only server-provided, already-redacted data is used.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8000"
).replace(/\/$/, "");

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  request_id?: string | null;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string | null;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.requestId = body.request_id;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      // Send/receive the HttpOnly session cookie for authenticated calls.
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError(0, {
      code: "network_error",
      message: `Cannot reach the API at ${API_BASE}. Is the backend running?`,
    });
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const body = (json as { error?: ApiErrorBody } | null)?.error ?? {
      code: `http_${res.status}`,
      message: res.statusText || "Request failed",
    };
    throw new ApiRequestError(res.status, body);
  }
  return json as T;
}

// ---- Types mirroring backend schemas ----

export type Health = {
  status: string;
  database: string;
  version?: string | null;
  environment?: string | null;
  ai_provider?: string | null;
  demo_mode?: boolean | null;
  integrations_enabled?: string[] | null;
};

export type IntegrationState =
  | "connected"
  | "enabled"
  | "unconfigured"
  | "demo"
  | "disabled";

export type IntegrationInfo = {
  kind: string;
  name: string;
  state: IntegrationState;
  enabled: boolean;
  read_only: boolean;
  detail?: string | null;
  demo: boolean;
};

export type IntegrationsResponse = {
  demo_mode: boolean;
  integrations: IntegrationInfo[];
};

// ---- Authentication (local, self-hosted) ----

export type AuthUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
};

export type AuthResponse = { user: AuthUser };
export type SignupPayload = {
  email: string;
  password: string;
  display_name?: string | null;
};
export type LoginPayload = { email: string; password: string };

// ---- Kubernetes (read-only) ----

export type K8sCluster = {
  name: string;
  source: string;
  demo: boolean;
  context?: string | null;
};

export type K8sContainerStatus = {
  name: string;
  image?: string | null;
  ready: boolean;
  restart_count: number;
  state: string;
  reason?: string | null;
  message?: string | null;
  exit_code?: number | null;
  last_reason?: string | null;
  last_exit_code?: number | null;
};

export type K8sPod = {
  namespace: string;
  name: string;
  phase: string;
  node_name?: string | null;
  labels: Record<string, string>;
  containers: K8sContainerStatus[];
  conditions: { type: string; status: string; reason?: string | null; message?: string | null }[];
  created_at?: string | null;
  deletion_timestamp?: string | null;
};

export type K8sWorkload = {
  namespace: string;
  name: string;
  kind: string;
  desired?: number | null;
  ready?: number | null;
  available?: number | null;
  images: string[];
};

export type DiagnosisHypothesis = {
  statement: string;
  confidence: number;
  evidence_ids: string[];
  reasoning?: string | null;
  alternative: boolean;
};

export type DiagnosisStep = {
  action: string;
  purpose?: string | null;
  expected_output?: string | null;
  changes_state: boolean;
  risk: string;
};

export type DiagnosisRemediation = {
  title: string;
  description: string;
  changes_state: boolean;
  risk: string;
  preconditions: string[];
  rollback?: string | null;
  verification?: string | null;
  requires_approval: boolean;
};

export type Diagnosis = {
  summary: string;
  impact?: string | null;
  confirmed_observations: string[];
  hypotheses: DiagnosisHypothesis[];
  evidence_ids: string[];
  confidence: number;
  confidence_basis?: string | null;
  missing_evidence: string[];
  next_steps: DiagnosisStep[];
  remediation: DiagnosisRemediation[];
  risk_level: string;
  model_generated: boolean;
  model_provider?: string | null;
  model_name?: string | null;
};

export type EvidenceRecord = {
  id: string;
  source_type: string;
  source_resource?: string | null;
  environment?: string | null;
  timestamp?: string | null;
  collected_at: string;
  severity: string;
  summary: string;
  payload?: unknown;
  provenance?: string | null;
  integrity?: string | null;
  redacted: boolean;
  demo: boolean;
};

export type PodDiagnosisResponse = {
  cluster: K8sCluster;
  pod: K8sPod;
  diagnosis: Diagnosis;
  evidence: EvidenceRecord[];
};

// ---- GitHub Actions (read-only) ----

export type GitHubRun = {
  id: number;
  name?: string | null;
  display_title?: string | null;
  run_number?: number | null;
  run_attempt?: number | null;
  event?: string | null;
  status: string;
  conclusion?: string | null;
  branch?: string | null;
  head_sha?: string | null;
  actor?: string | null;
  workflow_path?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  html_url?: string | null;
  demo: boolean;
};

export type GitHubStep = {
  number?: number | null;
  name: string;
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type GitHubJob = {
  id: number;
  name: string;
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  runner_name?: string | null;
  html_url?: string | null;
  steps: GitHubStep[];
};

export type GitHubRunsResponse = {
  repo: string;
  runs: GitHubRun[];
  demo: boolean;
};

export type GitHubRunResponse = {
  repo: string;
  run: GitHubRun;
  jobs: GitHubJob[];
  demo: boolean;
};

export type GitHubDiagnosisResponse = {
  repo: string;
  run: GitHubRun;
  jobs: GitHubJob[];
  diagnosis: Diagnosis;
  evidence: EvidenceRecord[];
  demo: boolean;
};

// ---- Terraform plan review ----

export type TerraformSummary = {
  total: number;
  create: number;
  update: number;
  replace: number;
  destroy: number;
  read: number;
  no_op: number;
  unknown: number;
  blast_radius: "none" | "low" | "medium" | "high" | "critical";
  headline: string;
};

export type TerraformChange = {
  address: string;
  type?: string | null;
  name?: string | null;
  provider?: string | null;
  module?: string | null;
  actions: string[];
  action: "create" | "update" | "replace" | "destroy" | "read" | "no-op" | "unknown";
  action_reason?: string | null;
  replace_paths: string[];
  changed_attributes: string[];
  unknown_attributes: string[];
  stateful: boolean;
  risk: "low" | "medium" | "high" | "critical";
  risk_reasons: string[];
};

export type TerraformFinding = {
  severity: string;
  title: string;
  detail: string;
  address?: string | null;
  action: string;
  evidence_id?: string | null;
};

export type TerraformReviewResponse = {
  format_version?: string | null;
  terraform_version?: string | null;
  summary: TerraformSummary;
  changes: TerraformChange[];
  findings: TerraformFinding[];
  evidence: EvidenceRecord[];
  demo: boolean;
};

// ---- AI-assisted diagnosis ----

export type AIHypothesis = {
  explanation: string;
  confidence: number;
  evidence_ids: string[];
};

export type AIProposedAction = {
  description: string;
  changes_state: boolean;
  risk: "low" | "medium" | "high";
  requires_approval: boolean;
};

export type AIStructuredDiagnosis = {
  summary: string;
  confidence: number;
  confidence_basis?: string | null;
  hypotheses: AIHypothesis[];
  evidence_ids: string[];
  next_steps: string[];
  proposed_remediation: AIProposedAction[];
  risks: string[];
  unknowns: string[];
  observed_evidence: EvidenceRecord[];
  risk_level: string;
  model_generated: boolean;
  model_provider?: string | null;
  model_name?: string | null;
  demo: boolean;
};

export const api = {
  health: () => request<Health>("/api/v1/health"),
  integrations: () => request<IntegrationsResponse>("/api/v1/integrations"),
  auth: {
    /** Current user, or null when there is no valid session (401). */
    me: async (): Promise<AuthUser | null> => {
      try {
        return await request<AuthUser>("/api/v1/auth/me");
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) return null;
        throw err;
      }
    },
    signup: (payload: SignupPayload) =>
      request<AuthResponse>("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload: LoginPayload) =>
      request<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    logout: () => request<null>("/api/v1/auth/logout", { method: "POST" }),
  },
  kubernetes: {
    clusters: () =>
      request<{ demo: boolean; clusters: K8sCluster[] }>("/api/v1/kubernetes/clusters"),
    namespaces: () =>
      request<{ namespaces: { name: string }[] }>("/api/v1/kubernetes/namespaces"),
    pods: (namespace?: string) =>
      request<{ pods: K8sPod[] }>(
        `/api/v1/kubernetes/pods${namespace ? `?namespace=${encodeURIComponent(namespace)}` : ""}`,
      ),
    workloads: (namespace?: string) =>
      request<{ workloads: K8sWorkload[] }>(
        `/api/v1/kubernetes/workloads${namespace ? `?namespace=${encodeURIComponent(namespace)}` : ""}`,
      ),
    diagnose: (namespace: string, name: string) =>
      request<PodDiagnosisResponse>(
        `/api/v1/kubernetes/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/diagnose`,
        { method: "POST" },
      ),
  },
  github: {
    runs: (repo: string, branch?: string, limit = 20) => {
      const params = new URLSearchParams({ repo, limit: String(limit) });
      if (branch) params.set("branch", branch);
      return request<GitHubRunsResponse>(`/api/v1/github/runs?${params.toString()}`);
    },
    run: (repo: string, runId: number) => {
      const params = new URLSearchParams({ repo });
      return request<GitHubRunResponse>(
        `/api/v1/github/runs/${runId}?${params.toString()}`,
      );
    },
    diagnose: (repo: string, runId: number) => {
      const params = new URLSearchParams({ repo });
      return request<GitHubDiagnosisResponse>(
        `/api/v1/github/runs/${runId}/diagnose?${params.toString()}`,
        { method: "POST" },
      );
    },
  },
  terraform: {
    review: (plan: unknown) =>
      request<TerraformReviewResponse>("/api/v1/terraform/review", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
  },
  ai: {
    diagnose: (payload: {
      question: string;
      surface: "kubernetes" | "logs" | "cicd" | "terraform" | "unknown";
      evidence: EvidenceRecord[];
    }) =>
      request<AIStructuredDiagnosis>("/api/v1/ai/diagnose", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
};

export { API_BASE };
