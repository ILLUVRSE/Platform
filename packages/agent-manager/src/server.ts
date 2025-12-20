import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import crypto from "crypto";
import { EventEmitter } from "events";
import type { AgentManagerConfig, AgentManagerState, AgentRecord, JobRecord, JobKind, AgentStreamEvent } from "./types";

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (c) => chunks.push(Buffer.from(c)))
      .on("end", () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve(raw ? (JSON.parse(raw) as T) : ({} as T));
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

function now() {
  return new Date().toISOString();
}

export function createAgentManagerServer(config: AgentManagerConfig = {}) {
  const state: AgentManagerState = {
    agents: new Map(),
    jobs: new Map()
  };
  const statusEmitter = new EventEmitter();
  const statusByAgent = new Map<string, AgentStreamEvent[]>();
  const maxStatus = 20;

  function mapJobStatus(status: JobRecord["status"]): AgentStreamEvent["status"] {
    if (status === "complete") return "completed";
    return status;
  }

  function buildMessage(job: JobRecord, mappedStatus: AgentStreamEvent["status"]) {
    const explicit = (job.result as { message?: string } | undefined)?.message;
    if (explicit) return explicit;
    if (mappedStatus === "queued") return "Queued in AgentManager";
    if (mappedStatus === "running") return "Running in AgentManager";
    if (mappedStatus === "completed") {
      if (job.kind === "generate") {
        const previewUrl = (job.result as { previewUrl?: string } | undefined)?.previewUrl;
        return previewUrl ? `Preview ready: ${previewUrl}` : "Generation complete";
      }
      if (job.kind === "proof") return "Proof verified";
      if (job.kind === "schedule") {
        return job.action?.includes("liveloop") ? "LiveLoop scheduled" : "Schedule complete";
      }
      return "Completed";
    }
    if (mappedStatus === "failed") return job.error ?? "Job failed";
    return undefined;
  }

  function buildProof(job: JobRecord) {
    const result = job.result as Record<string, unknown> | undefined;
    const proofSha =
      typeof result?.proofSha === "string"
        ? result.proofSha
        : typeof result?.signature === "string"
          ? result.signature.slice(0, 12)
          : undefined;
    const policyVerdict = typeof result?.policyVerdict === "string" ? result.policyVerdict : undefined;
    return { proofSha, policyVerdict };
  }

  function pushStatus(job: JobRecord) {
    const mappedStatus = mapJobStatus(job.status);
    const timestamp = Date.parse(job.updatedAt);
    const createdAt = Date.parse(job.createdAt);
    const latencyMs = Number.isFinite(createdAt) && Number.isFinite(timestamp) ? timestamp - createdAt : undefined;
    const event: AgentStreamEvent = {
      id: job.id,
      agentId: job.agentId,
      action: job.action,
      status: mappedStatus,
      message: buildMessage(job, mappedStatus),
      timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
      latencyMs: latencyMs && latencyMs > 0 ? latencyMs : undefined,
      ...buildProof(job)
    };
    const existing = statusByAgent.get(job.agentId) ?? [];
    statusByAgent.set(job.agentId, [event, ...existing].slice(0, maxStatus));
    statusEmitter.emit("status", event);
  }

  function updateJob(job: JobRecord, patch: Partial<JobRecord>) {
    Object.assign(job, patch);
    job.updatedAt = now();
    pushStatus(job);
  }

  function buildResult(job: JobRecord) {
    if (job.kind === "generate") {
      return {
        previewUrl: `https://cdn.illuvrse.local/previews/${job.id}.mp4`,
        proofSha: `gen-${job.id.slice(0, 12)}`,
        policyVerdict: "PASS"
      };
    }
    if (job.kind === "proof") {
      return {
        signature: `sig-${job.id}`,
        policyVerdict: "PASS"
      };
    }
    if (job.kind === "schedule") {
      return {
        scheduleId: `schedule-${job.id.slice(0, 6)}`,
        proofSha: `schedule-${job.id.slice(0, 12)}`,
        policyVerdict: "PASS"
      };
    }
    return {};
  }

  function runJob(job: JobRecord) {
    const startDelay = 250;
    const finishDelay = job.kind === "generate" ? 1400 : job.kind === "proof" ? 900 : 1100;
    setTimeout(() => {
      updateJob(job, { status: "running" });
    }, startDelay);

    setTimeout(() => {
      const payload = job.payload as { fail?: boolean } | undefined;
      if (payload?.fail) {
        updateJob(job, { status: "failed", error: "Job failed by request" });
        return;
      }
      updateJob(job, { status: "complete", result: buildResult(job) });
    }, startDelay + finishDelay);
  }

  const server = createServer(async (req, res) => {
    const url = parse(req.url ?? "", true);
    const method = req.method ?? "GET";

    // Health
    if (url.pathname === "/healthz" && method === "GET") {
      return sendJson(res, 200, { status: "ok" });
    }

    // Metrics
    if (url.pathname === "/metrics" && method === "GET") {
      const jobs = {
        total: state.jobs.size,
        queued: Array.from(state.jobs.values()).filter((j) => j.status === "queued").length,
        running: Array.from(state.jobs.values()).filter((j) => j.status === "running").length,
        complete: Array.from(state.jobs.values()).filter((j) => j.status === "complete").length,
        failed: Array.from(state.jobs.values()).filter((j) => j.status === "failed").length
      };
      return sendJson(res, 200, { agents: state.agents.size, jobs });
    }

    // Register manifest
    if (url.pathname === "/register" && method === "POST") {
      try {
        const body = await readBody<{ manifest: AgentRecord["manifest"] }>(req);
        if (!body?.manifest?.id) {
          return sendJson(res, 400, { error: "manifest.id required" });
        }
        const record: AgentRecord = {
          manifest: body.manifest,
          status: "registered",
          lastHeartbeat: now()
        };
        state.agents.set(record.manifest.id, record);
        return sendJson(res, 200, { ok: true, agentId: record.manifest.id });
      } catch (err) {
        return sendJson(res, 400, { error: (err as Error).message });
      }
    }

    // Start agent
    if (url.pathname === "/start" && method === "POST") {
      const body = await readBody<{ agentId: string }>(req).catch(() => ({} as any));
      const agent = body.agentId ? state.agents.get(body.agentId) : undefined;
      if (!agent) return sendJson(res, 404, { error: "agent not found" });
      agent.status = "running";
      agent.lastHeartbeat = now();
      return sendJson(res, 200, { ok: true });
    }

    // Stop agent
    if (url.pathname === "/stop" && method === "POST") {
      const body = await readBody<{ agentId: string }>(req).catch(() => ({} as any));
      const agent = body.agentId ? state.agents.get(body.agentId) : undefined;
      if (!agent) return sendJson(res, 404, { error: "agent not found" });
      agent.status = "stopped";
      agent.lastHeartbeat = now();
      return sendJson(res, 200, { ok: true });
    }

    // Heartbeat
    if (url.pathname === "/heartbeat" && method === "POST") {
      const body = await readBody<{ agentId: string }>(req).catch(() => ({} as any));
      const agent = body.agentId ? state.agents.get(body.agentId) : undefined;
      if (!agent) return sendJson(res, 404, { error: "agent not found" });
      agent.lastHeartbeat = now();
      agent.status = "running";
      return sendJson(res, 200, { ok: true });
    }

    // Enqueue job
    if (url.pathname === "/jobs" && method === "POST") {
      const body = await readBody<{ kind: JobKind; agentId: string; action?: string; payload?: Record<string, unknown> }>(req).catch(
        () => ({} as any)
      );
      if (!body.agentId || !state.agents.has(body.agentId)) return sendJson(res, 404, { error: "agent not found" });
      if (!body.kind) return sendJson(res, 400, { error: "job kind required" });
      const id = crypto.randomUUID();
      const job: JobRecord = {
        id,
        kind: body.kind,
        agentId: body.agentId,
        action: body.action,
        payload: body.payload ?? {},
        status: "queued",
        createdAt: now(),
        updatedAt: now()
      };
      state.jobs.set(id, job);
      pushStatus(job);
      runJob(job);
      return sendJson(res, 200, { jobId: id, status: job.status });
    }

    // Get job
    if (url.pathname?.startsWith("/jobs/") && method === "GET") {
      const id = url.pathname.split("/")[2];
      const job = state.jobs.get(id);
      if (!job) return sendJson(res, 404, { error: "job not found" });
      return sendJson(res, 200, job);
    }

    // List agents
    if (url.pathname === "/agents" && method === "GET") {
      const agents = Array.from(state.agents.values()).map((a) => ({
        id: a.manifest.id,
        status: a.status,
        lastHeartbeat: a.lastHeartbeat,
        capabilities: a.manifest.capabilities
      }));
      return sendJson(res, 200, { agents });
    }

    if (url.pathname === "/status" && method === "GET") {
      const id = typeof url.query?.id === "string" ? url.query.id : "";
      if (!id) return sendJson(res, 400, { error: "id required" });
      const statuses = statusByAgent.get(id) ?? [];
      return sendJson(res, 200, { statuses });
    }

    if (url.pathname === "/stream" && method === "GET") {
      const filterId = typeof url.query?.id === "string" ? url.query.id : undefined;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });

      const send = (event: AgentStreamEvent) => {
        if (filterId && event.agentId !== filterId) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      if (filterId) {
        const latest = statusByAgent.get(filterId)?.[0];
        if (latest) send(latest);
      }

      const heartbeat = setInterval(() => {
        res.write(": ping\n\n");
      }, 15000);

      statusEmitter.on("status", send);
      res.write(": connected\n\n");

      req.on("close", () => {
        clearInterval(heartbeat);
        statusEmitter.off("status", send);
      });
      return;
    }

    sendJson(res, 404, { error: "not found" });
  });

  const port = config.port ?? 4040;
  const hostname = config.hostname ?? "0.0.0.0";

  return {
    state,
    server,
    listen: () =>
      new Promise<void>((resolve) => {
        server.listen(port, hostname, () => resolve());
      })
  };
}
