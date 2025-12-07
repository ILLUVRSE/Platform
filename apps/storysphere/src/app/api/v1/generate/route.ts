import { NextResponse } from "next/server";
import type { StorySphereGenerateRequest, StorySphereGenerateResponse } from "@illuvrse/contracts";
import { readJson, writeJson } from "../../../../lib/dataLoader";
import { jobs as defaultJobs } from "../../../../lib/jobsData";
import { callUpstream } from "../../../../lib/upstream";
import { store } from "../../../../lib/store";
import { loadConfig } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StorySphereGenerateRequest;
  const prompt = body.prompt ?? "untitled";
  const jobId = `job-${Date.now()}`;

  const { storysphereBackendUrl } = loadConfig();
  const upstream = storysphereBackendUrl;
  const upstreamRes = await callUpstream<StorySphereGenerateResponse>({
    baseUrl: upstream,
    path: "/generate",
    method: "POST",
    body,
    tokenEnv: "STORYSPHERE_TOKEN"
  });
  if (upstreamRes.ok) {
    return NextResponse.json(upstreamRes.data);
  }

  const response: StorySphereGenerateResponse = {
    jobId,
    status: "queued",
    previewEtaSeconds: 18,
    publishToLiveLoop: Boolean(body.publishToLiveLoop)
  };

  const job = { id: jobId, prompt, status: "queued" as const };
  await store.addJob(job);

  return NextResponse.json(response);
}
