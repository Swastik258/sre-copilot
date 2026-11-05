/**
 * Typed client for the workspace isolation APIs.
 *
 * The workspace is the tenant boundary. The URL (`/w/[slug]/...`) is the only
 * source of truth for the active workspace; nothing here ever sends a
 * workspace id in a request body.
 */

import { request } from "@/lib/api";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type Workspace = {
  id: string;
  slug: string;
  name: string;
  role: WorkspaceRole;
  created_at: string;
};

export type WorkspaceListResponse = {
  workspaces: Workspace[];
  total: number;
};

export type WorkspaceMember = {
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  role: WorkspaceRole;
  created_at: string;
};

export type WorkspaceMembersResponse = {
  members: WorkspaceMember[];
  total: number;
};

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
};

export type InvitesResponse = {
  invites: WorkspaceInvite[];
  total: number;
};

export type InviteCreated = WorkspaceInvite & {
  /** Raw single-use token, shown exactly once. */
  token: string;
};

export type InviteAcceptResponse = {
  workspace: Workspace;
};

export type WorkspaceCluster = {
  id: string;
  name: string;
  context?: string | null;
  server?: string | null;
  enabled: boolean;
  created_at: string;
};

export type WorkspaceClusterListResponse = {
  clusters: WorkspaceCluster[];
  total: number;
};

export type ClusterVerifyResult = {
  ok: boolean;
  cluster: string;
  namespaces?: number | null;
  error?: string | null;
};

export const workspaceApi = {
  list: () => request<WorkspaceListResponse>("/api/v1/workspaces"),

  create: (name: string) =>
    request<Workspace>("/api/v1/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  get: (slug: string) =>
    request<Workspace>(`/api/v1/workspaces/${encodeURIComponent(slug)}`),

  update: (slug: string, payload: { name?: string; settings?: Record<string, unknown> }) =>
    request<Workspace>(`/api/v1/workspaces/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (slug: string, confirm: string) =>
    request<null>(`/api/v1/workspaces/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      body: JSON.stringify({ confirm }),
    }),

  members: (slug: string) =>
    request<WorkspaceMembersResponse>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/members`,
    ),

  addMember: (slug: string, email: string, role: WorkspaceRole) =>
    request<WorkspaceMember>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/members`,
      { method: "POST", body: JSON.stringify({ email, role }) },
    ),

  updateMemberRole: (slug: string, userId: string, role: WorkspaceRole) =>
    request<WorkspaceMember>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      { method: "PATCH", body: JSON.stringify({ role }) },
    ),

  removeMember: (slug: string, userId: string) =>
    request<null>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    ),

  invites: (slug: string) =>
    request<InvitesResponse>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/invites`,
    ),

  createInvite: (slug: string, email: string, role: WorkspaceRole) =>
    request<InviteCreated>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/invites`,
      { method: "POST", body: JSON.stringify({ email, role }) },
    ),

  cancelInvite: (slug: string, inviteId: string) =>
    request<null>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/invites/${encodeURIComponent(inviteId)}`,
      { method: "DELETE" },
    ),

  acceptInvite: (token: string) =>
    request<InviteAcceptResponse>(
      `/api/v1/invites/${encodeURIComponent(token)}/accept`,
      { method: "POST" },
    ),

  // ---- Per-workspace Kubernetes clusters ("bring your own cluster") ----

  registeredClusters: (slug: string) =>
    request<WorkspaceClusterListResponse>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/kubernetes/integrations`,
    ),

  registerCluster: (
    slug: string,
    payload: { name: string; kubeconfig: string; context?: string },
  ) =>
    request<WorkspaceCluster>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/kubernetes/integrations`,
      { method: "POST", body: JSON.stringify(payload) },
    ),

  deleteCluster: (slug: string, integrationId: string) =>
    request<null>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/kubernetes/integrations/${encodeURIComponent(integrationId)}`,
      { method: "DELETE" },
    ),

  verifyCluster: (slug: string, integrationId: string) =>
    request<ClusterVerifyResult>(
      `/api/v1/workspaces/${encodeURIComponent(slug)}/kubernetes/integrations/${encodeURIComponent(integrationId)}/verify`,
      { method: "POST" },
    ),
};
