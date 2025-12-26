import { NextResponse } from "next/server";
import { store } from "@studio/lib/store";

export async function GET() {
  const jobs = await store.getJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = body.prompt ?? "untitled";
  const proofSha = body.proofSha ?? `sha-${Date.now()}`;
  const job = {
    id: `job-${Date.now()}`,
    prompt,
    status: "queued" as const,
    proofSha,
    policyVerdict: body.policyVerdict ?? "SentinelNet PENDING",
    proof: { sha: proofSha, signer: "kernel-multisig", status: "pending" }
  };
  await store.addJob(job);
  return NextResponse.json({ job });
}
