import type { AgentManagerState, JobRecord } from "../types";

function mark(state: AgentManagerState, job: JobRecord, patch: Partial<JobRecord>) {
  const next = { ...job, ...patch, updatedAt: new Date().toISOString() };
  state.jobs.set(job.id, next);
  return next;
}

export async function processGeneratorJobs(state: AgentManagerState) {
  const queued = Array.from(state.jobs.values()).filter((job) => job.kind === "generate" && job.status === "queued");
  for (const job of queued) {
    const running = mark(state, job, { status: "running" });
    try {
      const previewUrl = `s3://previews/${job.id}.mp4`;
      mark(state, running, {
        status: "complete",
        result: {
          previewUrl,
          etaSeconds: 0
        }
      });
    } catch (err) {
      mark(state, running, { status: "failed", error: (err as Error).message });
    }
  }
}
