import { env } from "process";
import { mapActionToJobKind } from "../agent-manager";
import { queue, pushStatus, trackJob, type AgentCommand, type AgentStatus } from "../store";
import { getRegistryManifestById } from "@/lib/aceRegistry";

export type AgentExecRequest = {
  agentId: string;
  action: string;
  payload?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  approvedBy?: string;
  requestedBy?: string;
};

export type ExecResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

export async function executeAgentAction(body: AgentExecRequest): Promise<ExecResult> {
  const backend = env.AGENT_BACKEND_URL ?? "http://localhost:4040";
  const manifest = body.manifest ?? getRegistryManifestById(body.agentId);
  if (backend) {
    try {
      const baseUrl = backend.replace(/\/$/, "");
      if (manifest) {
        const registerRes = await fetch(`${baseUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manifest })
        });
        if (!registerRes.ok) {
          return { ok: false, status: registerRes.status, body: { error: "Agent register failed" } };
        }
      }

      const kind = mapActionToJobKind(body.action);
      const jobRes = await fetch(`${baseUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: body.agentId,
          kind,
          action: body.action,
          payload: body.payload ?? {}
        })
      });
      if (jobRes.ok) {
        const payload = (await jobRes.json()) as { jobId: string; status: string };
        const entry: AgentStatus = {
          id: payload.jobId,
          action: body.action,
          status: "queued",
          agentId: body.agentId,
          timestamp: Date.now(),
          message: "Queued in AgentManager"
        };
        trackJob({
          id: payload.jobId,
          agentId: body.agentId,
          action: body.action,
          kind,
          createdAt: Date.now()
        });
        pushStatus(body.agentId, entry);
        return {
          ok: true,
          status: 200,
          body: { ok: true, enqueued: entry, jobId: payload.jobId, backend: "agent-manager" }
        };
      }
      if (jobRes.status === 404) {
        return { ok: false, status: 404, body: { error: "Agent not registered" } };
      }
      return { ok: false, status: jobRes.status, body: { error: "AgentManager job enqueue failed" } };
    } catch (err) {
      // fall through to stub emitter if backend unavailable
      console.warn("Agent backend exec failed, using stub:", (err as Error).message);
    }
  }

  const command: AgentCommand = {
    agentId: body.agentId,
    action: body.action,
    payload: body.payload
  };
  queue.push(command);
  const entry: AgentStatus = {
    id: `${body.agentId}-${Date.now()}`,
    action: body.action,
    status: "queued",
    agentId: body.agentId,
    timestamp: Date.now(),
    message: "Queued in demo executor"
  };
  pushStatus(body.agentId, entry);
  const start = Date.now();
  setTimeout(() => {
      const running: AgentStatus = {
        ...entry,
        status: "running",
        agentId: body.agentId,
        timestamp: Date.now(),
        message: "Processing..."
      };
    pushStatus(body.agentId, running);
  }, 300);
  setTimeout(() => {
    const duration = Date.now() - start;
    const done: AgentStatus = {
      ...entry,
      status: "completed",
      agentId: body.agentId,
      timestamp: Date.now(),
      message: "Completed in demo executor",
      proofSha: `demo-sha-${body.agentId.slice(0, 4)}`,
      policyVerdict: "PASS",
      latencyMs: duration
    };
    pushStatus(body.agentId, done);
  }, 900);
  return { ok: true, status: 200, body: { ok: true, enqueued: entry, backend: "stub" } };
}
