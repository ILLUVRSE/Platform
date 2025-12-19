import crypto from "crypto";
import { EventEmitter } from "events";

export type AgentCommand = {
  agentId: string;
  action: string;
  payload?: Record<string, unknown>;
};

export type AgentStatus = {
  id: string;
  action: string;
  status: "queued" | "running" | "completed" | "failed";
  message?: string;
  timestamp: number;
  agentId: string;
  proofSha?: string;
  policyVerdict?: string;
  latencyMs?: number;
  error?: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "executed" | "failed";

export type ApprovalRequest = {
  id: string;
  agentId: string;
  action: string;
  payload?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  status: ApprovalStatus;
  requestedBy?: string;
  approvedBy?: string;
  createdAt: number;
  decidedAt?: number;
  reason?: string;
  execution?: { ok: boolean; jobId?: string; status?: number; error?: string };
};

export type AgentJob = {
  id: string;
  agentId: string;
  action: string;
  kind: string;
  createdAt: number;
  lastStatus?: AgentStatus["status"];
  lastUpdatedAt?: string;
};

export const queue: AgentCommand[] = [];
export const statusByAgent: Record<string, AgentStatus[]> = {};
export const statusEmitter = new EventEmitter();
export const jobsById: Record<string, AgentJob> = {};
export const approvalRequests: ApprovalRequest[] = [];
export const approvalById: Record<string, ApprovalRequest> = {};
export const approvalEmitter = new EventEmitter();

const MAX_APPROVALS = 200;

export function pushStatus(agentId: string, status: AgentStatus) {
  statusByAgent[agentId] = [status, ...(statusByAgent[agentId] ?? [])].slice(0, 15);
  statusEmitter.emit("status", status);
}

export function trackJob(job: AgentJob) {
  jobsById[job.id] = job;
}

export function addApprovalRequest(data: Omit<ApprovalRequest, "id" | "status" | "createdAt">) {
  const request: ApprovalRequest = {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: Date.now(),
    ...data
  };
  approvalRequests.unshift(request);
  approvalById[request.id] = request;
  if (approvalRequests.length > MAX_APPROVALS) {
    const removed = approvalRequests.pop();
    if (removed) delete approvalById[removed.id];
  }
  approvalEmitter.emit("request", request);
  return request;
}

export function updateApprovalRequest(id: string, patch: Partial<ApprovalRequest>) {
  const request = approvalById[id];
  if (!request) return null;
  Object.assign(request, patch);
  approvalEmitter.emit("request", request);
  return request;
}
