export type Job = {
  id: string;
  prompt: string;
  status: "queued" | "rendering" | "complete";
  proof?: { sha: string; signer: string; status: "pending" | "signed" };
};

export const jobs: Job[] = [
  { id: "job-1201", prompt: "Neon harbor at dawn", status: "rendering", proof: { sha: "sha-job-1201", signer: "kernel", status: "pending" } },
  { id: "job-1200", prompt: "Riverport highlights", status: "complete", proof: { sha: "sha-job-1200", signer: "kernel", status: "signed" } },
  { id: "job-1199", prompt: "Mirror maze trailer", status: "queued" }
];
