export type Job = {
  id: string;
  prompt: string;
  status: "queued" | "rendering" | "complete";
  proof?: { sha: string; signer: string; status: "pending" | "signed" };
  proofSha?: string;
  policyVerdict?: string;
};

export const jobs: Job[] = [
  {
    id: "job-1201",
    prompt: "Neon harbor at dawn",
    status: "rendering",
    proof: { sha: "sha-job-1201", signer: "kernel", status: "pending" },
    proofSha: "sha-job-1201",
    policyVerdict: "SentinelNet PENDING"
  },
  {
    id: "job-1200",
    prompt: "Riverport highlights",
    status: "complete",
    proof: { sha: "sha-job-1200", signer: "kernel", status: "signed" },
    proofSha: "sha-job-1200",
    policyVerdict: "SentinelNet PASS"
  },
  { id: "job-1199", prompt: "Mirror maze trailer", status: "queued", proofSha: "sha-job-1199", policyVerdict: "SentinelNet PENDING" }
];
