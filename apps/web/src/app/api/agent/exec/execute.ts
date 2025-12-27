import crypto from "crypto";
import { env } from "process";
import { mapActionToJobKind } from "../agent-manager";
import { queue, pushStatus, trackJob, type AgentCommand, type AgentStatus } from "../store";
import { getRegistryManifestById } from "@/lib/aceRegistry";
import prisma from "@news/lib/prisma";
import { logAudit } from "@news/lib/audit";
import { executeProposal } from "@news/lib/publish";

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

type NewsProposalResult = {
  ok: boolean;
  status: number;
  proposalId?: string;
  message: string;
  body?: Record<string, unknown>;
};

function isNewsAction(action: string) {
  return action.startsWith("news.");
}

function readPayloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

async function createNewsProposal(body: AgentExecRequest): Promise<NewsProposalResult> {
  const payload = body.payload ?? {};
  const approvedBy = typeof body.approvedBy === "string" ? body.approvedBy.trim() : "";
  const requestedBy = typeof body.requestedBy === "string" ? body.requestedBy.trim() : "";
  const actor = approvedBy || requestedBy || body.agentId;
  const directive = readPayloadString(payload, "directive");
  const topic = readPayloadString(payload, "topic") || directive;
  const message = readPayloadString(payload, "message") || directive;
  const region = readPayloadString(payload, "region") || "WORLD";
  const language = readPayloadString(payload, "language") || "en";
  const severity = readPayloadString(payload, "severity") || "info";

  const hasDb = Boolean(env.DATABASE_URL);
  const stubId = crypto.randomUUID();
  const autoApprove = Boolean(approvedBy);
  const approvers = autoApprove ? [approvedBy] : [];

  if (body.action === "news.pitch") {
    if (!topic) {
      return { ok: false, status: 400, message: "Pitch requires a directive or topic." };
    }
    if (!hasDb) {
      return {
        ok: true,
        status: 200,
        proposalId: stubId,
        message: "Pitch queued (database not configured).",
        body: { ok: true, proposalId: stubId, type: "news.pitch", stub: true }
      };
    }
    try {
      const proposal = await prisma.proposal.create({
        data: {
          type: "news.pitch",
          region,
          language,
          data: {
            topic,
            directive,
            agentId: body.agentId,
            requestedBy,
            source: payload.source ?? "playground"
          },
          requiredApprovals: 1,
          ...(autoApprove ? { status: "approved", approvers } : {})
        }
      });
      await logAudit({
        actor,
        action: "news.pitch.proposal",
        entityId: proposal.id,
        entityType: "proposal",
        summary: `News pitch proposed by ${body.agentId}`,
        metadata: { proposalId: proposal.id, topic }
      });
      const execution = autoApprove ? await executeProposal(proposal.id) : null;
      if (execution && !execution.ok) {
        return {
          ok: false,
          status: 400,
          proposalId: proposal.id,
          message: execution.error ?? "Pitch execution failed",
          body: { ok: false, error: execution.error, proposalId: proposal.id }
        };
      }
      const executedMessage = execution?.ok ? `${execution.message} (${proposal.id.slice(0, 6)}...).` : "";
      return {
        ok: true,
        status: 200,
        proposalId: proposal.id,
        message: autoApprove
          ? executedMessage || `Pitch approved (${proposal.id.slice(0, 6)}...).`
          : `Pitch queued for approval (${proposal.id.slice(0, 6)}...).`,
        body: { ok: true, proposalId: proposal.id, type: proposal.type }
      };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: `Pitch proposal failed: ${(err as Error).message}`
      };
    }
  }

  if (body.action === "news.alert") {
    if (!message) {
      return { ok: false, status: 400, message: "Alert requires a directive or message." };
    }
    if (!hasDb) {
      return {
        ok: true,
        status: 200,
        proposalId: stubId,
        message: "Alert proposal queued (database not configured).",
        body: { ok: true, proposalId: stubId, type: "alert.publish", stub: true }
      };
    }
    const requiredApprovals = autoApprove ? 1 : severity === "critical" ? 2 : 1;
    try {
      const proposal = await prisma.proposal.create({
        data: {
          type: "alert.publish",
          region,
          language,
          severity,
          data: {
            message,
            region,
            language,
            severity,
            agentId: body.agentId,
            requestedBy,
            source: payload.source ?? "playground"
          },
          requiredApprovals,
          ...(autoApprove ? { status: "approved", approvers } : {})
        }
      });
      await logAudit({
        actor,
        action: "alert.proposal.create",
        entityId: proposal.id,
        entityType: "proposal",
        summary: `Alert proposal created (${severity})`,
        metadata: { proposalId: proposal.id, region, language }
      });
      const execution = autoApprove ? await executeProposal(proposal.id) : null;
      if (execution && !execution.ok) {
        return {
          ok: false,
          status: 400,
          proposalId: proposal.id,
          message: execution.error ?? "Alert execution failed",
          body: { ok: false, error: execution.error, proposalId: proposal.id }
        };
      }
      const executedMessage = execution?.ok ? `${execution.message} (${proposal.id.slice(0, 6)}...).` : "";
      return {
        ok: true,
        status: 200,
        proposalId: proposal.id,
        message: autoApprove
          ? executedMessage || `Alert approved (${proposal.id.slice(0, 6)}...).`
          : `Alert queued for approval (${proposal.id.slice(0, 6)}...).`,
        body: { ok: true, proposalId: proposal.id, type: proposal.type }
      };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: `Alert proposal failed: ${(err as Error).message}`
      };
    }
  }

  if (body.action === "news.publish.article") {
    const articleId = readPayloadString(payload, "articleId") || readPayloadString(payload, "entityId");
    if (!articleId) {
      return { ok: false, status: 400, message: "Publish requires articleId in the payload." };
    }
    if (!hasDb) {
      return {
        ok: true,
        status: 200,
        proposalId: stubId,
        message: "Publish proposal queued (database not configured).",
        body: { ok: true, proposalId: stubId, type: "publish.article", stub: true }
      };
    }
    try {
      const proposal = await prisma.proposal.create({
        data: {
          type: "publish.article",
          entityId: articleId,
          region,
          language,
          data: {
            directive,
            agentId: body.agentId,
            requestedBy,
            source: payload.source ?? "playground"
          },
          requiredApprovals: 1,
          ...(autoApprove ? { status: "approved", approvers } : {})
        }
      });
      await logAudit({
        actor,
        action: "publish.proposal.create",
        entityId: proposal.id,
        entityType: "proposal",
        summary: `Publish proposal created for article ${articleId}`,
        metadata: { proposalId: proposal.id, articleId }
      });
      const execution = autoApprove ? await executeProposal(proposal.id) : null;
      if (execution && !execution.ok) {
        return {
          ok: false,
          status: 400,
          proposalId: proposal.id,
          message: execution.error ?? "Publish execution failed",
          body: { ok: false, error: execution.error, proposalId: proposal.id }
        };
      }
      const executedMessage = execution?.ok ? `${execution.message} (${proposal.id.slice(0, 6)}...).` : "";
      return {
        ok: true,
        status: 200,
        proposalId: proposal.id,
        message: autoApprove
          ? executedMessage || `Publish approved (${proposal.id.slice(0, 6)}...).`
          : `Publish queued for approval (${proposal.id.slice(0, 6)}...).`,
        body: { ok: true, proposalId: proposal.id, type: proposal.type }
      };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        message: `Publish proposal failed: ${(err as Error).message}`
      };
    }
  }

  return { ok: false, status: 400, message: `Unsupported news action: ${body.action}` };
}

async function handleNewsAction(body: AgentExecRequest): Promise<ExecResult> {
  const start = Date.now();
  const entry: AgentStatus = {
    id: `${body.agentId}-${start}`,
    action: body.action,
    status: "queued",
    agentId: body.agentId,
    timestamp: start,
    message: "Drafting news proposal"
  };
  pushStatus(body.agentId, entry);
  setTimeout(() => {
    pushStatus(body.agentId, {
      ...entry,
      status: "running",
      timestamp: Date.now(),
      message: "Routing to News approvals"
    });
  }, 250);

  const result = await createNewsProposal(body);
  const doneStatus: AgentStatus = {
    ...entry,
    status: result.ok ? "completed" : "failed",
    timestamp: Date.now(),
    message: result.message,
    latencyMs: Date.now() - start
  };
  pushStatus(body.agentId, doneStatus);

  return {
    ok: result.ok,
    status: result.status,
    body: result.body ?? { ok: result.ok, message: result.message, proposalId: result.proposalId }
  };
}

export async function executeAgentAction(body: AgentExecRequest): Promise<ExecResult> {
  if (isNewsAction(body.action)) {
    return handleNewsAction(body);
  }
  const backend = env.AGENT_BACKEND_URL ?? "http://localhost:4040";
  const token = env.AGENT_BACKEND_TOKEN;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const manifest = body.manifest ?? getRegistryManifestById(body.agentId);
  if (backend) {
    try {
      const baseUrl = backend.replace(/\/$/, "");
      if (manifest) {
        const registerRes = await fetch(`${baseUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ manifest })
        });
        if (!registerRes.ok) {
          return { ok: false, status: registerRes.status, body: { error: "Agent register failed" } };
        }
      }

      const kind = mapActionToJobKind(body.action);
      const jobRes = await fetch(`${baseUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
