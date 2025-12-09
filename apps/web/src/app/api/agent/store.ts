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
};

export const queue: AgentCommand[] = [];
export const statusByAgent: Record<string, AgentStatus[]> = {};
export const statusEmitter = new EventEmitter();

export function pushStatus(agentId: string, status: AgentStatus) {
  statusByAgent[agentId] = [status, ...(statusByAgent[agentId] ?? [])].slice(0, 15);
  statusEmitter.emit("status", status);
}
