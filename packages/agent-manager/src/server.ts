import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import crypto from "crypto";
import type { AgentManagerConfig, AgentManagerState, AgentRecord, JobRecord, JobKind } from "./types";

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
      const body = await readBody<{ kind: JobKind; agentId: string; payload?: Record<string, unknown> }>(req).catch(
        () => ({} as any)
      );
      if (!body.agentId || !state.agents.has(body.agentId)) return sendJson(res, 404, { error: "agent not found" });
      if (!body.kind) return sendJson(res, 400, { error: "job kind required" });
      const id = crypto.randomUUID();
      const job: JobRecord = {
        id,
        kind: body.kind,
        agentId: body.agentId,
        payload: body.payload ?? {},
        status: "queued",
        createdAt: now(),
        updatedAt: now()
      };
      state.jobs.set(id, job);
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
