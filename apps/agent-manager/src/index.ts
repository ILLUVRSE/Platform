import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import crypto from "crypto";
import { EventEmitter } from "events";
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import type { AgentRecord, AgentStreamEvent, JobKind, JobRecord } from "@illuvrse/agent-manager";
import { prisma } from "@illuvrse/db";

const port = Number(process.env.PORT ?? 4040);
const token = process.env.AGENT_BACKEND_TOKEN;
const queueUrl = process.env.AGENT_QUEUE_URL;
const pollIntervalMs = Number(process.env.AGENT_POLL_INTERVAL_MS ?? 2000);
const maxStatus = Number(process.env.AGENT_MAX_STATUS ?? 20);
const dbEnabled = Boolean(process.env.DATABASE_URL);
const worldStateUrl = process.env.WORLD_STATE_URL;
const worldToken = process.env.WORLD_TOKEN;

const sqs = queueUrl ? new SQSClient({ region: process.env.AWS_REGION }) : null;

const agents = new Map<string, AgentRecord>();
const jobs = new Map<string, JobRecord>();
const statusEmitter = new EventEmitter();
const statusByAgent = new Map<string, AgentStreamEvent[]>();

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (chunk) => chunks.push(Buffer.from(chunk)))
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

function getAuthToken(req: IncomingMessage) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  const alt = req.headers["x-illuvrse-token"];
  return Array.isArray(alt) ? alt[0] : alt;
}

function safeEqual(a?: string, b?: string) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function ensureAuth(req: IncomingMessage, res: ServerResponse) {
  if (!token) return true;
  const provided = getAuthToken(req);
  if (safeEqual(provided, token)) return true;
  sendJson(res, 401, { error: "unauthorized" });
  return false;
}

function now() {
  return new Date().toISOString();
}

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

async function persistJob(job: JobRecord) {
  if (!dbEnabled) return;
  try {
    await prisma.agentJob.upsert({
      where: { id: job.id },
      update: {
        status: job.status,
        result: job.result ?? undefined,
        error: job.error ?? undefined,
        updatedAt: new Date(job.updatedAt)
      },
      create: {
        id: job.id,
        agentId: job.agentId,
        kind: job.kind,
        action: job.action,
        payload: job.payload,
        status: job.status,
        result: job.result ?? undefined,
        error: job.error ?? undefined,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt)
      }
    });
  } catch (err) {
    console.warn("Failed to persist job", err);
  }
}

async function persistStatus(event: AgentStreamEvent, jobId: string) {
  if (!dbEnabled) return;
  try {
    await prisma.agentStatusEvent.create({
      data: {
        id: crypto.randomUUID(),
        jobId,
        agentId: event.agentId,
        action: event.action,
        status: event.status,
        message: event.message,
        proofSha: event.proofSha,
        policyVerdict: event.policyVerdict,
        latencyMs: event.latencyMs ? Math.round(event.latencyMs) : null,
        timestamp: new Date(event.timestamp)
      }
    });
  } catch (err) {
    console.warn("Failed to persist status event", err);
  }
}

async function pushStatus(job: JobRecord) {
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
  await persistStatus(event, job.id);
  await notifyWorld(event);
}

async function notifyWorld(event: AgentStreamEvent) {
  if (!worldStateUrl) return;
  try {
    await fetch(`${worldStateUrl.replace(/\/$/, "")}/events/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(worldToken ? { Authorization: `Bearer ${worldToken}` } : {})
      },
      body: JSON.stringify({ room: "playground", ...event })
    });
  } catch (err) {
    console.warn("World state notify failed", err);
  }
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

async function updateJob(job: JobRecord, patch: Partial<JobRecord>) {
  Object.assign(job, patch);
  job.updatedAt = now();
  await persistJob(job);
  await pushStatus(job);
}

async function executeJob(job: JobRecord) {
  await updateJob(job, { status: "running" });

  const delayMs = job.kind === "generate" ? 1400 : job.kind === "proof" ? 900 : 1100;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const payload = job.payload as { fail?: boolean } | undefined;
  if (payload?.fail) {
    await updateJob(job, { status: "failed", error: "Job failed by request" });
    return;
  }

  await updateJob(job, { status: "complete", result: buildResult(job) });
}

async function enqueueJob(job: JobRecord) {
  jobs.set(job.id, job);
  await persistJob(job);
  await pushStatus(job);

  if (sqs && queueUrl) {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(job)
      })
    );
    return;
  }

  void executeJob(job);
}

let pollActive = false;
async function pollQueue() {
  if (!sqs || !queueUrl || pollActive) return;
  pollActive = true;
  try {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10
      })
    );

    const messages = response.Messages ?? [];
    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle) continue;
      try {
        const parsed = JSON.parse(message.Body) as JobRecord;
        const job = jobs.get(parsed.id) ?? parsed;
        jobs.set(job.id, job);
        await executeJob(job);
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle
          })
        );
      } catch (err) {
        console.warn("Failed to process job", err);
      }
    }
  } finally {
    pollActive = false;
  }
}

setInterval(pollQueue, pollIntervalMs).unref();

const server = createServer(async (req, res) => {
  const url = parse(req.url ?? "", true);
  const method = req.method ?? "GET";

  if (url.pathname === "/healthz" && method === "GET") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (url.pathname === "/metrics" && method === "GET") {
    const counts = {
      total: jobs.size,
      queued: Array.from(jobs.values()).filter((j) => j.status === "queued").length,
      running: Array.from(jobs.values()).filter((j) => j.status === "running").length,
      complete: Array.from(jobs.values()).filter((j) => j.status === "complete").length,
      failed: Array.from(jobs.values()).filter((j) => j.status === "failed").length
    };
    return sendJson(res, 200, { agents: agents.size, jobs: counts });
  }

  if (url.pathname === "/register" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    try {
      const body = await readJson<{ manifest: AgentRecord["manifest"] }>(req);
      if (!body?.manifest?.id) {
        return sendJson(res, 400, { error: "manifest.id required" });
      }
      const record: AgentRecord = {
        manifest: body.manifest,
        status: "registered",
        lastHeartbeat: now()
      };
      agents.set(record.manifest.id, record);
      return sendJson(res, 200, { ok: true, agentId: record.manifest.id });
    } catch (err) {
      return sendJson(res, 400, { error: (err as Error).message });
    }
  }

  if (url.pathname === "/start" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<{ agentId: string }>(req).catch(() => ({} as any));
    const agent = body.agentId ? agents.get(body.agentId) : undefined;
    if (!agent) return sendJson(res, 404, { error: "agent not found" });
    agent.status = "running";
    agent.lastHeartbeat = now();
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/stop" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<{ agentId: string }>(req).catch(() => ({} as any));
    const agent = body.agentId ? agents.get(body.agentId) : undefined;
    if (!agent) return sendJson(res, 404, { error: "agent not found" });
    agent.status = "stopped";
    agent.lastHeartbeat = now();
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/heartbeat" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<{ agentId: string }>(req).catch(() => ({} as any));
    const agent = body.agentId ? agents.get(body.agentId) : undefined;
    if (!agent) return sendJson(res, 404, { error: "agent not found" });
    agent.lastHeartbeat = now();
    agent.status = "running";
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/jobs" && method === "POST") {
    if (!ensureAuth(req, res)) return;
    const body = await readJson<{ kind: JobKind; agentId: string; action?: string; payload?: Record<string, unknown> }>(req).catch(
      () => ({} as any)
    );
    if (!body.agentId || !agents.has(body.agentId)) return sendJson(res, 404, { error: "agent not found" });
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
    await enqueueJob(job);
    return sendJson(res, 200, { jobId: id, status: job.status });
  }

  if (url.pathname?.startsWith("/jobs/") && method === "GET") {
    if (!ensureAuth(req, res)) return;
    const id = url.pathname.split("/")[2];
    const job = jobs.get(id);
    if (!job) return sendJson(res, 404, { error: "job not found" });
    return sendJson(res, 200, job);
  }

  if (url.pathname === "/agents" && method === "GET") {
    if (!ensureAuth(req, res)) return;
    const list = Array.from(agents.values()).map((a) => ({
      id: a.manifest.id,
      status: a.status,
      lastHeartbeat: a.lastHeartbeat,
      capabilities: a.manifest.capabilities
    }));
    return sendJson(res, 200, { agents: list });
  }

  if (url.pathname === "/status" && method === "GET") {
    if (!ensureAuth(req, res)) return;
    const id = typeof url.query?.id === "string" ? url.query.id : "";
    if (!id) return sendJson(res, 400, { error: "id required" });

    if (dbEnabled) {
      try {
        const rows = await prisma.agentStatusEvent.findMany({
          where: { agentId: id },
          orderBy: { timestamp: "desc" },
          take: maxStatus
        });
        const statuses: AgentStreamEvent[] = rows.map((row) => ({
          id: row.jobId ?? row.id,
          agentId: row.agentId,
          action: row.action ?? undefined,
          status: row.status as AgentStreamEvent["status"],
          message: row.message ?? undefined,
          proofSha: row.proofSha ?? undefined,
          policyVerdict: row.policyVerdict ?? undefined,
          latencyMs: row.latencyMs ?? undefined,
          timestamp: row.timestamp.getTime()
        }));
        return sendJson(res, 200, { statuses });
      } catch (err) {
        console.warn("Failed to read statuses", err);
      }
    }

    const statuses = statusByAgent.get(id) ?? [];
    return sendJson(res, 200, { statuses });
  }

  if (url.pathname === "/stream" && method === "GET") {
    if (!ensureAuth(req, res)) return;
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
      if (latest) {
        send(latest);
      } else if (dbEnabled) {
        try {
          const [row] = await prisma.agentStatusEvent.findMany({
            where: { agentId: filterId },
            orderBy: { timestamp: "desc" },
            take: 1
          });
          if (row) {
            send({
              id: row.jobId ?? row.id,
              agentId: row.agentId,
              action: row.action ?? undefined,
              status: row.status as AgentStreamEvent["status"],
              message: row.message ?? undefined,
              proofSha: row.proofSha ?? undefined,
              policyVerdict: row.policyVerdict ?? undefined,
              latencyMs: row.latencyMs ?? undefined,
              timestamp: row.timestamp.getTime()
            });
          }
        } catch (err) {
          console.warn("Failed to seed status from DB", err);
        }
      }
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

  return sendJson(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`AgentManager service listening on ${port}`);
});
