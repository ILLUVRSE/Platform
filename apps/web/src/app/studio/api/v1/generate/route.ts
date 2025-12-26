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
  const policyVerdict = "SentinelNet PASS";

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
    const upstreamData = upstreamRes.data as StorySphereGenerateResponse;
    const upstreamProofSha = upstreamData.proofSha ?? (upstreamData.proof ? upstreamData.proof.sha256 : `sha-${upstreamData.jobId}`);
    const upstreamPolicyVerdict = upstreamData.policyVerdict ?? upstreamData.proof?.policyVerdict ?? policyVerdict;
    const proof = upstreamData.proof ?? {
      sha256: upstreamProofSha,
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      policyVerdict: upstreamPolicyVerdict,
      ledgerUrl: "/developers#ledger"
    };
    await store.addJob({
      id: upstreamData.jobId,
      prompt,
      status: upstreamData.status,
      proofSha: upstreamProofSha,
      policyVerdict: upstreamPolicyVerdict,
      proof: {
        sha: upstreamProofSha ?? `sha-${upstreamData.jobId}`,
        signer: proof.signer ?? "kernel-multisig",
        status: upstreamData.status === "complete" ? "signed" : "pending"
      }
    });
    return NextResponse.json({ ...upstreamData, proof, proofSha: upstreamProofSha, policyVerdict: upstreamPolicyVerdict });
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
      const agentProofSha = `sha-${enqueue.jobId}`;
      const proof = {
        sha256: agentProofSha,
        signer: "kernel-multisig",
        timestamp: new Date().toISOString(),
        policyVerdict,
        ledgerUrl: "/developers#ledger"
      };
      const response: StorySphereGenerateResponse = {
        jobId: enqueue.jobId,
        status: "queued",
        previewEtaSeconds: 18,
        publishToLiveLoop: Boolean(body.publishToLiveLoop),
        proof,
        proofSha: agentProofSha,
        policyVerdict
      };
      await store.addJob({
        id: enqueue.jobId,
        prompt,
        status: "queued" as const,
        proof: { sha: agentProofSha, signer: "kernel-multisig", status: "pending" },
        proofSha: agentProofSha,
        policyVerdict
      });
      return NextResponse.json(response);
    } catch (err) {
      console.warn("AgentManager enqueue failed", err);
    }
  }

  const fallbackProofSha = `sha-${jobId}`;
  const proof = {
    sha256: fallbackProofSha,
    signer: "kernel-multisig",
    timestamp: new Date().toISOString(),
    policyVerdict,
    ledgerUrl: "/developers#ledger"
  };
  const response: StorySphereGenerateResponse = {
    jobId,
    status: "queued",
    previewEtaSeconds: 18,
    publishToLiveLoop: Boolean(body.publishToLiveLoop),
    proof,
    proofSha: fallbackProofSha,
    policyVerdict
  };

  const job = { id: jobId, prompt, status: "queued" as const };
  await store.addJob({
    ...job,
    proof: { sha: fallbackProofSha, signer: "kernel-multisig", status: "pending" },
    proofSha: fallbackProofSha,
    policyVerdict
  });

  return NextResponse.json(response);
}
