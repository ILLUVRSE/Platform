export type Job = { id: string; prompt: string; status: "queued" | "rendering" | "complete" };

export const jobs: Job[] = [
  { id: "job-1201", prompt: "Neon harbor at dawn", status: "rendering" },
  { id: "job-1200", prompt: "Riverport highlights", status: "complete" },
  { id: "job-1199", prompt: "Mirror maze trailer", status: "queued" }
];
