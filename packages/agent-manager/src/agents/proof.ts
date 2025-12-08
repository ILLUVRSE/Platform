import type { AgentManagerState, JobRecord } from "../types";

function mark(state: AgentManagerState, job: JobRecord, patch: Partial<JobRecord>) {
  const next = { ...job, ...patch, updatedAt: new Date().toISOString() };
  state.jobs.set(job.id, next);
  return next;
}

export async function processProofJobs(state: AgentManagerState) {
  const queued = Array.from(state.jobs.values()).filter((job) => job.kind === "proof" && job.status === "queued");
  for (const job of queued) {
    const running = mark(state, job, { status: "running" });
    try {
      const proof = {
        signature: `stub-signature-${job.id}`,
        ledgerUrl: `/ledger/${job.id}`
      };
      mark(state, running, { status: "complete", result: proof });
    } catch (err) {
      mark(state, running, { status: "failed", error: (err as Error).message });
    }
  }
}
