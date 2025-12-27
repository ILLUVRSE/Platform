import type { JobKind, JobRecord } from "@illuvrse/agent-manager";
import { jobsById, pushStatus, type AgentJob, type AgentStatus } from "./store";

export function mapActionToJobKind(action: string): JobKind {
  if (action.startsWith("generate")) return "generate";
  if (action.startsWith("verify") || action.startsWith("proof")) return "proof";
  if (action.startsWith("publish") || action.startsWith("schedule") || action.startsWith("liveloop")) return "schedule";
  return "generate";
}

function mapJobStatus(status: JobRecord["status"]): AgentStatus["status"] {
  if (status === "complete") return "completed";
  return status;
}

function buildMessage(job: JobRecord, mappedStatus: AgentStatus["status"]) {
  const explicit = (job.result as { message?: string } | undefined)?.message;
  if (explicit) return explicit;
  if (mappedStatus === "queued") return "Queued in AgentManager";
  if (mappedStatus === "running") return "Running in AgentManager";
  if (mappedStatus === "completed") {
    if (job.kind === "generate") {
      const previewUrl = (job.result as { previewUrl?: string } | undefined)?.previewUrl;
      return previewUrl ? `Preview ready: ${previewUrl}` : "Generation complete";
    }
    if (job.kind === "schedule") return "Schedule complete";
    if (job.kind === "proof") return "Proof verified";
    return "Completed";
  }
  if (mappedStatus === "failed") return job.error ?? "Job failed";
  return undefined;
}

function buildProof(job: JobRecord) {
  const result = job.result as Record<string, unknown> | undefined;
  const signature = typeof result?.signature === "string" ? result.signature : undefined;
  const proofSha = typeof result?.proofSha === "string" ? result.proofSha : signature ? signature.slice(0, 12) : undefined;
  const policyVerdict = typeof result?.policyVerdict === "string" ? result.policyVerdict : undefined;
  if (!proofSha && !policyVerdict) return {};
  return {
    proofSha: proofSha ?? `proof-${job.id.slice(0, 6)}`,
    policyVerdict: policyVerdict ?? "PASS"
  };
}

export function mapJobToStatus(job: JobRecord, meta: AgentJob): AgentStatus {
  const mappedStatus = mapJobStatus(job.status);
  const timestamp = Date.parse(job.updatedAt);
  const createdAt = Date.parse(job.createdAt);
  const latencyMs = Number.isFinite(createdAt) && Number.isFinite(timestamp) ? timestamp - createdAt : undefined;
  return {
    id: job.id,
    action: meta.action,
    status: mappedStatus,
    agentId: meta.agentId,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    message: buildMessage(job, mappedStatus),
    latencyMs: latencyMs && latencyMs > 0 ? latencyMs : undefined,
    error: job.error,
    ...buildProof(job)
  };
}

export async function refreshAgentManagerJobs(baseUrl: string, filterId?: string) {
  const jobs = Object.values(jobsById).filter((job) => !filterId || job.agentId === filterId);
  if (!jobs.length) return;
  const token = process.env.AGENT_BACKEND_TOKEN;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  await Promise.all(
    jobs.map(async (meta) => {
      if (meta.lastStatus === "completed" || meta.lastStatus === "failed") return;
      const res = await fetch(`${baseUrl}/jobs/${meta.id}`, { cache: "no-store", headers: authHeaders });
      if (!res.ok) return;
      const job = (await res.json()) as JobRecord;
      if (meta.lastUpdatedAt === job.updatedAt) return;
      const status = mapJobToStatus(job, meta);
      meta.lastUpdatedAt = job.updatedAt;
      meta.lastStatus = status.status;
      pushStatus(meta.agentId, status);
    })
  );
}
