import type { AgentManagerState, JobRecord } from "../types";

function mark(state: AgentManagerState, job: JobRecord, patch: Partial<JobRecord>) {
  const next = { ...job, ...patch, updatedAt: new Date().toISOString() };
  state.jobs.set(job.id, next);
  return next;
}

export async function processSchedulerJobs(state: AgentManagerState) {
  const queued = Array.from(state.jobs.values()).filter((job) => job.kind === "schedule" && job.status === "queued");
  for (const job of queued) {
    const running = mark(state, job, { status: "running" });
    try {
      const playlistItem = {
        playlist: "liveloop-main",
        assetId: job.payload?.assetId ?? `asset-${job.id}`,
        scheduledFor: new Date().toISOString()
      };
      mark(state, running, { status: "complete", result: playlistItem });
    } catch (err) {
      mark(state, running, { status: "failed", error: (err as Error).message });
    }
  }
}
