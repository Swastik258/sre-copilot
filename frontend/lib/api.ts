/**
 * Typed API client for the Tarn backend.
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
  const method = (init?.method ?? "GET").toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrfToken =
    unsafe && typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("sre_csrf="))
          ?.split("=")
          .slice(1)
          .join("=")
      : undefined;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      // Send/receive the HttpOnly session cookie for authenticated calls.
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "X-CSRF-Token": decodeURIComponent(csrfToken) } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError(0, {
      code: "network_error",
      message: `Cannot reach the API${API_BASE ? ` at ${API_BASE}` : ""}. Is the backend running?`,
    });
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new ApiRequestError(res.status, {
        code: "invalid_api_response",
        message: `The API returned a non-JSON response (HTTP ${res.status}). Check NEXT_PUBLIC_API_URL and ensure the backend is reachable.`,
      });
    }
  }

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

// ---- Audit and settings ----

export type AuditEvent = {
  id: string;
  user_id?: string | null;
  action: string;
  actor: string;
  resource?: Record<string, unknown> | null;
  decision: string;
  reason?: string | null;
  outcome?: Record<string, unknown> | null;
  request_id?: string | null;
  created_at: string;
};

export type AuditEventListResponse = {
  events: AuditEvent[];
  total: number;
};

export type AuditRetentionResponse = {
  deleted: number;
  older_than_days: number;
};

export type SettingsResponse = {
  ai_provider: string;
  ai_model: string;
  ai_privacy_mode: boolean;
  ai_privacy_source: "environment" | "override";
  audit_retention_days: number;
  default_environment?: string | null;
  auth_required: boolean;
  rate_limit_per_minute: number;
  redaction_enabled: boolean;
  demo_mode: boolean;
  integrations: IntegrationInfo[];
};

export type SettingsUpdate = {
  audit_retention_days?: number;
  ai_privacy_mode?: boolean;
  default_environment?: string | null;
};

// ---- Authentication (local, self-hosted) ----

export type AuthUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  tenant_id: string;
  is_active: boolean;
  email_verified_at?: string | null;
  created_at: string;
};

export type AuthResponse = {
  user: AuthUser;
  verification_required?: boolean;
};

export type AdminUserListResponse = {
  users: AuthUser[];
  total: number;
};

export type AdminUserUpdate = {
  role?: "owner" | "admin" | "member" | "viewer";
  tenant_id?: string;
  is_active?: boolean;
};

export type TenantSummary = {
  tenant_id: string;
  name?: string | null;
  user_count: number;
};

export type TenantListResponse = {
  tenants: TenantSummary[];
  total: number;
};
export type SignupPayload = {
  email: string;
  password: string;
  display_name?: string | null;
};
export type LoginPayload = { email: string; password: string };

export type PlanId = "free" | "pro" | "team";

export type PlanInfo = {
  id: PlanId;
  name: string;
  description: string;
  status: "available" | "planned";
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
};

export type PlanCatalogResponse = {
  plans: PlanInfo[];
  billing_enabled: boolean;
  current_plan: PlanInfo | null;
};

export type UsageMetricSummary = {
  metric: string;
  quantity: number;
  events: number;
};

export type BillingUsageSummary = {
  organization_id: string;
  plan: PlanInfo;
  period_start: string;
  period_end: string;
  total_events: number;
  metrics: UsageMetricSummary[];
};

export type BillingState = {
  organization_id: string;
  plan: PlanInfo;
  billing_enabled: boolean;
  subscription: {
    provider: string;
    plan_id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
};

export type AccountSnapshot = {
  profile: { display_name: string | null; email: string | null };
  preferences: { theme: string; notifications: boolean };
  integrations: { kubernetes: boolean; github: boolean; prometheus: boolean };
  api_keys: { id: string; name: string; prefix: string; created_at: string }[];
  plan: string;
  role?: "owner" | "admin" | "member" | "viewer";
};

export type ApiKeyCreated = AccountSnapshot["api_keys"][number] & { key: string };

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

export type TerraformExplainResponse = {
  review: TerraformReviewResponse;
  explanation: AIStructuredDiagnosis;
};

// ---- Runbooks ----

export type RunbookStep = {
  title: string;
  action: string;
  command?: string | null;
  expected?: string | null;
  changes_state: boolean;
  risk: string;
};

export type Runbook = {
  id: string;
  title: string;
  category: string;
  severity: string;
  summary: string;
  symptoms: string[];
  applies_to: string[];
  steps: RunbookStep[];
  guardrails: string[];
};

export type RunbookListResponse = {
  runbooks: Runbook[];
  total: number;
};

export type RunbookMatchResponse = {
  runbook: Runbook;
  matched_on: string;
};

// ---- Infrastructure-code generation ----

export type InfraKind =
  | "kubernetes_deployment"
  | "kubernetes_service"
  | "terraform_module";

export type InfraGeneratePayload = {
  kind: InfraKind;
  name: string;
  namespace: string;
  image: string;
  replicas: number;
  port: number;
  environment: string;
  cpu_request: string;
  memory_request: string;
  cpu_limit: string;
  memory_limit: string;
  intent?: string | null;
};

export type GeneratedFile = {
  path: string;
  language: string;
  content: string;
};

export type InfraPolicyFinding = {
  severity: string;
  rule: string;
  message: string;
  path?: string | null;
};

export type InfraGenerateResponse = {
  kind: InfraKind;
  files: GeneratedFile[];
  findings: InfraPolicyFinding[];
  summary: string;
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

// ---- Local log analysis ----

export type LogSignature = {
  id: string;
  signature: string;
  severity: string;
  count: number;
  first_seen?: string | null;
  last_seen?: string | null;
  sample: string;
  frames: string[];
  evidence_id?: string | null;
};

export type LogAnalyzeResponse = {
  total_lines: number;
  parsed_lines: number;
  truncated: boolean;
  signatures: LogSignature[];
  summary: string;
  evidence: EvidenceRecord[];
  demo: boolean;
};

// ---- Prometheus metrics and correlation ----

export type MetricPoint = {
  timestamp: string;
  value: number;
};

export type MetricSeries = {
  name: string;
  labels: Record<string, string>;
  points: MetricPoint[];
};

export type MetricQueryResponse = {
  query: string;
  start: string;
  end: string;
  step: string;
  series: MetricSeries[];
  summary: string;
  evidence: EvidenceRecord[];
  demo: boolean;
};

export type CorrelationEvent = {
  timestamp: string;
  label: string;
  severity: string;
};

export type CorrelationMatch = {
  event_label: string;
  event_timestamp: string;
  metric_name: string;
  labels: Record<string, string>;
  observed_value: number;
  baseline_mean: number;
  baseline_stddev: number;
  z_score: number;
  direction: string;
  evidence_id?: string | null;
};

export type CorrelationResponse = {
  query: string;
  start: string;
  end: string;
  step: string;
  matches: CorrelationMatch[];
  summary: string;
  evidence: EvidenceRecord[];
  demo: boolean;
};

// ---- Investigations and assistant chat ----

export type InvestigationKind =
  | "kubernetes"
  | "github"
  | "logs"
  | "terraform"
  | "metrics"
  | "general";

export type InvestigationStatus = "open" | "in_progress" | "resolved" | "closed";

export type Investigation = {
  id: string;
  title: string;
  kind: InvestigationKind;
  status: InvestigationStatus;
  summary?: string | null;
  demo: boolean;
  created_at: string;
  updated_at: string;
};

export type InvestigationDetail = Investigation & {
  evidence_ids: string[];
  message_count: number;
};

export type InvestigationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  diagnosis?: Diagnosis | null;
  created_at: string;
};

export type InvestigationListResponse = {
  investigations: InvestigationDetail[];
  total: number;
};

export type InvestigationMessagesResponse = {
  investigation_id: string;
  messages: InvestigationMessage[];
};

export type InvestigationExchange = {
  user_message: InvestigationMessage;
  assistant_message: InvestigationMessage;
  diagnosis?: Diagnosis | null;
};

function clusterParam(cluster?: string): string {
  return cluster ? `?cluster=${encodeURIComponent(cluster)}` : "";
}

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
    refresh: () =>
      request<AuthResponse>("/api/v1/auth/refresh", { method: "POST" }),
    forgotPassword: (email: string) =>
      request<{ message: string }>("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<null>("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
    verifyEmail: (token: string) =>
      request<AuthUser>("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    resendVerification: () =>
      request<{ message: string }>("/api/v1/auth/resend-verification", {
        method: "POST",
      }),
    providers: () =>
      request<{ providers: string[]; email_password: boolean }>(
        "/api/v1/auth/providers",
      ),
    oauthUrl: (provider: string) =>
      `${API_BASE}/api/v1/auth/oauth/${encodeURIComponent(provider)}/start`,
    logout: () => request<null>("/api/v1/auth/logout", { method: "POST" }),
  },
  account: {
    get: () => request<AccountSnapshot>("/api/v1/account"),
    updateProfile: (payload: {
      display_name?: string | null;
      email?: string;
      current_password?: string;
    }) =>
      request<AccountSnapshot["profile"]>("/api/v1/account/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    updatePassword: (current_password: string, new_password: string) =>
      request<null>("/api/v1/account/password", {
        method: "POST",
        body: JSON.stringify({ current_password, new_password }),
      }),
    updatePreferences: (payload: Partial<AccountSnapshot["preferences"]>) =>
      request<AccountSnapshot["preferences"]>("/api/v1/account/preferences", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    updateIntegration: (kind: keyof AccountSnapshot["integrations"], connected: boolean) =>
      request<AccountSnapshot["integrations"]>(`/api/v1/account/integrations/${kind}`, {
        method: "PUT",
        body: JSON.stringify({ connected }),
      }),
    createApiKey: (name: string) =>
      request<ApiKeyCreated>("/api/v1/account/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    revokeApiKey: (id: string) =>
      request<null>(`/api/v1/account/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    delete: (password: string) =>
      request<null>("/api/v1/account", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }),
  },
  kubernetes: {
    clusters: () =>
      request<{ demo: boolean; clusters: K8sCluster[] }>("/api/v1/kubernetes/clusters"),
    namespaces: (cluster?: string) =>
      request<{ namespaces: { name: string }[] }>(
        `/api/v1/kubernetes/namespaces${clusterParam(cluster)}`,
      ),
    pods: (namespace?: string, cluster?: string) => {
      const search = new URLSearchParams();
      if (namespace) search.set("namespace", namespace);
      if (cluster) search.set("cluster", cluster);
      const suffix = search.toString() ? `?${search.toString()}` : "";
      return request<{ pods: K8sPod[] }>(`/api/v1/kubernetes/pods${suffix}`);
    },
    workloads: (namespace?: string, cluster?: string) => {
      const search = new URLSearchParams();
      if (namespace) search.set("namespace", namespace);
      if (cluster) search.set("cluster", cluster);
      const suffix = search.toString() ? `?${search.toString()}` : "";
      return request<{ workloads: K8sWorkload[] }>(
        `/api/v1/kubernetes/workloads${suffix}`,
      );
    },
    diagnose: (namespace: string, name: string, cluster?: string) =>
      request<PodDiagnosisResponse>(
        `/api/v1/kubernetes/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/diagnose${clusterParam(cluster)}`,
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
    explain: (plan: unknown, question?: string) =>
      request<TerraformExplainResponse>("/api/v1/terraform/explain", {
        method: "POST",
        body: JSON.stringify({ plan, question }),
      }),
  },
  runbooks: {
    list: (query?: string, category?: string) => {
      const search = new URLSearchParams();
      if (query) search.set("query", query);
      if (category) search.set("category", category);
      const suffix = search.toString() ? `?${search.toString()}` : "";
      return request<RunbookListResponse>(`/api/v1/runbooks${suffix}`);
    },
    get: (id: string) =>
      request<Runbook>(`/api/v1/runbooks/${encodeURIComponent(id)}`),
    match: (kind: string, signal?: string) =>
      request<RunbookMatchResponse>("/api/v1/runbooks/match", {
        method: "POST",
        body: JSON.stringify({ kind, signal }),
      }),
  },
  infra: {
    generate: (payload: InfraGeneratePayload) =>
      request<InfraGenerateResponse>("/api/v1/infra/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  logs: {
    analyze: (payload: {
      text: string;
      source?: string | null;
      environment?: string | null;
      limit?: number;
    }) =>
      request<LogAnalyzeResponse>("/api/v1/logs/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  metrics: {
    query: (query: string, minutes = 15, step = "15s") => {
      const search = new URLSearchParams({
        query,
        minutes: String(minutes),
        step,
      });
      return request<MetricQueryResponse>(`/api/v1/metrics/query?${search.toString()}`);
    },
    correlate: (payload: {
      query: string;
      minutes: number;
      step: string;
      events: CorrelationEvent[];
    }) =>
      request<CorrelationResponse>("/api/v1/metrics/correlate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  billing: {
    plans: () => request<PlanCatalogResponse>("/api/v1/billing/plans"),
    state: () => request<BillingState>("/api/v1/billing/state"),
    usage: () => request<BillingUsageSummary>("/api/v1/billing/usage"),
  },
  investigations: {
    list: (params?: { status?: InvestigationStatus; kind?: InvestigationKind; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set("status", params.status);
      if (params?.kind) search.set("kind", params.kind);
      if (params?.page) search.set("page", String(params.page));
      if (params?.page_size) search.set("page_size", String(params.page_size));
      const suffix = search.toString() ? `?${search.toString()}` : "";
      return request<InvestigationListResponse>(`/api/v1/investigations${suffix}`);
    },
    create: (payload: {
      title: string;
      kind?: InvestigationKind;
      environment?: string | null;
      target?: string | null;
    }) =>
      request<InvestigationDetail>("/api/v1/investigations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    get: (id: string) => request<InvestigationDetail>(`/api/v1/investigations/${id}`),
    messages: (id: string) =>
      request<InvestigationMessagesResponse>(`/api/v1/investigations/${id}/messages`),
    send: (id: string, content: string) =>
      request<InvestigationExchange>(`/api/v1/investigations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    evidence: (id: string) => request<EvidenceRecord[]>(`/api/v1/investigations/${id}/evidence`),
    close: (id: string) =>
      request<InvestigationDetail>(`/api/v1/investigations/${id}/close`, { method: "POST" }),
  },
  audit: {
    list: (params?: {
      limit?: number;
      offset?: number;
      action?: string;
      actor?: string;
      decision?: string;
    }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set("limit", String(params.limit));
      if (params?.offset) search.set("offset", String(params.offset));
      if (params?.action) search.set("action", params.action);
      if (params?.actor) search.set("actor", params.actor);
      if (params?.decision) search.set("decision", params.decision);
      const suffix = search.toString() ? `?${search.toString()}` : "";
      return request<AuditEventListResponse>(`/api/v1/audit-events${suffix}`);
    },
    exportUrl: () => `${API_BASE}/api/v1/audit-events/export.csv`,
    applyRetention: (olderThanDays: number) =>
      request<AuditRetentionResponse>(
        `/api/v1/audit-events?older_than_days=${olderThanDays}`,
        { method: "DELETE" },
      ),
  },
  settings: {
    get: () => request<SettingsResponse>("/api/v1/settings"),
    update: (payload: SettingsUpdate) =>
      request<SettingsResponse>("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },
  admin: {
    users: (tenantId?: string) => {
      const search = new URLSearchParams({ page_size: "200" });
      if (tenantId) search.set("tenant_id", tenantId);
      return request<AdminUserListResponse>(
        `/api/v1/admin/users?${search.toString()}`,
      );
    },
    updateUser: (userId: string, payload: AdminUserUpdate) =>
      request<AuthUser>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    tenants: () => request<TenantListResponse>("/api/v1/admin/tenants"),
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
