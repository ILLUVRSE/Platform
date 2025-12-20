import type { AceAgentManifest } from "@illuvrse/contracts";

export type AgentStatus = "registered" | "starting" | "running" | "stopped" | "error";

export type AgentRecord = {
  manifest: AceAgentManifest;
  status: AgentStatus;
  lastHeartbeat?: string;
  error?: string;
};

export type JobKind = "generate" | "proof" | "schedule";

export type JobStatus = "queued" | "running" | "complete" | "failed";

export type JobRecord = {
  id: string;
  kind: JobKind;
  agentId: string;
  action?: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentStreamEvent = {
  id: string;
  agentId: string;
  action?: string;
  status: "queued" | "running" | "completed" | "failed";
  message?: string;
  timestamp: number;
  proofSha?: string;
  policyVerdict?: string;
  latencyMs?: number;
};

export type AgentManagerState = {
  agents: Map<string, AgentRecord>;
  jobs: Map<string, JobRecord>;
};

export type AgentManagerConfig = {
  port?: number;
  hostname?: string;
};
