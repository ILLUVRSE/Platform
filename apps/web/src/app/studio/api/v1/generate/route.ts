import { NextResponse } from "next/server";
import type { StorySphereGenerateRequest, StorySphereGenerateResponse } from "@illuvrse/contracts";
import { callUpstream } from "@studio/lib/upstream";
import { store } from "@studio/lib/store";
import { loadConfig } from "@studio/lib/config";
import { AgentManagerClient } from "@illuvrse/agent-manager";

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

  // AgentManager path
  const { agentManagerUrl } = loadConfig();
  if (agentManagerUrl) {
    try {
      const client = new AgentManagerClient(agentManagerUrl);
      const enqueue = await client.enqueueJob(
        "agent.story-weaver.001",
        "generate",
        { prompt, publish: body.publishToLiveLoop },
        { action: "generate.preview" }
      );
      const response: StorySphereGenerateResponse = {
        jobId: enqueue.jobId,
        status: "queued",
        previewEtaSeconds: 18,
        publishToLiveLoop: Boolean(body.publishToLiveLoop)
      };
      await store.addJob({
        id: enqueue.jobId,
        prompt,
        status: "queued" as const,
        proof: { sha: enqueue.jobId, signer: "kernel-multisig", status: "pending" }
      });
      return NextResponse.json(response);
    } catch (err) {
      console.warn("AgentManager enqueue failed", err);
    }
  }

  const response: StorySphereGenerateResponse = {
    jobId,
    status: "queued",
    previewEtaSeconds: 18,
    publishToLiveLoop: Boolean(body.publishToLiveLoop)
  };

  const job = { id: jobId, prompt, status: "queued" as const };
  await store.addJob({ ...job, proof: { sha: jobId, signer: "kernel-multisig", status: "pending" } });

  return NextResponse.json(response);
}
